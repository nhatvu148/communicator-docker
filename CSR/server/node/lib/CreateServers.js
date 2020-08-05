"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const createError = require("http-errors");
const http = require("http");
const https = require("https");
const morgan = require("morgan");
const httpProxy = require("http-proxy");
const SpawnerTypes_1 = require("./SpawnerTypes");
const Spawner_1 = require("./Spawner");
const Logging_1 = require("./Logging");
const Utils_1 = require("./Utils");
/** Top level function to create the express application object */
function _createExpressApp(config) {
    // The main node express application object. Set it up
    const app = express();
    // Allow CORS calls from fileServer to spawner
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "POST");
        res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers");
        next();
    });
    // create the main spawner instance
    const spawner = new Spawner_1.Spawner(config);
    app.set('spawner', spawner);
    // Middleware setup
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // Setup morgan logging for incoming REST calls
    if (config.logRestHttpRequestsAsLevel) {
        class LogStream {
            write(message) {
                // Allow the regex to filter entries out
                if (!config.logRestFilterRegex || !config.logRestFilterRegex.test(message)) {
                    Logging_1.logger().log(config.logRestHttpRequestsAsLevel, `${message.trim()}`);
                }
            }
        }
        const logStream = new LogStream();
        app.use(morgan('combined', { stream: logStream }));
    }
    // Setup routes
    const spawnerRouter = spawner.createRouter();
    app.use('/api/', spawnerRouter);
    // Compatibility with legacy server. This allows it to "just work"
    app.use('/', spawner.createServiceRouter());
    // Error handling
    app.use(onUnhandled);
    app.use(onError);
    return app;
}
/** Creates an http server */
function _createHttpServer(app, config, enableSsl) {
    return (enableSsl) ?
        https.createServer({ key: config.sslPrivateKey, cert: config.sslCertificate }, app) :
        http.createServer(app);
}
/** Creates the spawn REST server */
function createSpawnServer(config) {
    // Setup the Express application first
    const app = _createExpressApp(config);
    const spawner = app.get('spawner');
    const spawnRestServer = _createHttpServer(app, config, config.sslEnableSpawnServer);
    // Log proxy information. Note that for logging purposes we're using the public hostname 
    // since that's what the `broker` mode approach would receive in terms of a URI. 
    // SCW Note: We don't have a setting to enable/disable the spawn-server 
    // proxy. At this point it's just always enabled. If a customer prefers it disabled we 
    // can simply add that setting (like fileServerProxyViewerConnection) and check 
    // it here. Also consider that the file-server proxy is relying on this proxy, so if 
    // that setting is added then the file-server setting needs reconcile against it.
    const ssUseSsl = config.sslEnableSpawnServer;
    const ssHostname = Utils_1.getPublicHostname(config.publicHostname, config.ipVersion);
    const ssProxyUri = `${Utils_1.getWsProtocol(ssUseSsl)}://${ssHostname}:${config.spawnServerPort}`;
    Logging_1.logger().log(SpawnerTypes_1.LogLevel.Info, `spawn-server websocket proxy enabled: proxy-URI=${ssProxyUri}`);
    // We'll support direct websocket connection using a proxy. This might look like a connection
    // of the form: ws[s]://<our-host>:<spawnServerPort>?params. When the Node http server object
    // gets that request, it handles it by calling it an 'upgrade' as it's upgrading
    // the protocol from http to ws, then proxying it to our spawned ts3d_sc_server. 
    spawnRestServer.on('upgrade', function (req, socket, head) {
        if (req.headers['upgrade'] !== 'websocket') {
            socket.end('HTTP/1.1 400 Bad Request');
            return;
        }
        spawner.onWsRequest(req, socket, head);
    });
    return spawnRestServer;
}
exports.createSpawnServer = createSpawnServer;
/** Creates an express application object for HTTP file serving */
function createFileServer(config) {
    const fileServerApp = express();
    // Setup morgan to log http requests
    if (config.logFileHttpRequestsAsLevel) {
        class FileServerLogStream {
            write(message) {
                // Morgan sends us the string to be logged, and we use our logger to actually log it 
                Logging_1.logger().log(config.logFileHttpRequestsAsLevel, `FileServer: ${message.trim()}`);
            }
        }
        const logStream = new FileServerLogStream();
        fileServerApp.use(morgan('combined', { stream: logStream }));
    }
    // Set the content paths
    for (const staticPath of config.fileServerStaticAbsDirs) {
        fileServerApp.use(express.static(staticPath));
    }
    // And finally create the server
    const fileServer = _createHttpServer(fileServerApp, config, config.sslEnableFileServer);
    // If configured, setup the http file-server to directly accept `ws[s]://` URL's and
    // then proxy them to the spawn server
    if (config.fileServerProxyViewerConnections && config.spawnServerPort) {
        const ssUseSsl = config.sslEnableSpawnServer;
        // For the spawn-server proxy setup, note that we use the local name here as we're 
        // literally connecting the file-server to the spawn-server via this URI, and they will be 
        // on the same machine. Thus it doesn't make sense to use the public hostname unless 
        // SSL is involved. 
        const ssHostname = Utils_1.getLocalHostname(ssUseSsl, config.publicHostname, config.ipVersion);
        const ssProxyUri = `${(Utils_1.getWsProtocol(ssUseSsl))}://${ssHostname}:${config.spawnServerPort}`;
        // Add the proxy URI to the config only so it shows up in the status view
        config["fileServerProxyDestinationUri"] = ssProxyUri;
        // Log the file-server proxy information
        const fsUseSsl = config.sslEnableFileServer;
        const fsHostname = Utils_1.getPublicHostname(config.publicHostname, config.ipVersion);
        const fsProxyUri = `${(Utils_1.getWsProtocol(fsUseSsl))}://${fsHostname}:${config.fileServerPort}`;
        Logging_1.logger().log(SpawnerTypes_1.LogLevel.Info, `file-server websocket proxy enabled: proxy-URI=${fsProxyUri}`);
        // Setup the WS proxy handler
        const ssSslKeys = ssUseSsl ? { key: config.sslPrivateKey, cert: config.sslCertificate } : null;
        const ssProxyServer = httpProxy.createProxyServer({ target: ssProxyUri, ws: true, ssl: ssSslKeys, secure: ssUseSsl });
        fileServer.on('upgrade', function (req, socket, head) {
            ssProxyServer.ws(req, socket, head);
        });
        ssProxyServer.on('error', function (err, req, res) {
            Logging_1.logger().error(`file-server: proxy-error: ${err}`);
        });
    }
    return fileServer;
}
exports.createFileServer = createFileServer;
/**
 * Deal with unhandled requests
 */
function onUnhandled(req, res, next) {
    next(createError(404));
}
/**
 * Deal with errors and try to give a decent response
 */
function onError(err, req, res, next) {
    Logging_1.logger().warn(`SpawnerApp: request error=${err.message}, url='${req.url}'`);
    if (err.stack) {
        Logging_1.logger().debug(`SpawerApp: req/res error: stack: ${err.stack}`);
    }
    // Since we're meant to be REST, just return a json error
    res.status(err.status || 500).json({ "result": "error", "reason": err.message });
}
//# sourceMappingURL=CreateServers.js.map