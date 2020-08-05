#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
const process = require("process");
const fs = require("fs");
const os = require("os");
const program = require("commander");
const path = require("path");
const https = require("https");
const service = require("os-service");
// Local imports
const createServers = require("./CreateServers");
const SpawnerTypes_1 = require("./SpawnerTypes");
const Logging_1 = require("./Logging");
const Utils_1 = require("./Utils");
const SpawnerTypes_2 = require("./SpawnerTypes");
// Non-import dependencies
const rootDir = path.resolve(__dirname, "..");
// Constants / Types
const gQuietExitError = new Error("");
// Update this if we change versions of node
const kShippingNodeVersion = 'v10.16.2';
const kKnownCompatibleMajorVersion = 10;
// Globals
let gStartCount = 0;
let gCanUseTriggerShutdown = false;
let gShutdownCode = null;
let gFileServer = null;
let gSpawnServer = null;
// Let the 'service' module know we're starting. The 'service' module makes us a friendly service 
// on windows and linux. Thus on windows, we can be installed, started, stopped with `sc.exe` without 
// problem. When *not* being run as a service, this function and associated callback has no apparent effect
service.run(function () {
    // This is a callback indicating the service controller wants us to shutdown. 
    if (gCanUseTriggerShutdown) {
        triggerShutdown(0);
    }
    else {
        // Trigger shutdown hasn't been setup yet, so just punt and do the service stop now 
        service.stop();
    }
});
// Kick everything off. Try to catch any exceptions we've handled
try {
    main();
}
catch (err) {
    if (err !== gQuietExitError) {
        throw err; // Some unhandled exception happened, rethrow and let it print to the console
    }
}
/** Starts everything up. This will return on a successful startup. It may throw if the
 *  logger wasn't ready which will cause immediate node shutdown and console messages
 */
function main() {
    // Do the first setup where the logger isn't available
    const userConfig = readConfigAndSetupLogger();
    // The logger is now setup, so we can do the remaining startup and log any exceptions
    try {
        gCanUseTriggerShutdown = true;
        // Handle uncaught application exceptions 
        process.on('uncaughtException', err => {
            Logging_1.logger().error(`Fatal application error: ${err}`);
            triggerShutdown(1);
        });
        const appConfig = createAppConfigFromUserConfig(userConfig, rootDir, triggerShutdown);
        launchServers(appConfig);
    }
    catch (err) {
        Logging_1.logger().error(err.toString());
        triggerShutdown(1);
    }
}
/** Gets the UserConfig from a specified config file */
function readConfigAndSetupLogger() {
    // Process command line arguments to create the user config
    const userConfig = loadUserConfig();
    // Special validation case here... if the console logging cutoff is undefined, force it to 'warn' so 
    // that config warnings get shown... ie., avoid silent failed startups due to config problems
    const hasLogConsoleLevelCutoff = userConfig.hasOwnProperty("logConsoleLevelCutoff");
    if (!hasLogConsoleLevelCutoff) {
        // Emergency console warning in case createLogger fails 
        console.log(`Config did not define 'logConsoleLevelCutoff'. Forcing it to 'LogLevel.Warn'`);
        // @ts-ignore  Ignore readonly issue as we're intentionally forcing an undefined setting to something 
        // noinspection JSConstantReassignment
        userConfig.logConsoleLevelCutoff = SpawnerTypes_2.LogLevel.Warn;
    }
    // Setup logging. Once logging is ready, we can use the triggerShutdown() call for exiting
    // Note that currently we do no validation or config post-processing prior to setting
    // up logging. Keep it that way if possible.
    Logging_1.createLogger(userConfig);
    // And the real warning 
    if (!hasLogConsoleLevelCutoff) {
        Logging_1.logger().warn(`Configuration optional setting 'logConsoleLevelCutoff' is undefined. Recommend adding with the default value.`);
    }
    return userConfig;
}
/** Primary startup function that initializes everything and launches the configured http servers */
function launchServers(appConfig) {
    // Validate the node version now that we can log
    const nodeVersion = process.version;
    if (nodeVersion !== kShippingNodeVersion) {
        Logging_1.logger().warn(`This server has been tested to work with NodeJS ${kShippingNodeVersion}, but is being run with ${nodeVersion}`);
        const currentMajorVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
        if (currentMajorVersion < kKnownCompatibleMajorVersion) {
            Logging_1.logger().error(`This server will not work with NodeJS versions prior to ${kKnownCompatibleMajorVersion}`);
            triggerShutdown(1);
            return; // No more initialization
        }
    }
    // Handle kill requests so that we can exit reasonably
    process.on('SIGTERM', () => {
        triggerShutdown(0);
    });
    process.on('SIGINT', () => {
        triggerShutdown(0);
    });
    // Goes to 0 when everything is started
    gStartCount = (appConfig.spawnServerPort ? 1 : 0) + (appConfig.fileServerPort ? 1 : 0);
    // Create the optional HTTP file server
    if (appConfig.fileServerPort) {
        gFileServer = createServers.createFileServer(appConfig);
        gFileServer.on('error', (error) => {
            onHttpServerError(error, appConfig.fileServerPort);
        });
        gFileServer.on('listening', function () {
            const server = this;
            const useSsl = server instanceof https.Server;
            const port = server.address().port;
            Logging_1.logger().info(`HTTP file-server listening: port=${port}, SSL=${useSsl}`);
            onServerListening(appConfig);
        });
        listenWithServer(gFileServer, appConfig.fileServerPort, appConfig.ipVersion);
    }
    // Create the express app and start the spawner REST server
    if (appConfig.spawnServerPort) {
        gSpawnServer = createServers.createSpawnServer(appConfig);
        gSpawnServer.on('error', (error) => {
            onHttpServerError(error, appConfig.spawnServerPort);
        });
        gSpawnServer.on('listening', function () {
            const ssHttpProtocol = Utils_1.getHttpProtocol(appConfig.sslEnableSpawnServer);
            const ssHostname = Utils_1.getLocalHostname(appConfig.sslEnableSpawnServer, appConfig.publicHostname, appConfig.ipVersion);
            const curlExe = (os.platform() === "win32") ? "curl.exe" : "curl";
            Logging_1.logger().info(`Server help available via HTTP GET to endpoint api/help. ex:`);
            Logging_1.logger().info(`  ${curlExe} ${ssHttpProtocol}://${ssHostname}:${appConfig.spawnServerPort}/api/help`);
            if (appConfig.disableConsoleEnterToShutdown) {
                Logging_1.logger().info(`The server can be shutdown with an HTTP POST to api/shutdown. ex:`);
                Logging_1.logger().info(`  ${curlExe} -X POST ${ssHttpProtocol}://${ssHostname}:${appConfig.spawnServerPort}/api/shutdown`);
            }
            const server = this;
            const useSsl = server instanceof https.Server;
            const port = server.address().port;
            Logging_1.logger().info(`REST spawn-server listening: port=${port}, SSL=${useSsl}`);
            onServerListening(appConfig);
        });
        listenWithServer(gSpawnServer, appConfig.spawnServerPort, appConfig.ipVersion);
    }
    // Enable periodic forced GC. This has shown helpful for keeping the overall memory use
    // down during high-volume server churn
    if (appConfig.autoGcIntervalTime) {
        if (global.gc) {
            setInterval(global.gc, appConfig.autoGcIntervalTime * 1000);
            Logging_1.logger().info(`Periodic GC enabled every ${appConfig.autoGcIntervalTime} seconds`);
        }
        else {
            Logging_1.logger().warn(`autoGcIntervalTime is configured, but the garbage collector is disabled.`);
        }
    }
}
/** Cause the given server to start listening. Uses the IpVersion to determine how it listens */
function listenWithServer(server, port, ipVersion) {
    // See https://nodejs.org/dist/latest-v4.x/docs/api/http.html#http_server_listen_port_hostname_backlog_callback
    // for forcing ipv4/ipv6
    if (!ipVersion || ipVersion === SpawnerTypes_1.IPVersion.Auto) {
        // Auto mode for ipv4/ipv6
        server.listen(port);
    }
    else if (ipVersion === SpawnerTypes_1.IPVersion.ForceIPv4) {
        server.listen(port, "0.0.0.0");
    }
    else if (ipVersion === SpawnerTypes_1.IPVersion.ForceIPv6Disabled) {
        server.listen(port, "::");
    }
    else {
        throw new Error(`Invalid IpVersion setting: value='${ipVersion}'`);
    }
}
/** Call after each http listener is up and running */
function onServerListening(userConfig) {
    if (--gStartCount === 0) {
        // A legacy-server holdover - press "enter" key to kill the server
        if (!userConfig.disableConsoleEnterToShutdown) {
            const stdin = process.openStdin();
            stdin.on('data', function () {
                triggerShutdown(0);
            });
            console.log("");
            console.log("Successfully started HOOPS Communicator Viewer Services. Press the 'enter' key to stop.");
        }
    }
}
/** Event listener for HTTP server "error" event. */
function onHttpServerError(error, port) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            Logging_1.logger().error(`Startup: ${port} requires elevated privileges`);
            triggerShutdown(1);
            break;
        case 'EADDRINUSE':
            Logging_1.logger().error(`Startup: ${port} already in use`);
            triggerShutdown(1);
            break;
        default:
            throw error;
    }
}
/** Process our command line args and return an associated configuration */
function loadUserConfig() {
    const args = program
        .version('1.0.0')
        .option('-c, --config-file <config-file>', 'Path to user supplied config file')
        .parse(process.argv);
    // Use the specified config, otherwise figure out a reasonable alternative
    if (!args.configFile) {
        // Use the user-config if it exists.
        try {
            fs.accessSync(path.resolve(rootDir, "UserConfig.js"));
            args.configFile = path.resolve(rootDir, "UserConfig.js");
        }
        catch (err) {
            args.configFile = path.resolve(rootDir, "Config.js");
        }
    }
    else {
        args.configFile = path.resolve(rootDir, args.configFile);
    }
    // We should have figured out the config file. See if it's accessible
    try {
        fs.accessSync(args.configFile);
    }
    catch (err) {
        console.log(`Can't access config file: file='${args.configFile}': reason=${err.message}`);
        throw gQuietExitError;
    }
    // And read it in. In this case we rethrow since the full exception is probably helpful
    try {
        return require(args.configFile);
    }
    catch (err) {
        console.log(`Problem loading the configuration: config='${args.configFile}': reason=${err.message}`);
        throw err;
    }
}
/** Validate that a named user-config setting has been specified */
function errorIfSettingMissing(name, userConfig) {
    if (!userConfig.hasOwnProperty(name)) {
        throw new Error(`UserConfig setting '${name}' is missing`);
    }
    else {
        // The setting exists, but still ensure the associated value isn't "undefined". This can happen 
        // if the user makes a typo for that particular value, or an incorrectly named enum value
        if (userConfig[name] === undefined) {
            throw new Error(`The value for configuration setting '${name}' is undefined, check it for typos or incorrect enum values`);
        }
    }
}
/** Validate that a named user-config setting has been specified */
function warnIfSettingMissing(name, userConfig) {
    if (!userConfig.hasOwnProperty(name)) {
        Logging_1.logger().warn(`Configuration optional setting '${name}' is undefined. Recommend adding with the default value.`);
    }
    else {
        // The setting exists, but still ensure the associated value isn't "undefined". 
        if (userConfig[name] === undefined) {
            Logging_1.logger().warn(`The value for configuration setting '${name}' is undefined, check it for typos or incorrect enum values`);
        }
    }
}
/** Validate that the user config is reasonable */
function createAppConfigFromUserConfig(userConfig, serverDir, shutdownCallback) {
    // Do the warns first so they get shown even when there's an error 
    warnIfSettingMissing("license", userConfig);
    warnIfSettingMissing("licenseFile", userConfig);
    warnIfSettingMissing("publicHostname", userConfig);
    warnIfSettingMissing("sslPrivateKeyFile", userConfig);
    warnIfSettingMissing("sslCertificateFile", userConfig);
    warnIfSettingMissing("sslEnableFileServer", userConfig);
    warnIfSettingMissing("sslEnableSpawnServer", userConfig);
    warnIfSettingMissing("sslEnableScServer", userConfig);
    warnIfSettingMissing("ssrGpuCount", userConfig);
    warnIfSettingMissing("ssrUseEgl", userConfig);
    warnIfSettingMissing("autoGcIntervalTime", userConfig);
    warnIfSettingMissing("disableConsoleEnterToShutdown", userConfig);
    warnIfSettingMissing("windowsServiceRespawnEnabled", userConfig);
    warnIfSettingMissing("windowsServiceRespawnLogSuffix", userConfig);
    warnIfSettingMissing("communicatorDir", userConfig);
    warnIfSettingMissing("streamCacheExeFile", userConfig);
    warnIfSettingMissing("logDir", userConfig);
    warnIfSettingMissing("logSpawnFileCategoryMask", userConfig);
    warnIfSettingMissing("logSpawnStdoutCategoryMask", userConfig);
    warnIfSettingMissing("logSpawnUseDeltaTime", userConfig);
    warnIfSettingMissing("logFileTimeFormat", userConfig);
    warnIfSettingMissing("logConsoleTimeFormat", userConfig);
    warnIfSettingMissing("logFileLevelCutoff", userConfig);
    warnIfSettingMissing("logStdoutAsLevel", userConfig);
    warnIfSettingMissing("logStderrAsLevel", userConfig);
    warnIfSettingMissing("logRestFilterRegex", userConfig);
    warnIfSettingMissing("logRestHttpRequestsAsLevel", userConfig);
    warnIfSettingMissing("logFileHttpRequestsAsLevel", userConfig);
    warnIfSettingMissing("fileServerPort", userConfig);
    warnIfSettingMissing("fileServerStaticDirs", userConfig);
    warnIfSettingMissing("fileServerProxyViewerConnections", userConfig);
    // Hard validate *required* parameters
    errorIfSettingMissing("spawnServerPort", userConfig);
    errorIfSettingMissing("ipVersion", userConfig);
    errorIfSettingMissing("spawnWebsocketPortsBegin", userConfig);
    errorIfSettingMissing("spawnMaxSpawnCount", userConfig);
    errorIfSettingMissing("spawnLivelinessReportIntervalTime", userConfig);
    errorIfSettingMissing("spawnInitialUseDuration", userConfig);
    errorIfSettingMissing("csrEnabled", userConfig);
    errorIfSettingMissing("ssrEnabled", userConfig);
    errorIfSettingMissing("communicatorDir", userConfig);
    errorIfSettingMissing("modelDirs", userConfig);
    errorIfSettingMissing("workspaceDir", userConfig);
    errorIfSettingMissing("logConsoleLevelCutoff", userConfig);
    // Ensure proper license configuration settings
    if (userConfig.licenseFile && userConfig.license) {
        throw new Error(`Only 'license' or 'licenseFile' may be specified as non-null`);
    }
    if (!userConfig.licenseFile && !userConfig.license) {
        throw new Error(`Either 'license' or 'licenseFile' must be specified as non-null`);
    }
    // EGL mode for SSR is only supported on linux
    if (userConfig.ssrUseEgl && os.platform() !== "linux") {
        throw new Error(`Using EGL for SSR is only supported on linux.`);
    }
    // Ensure SSL files are set if ssl is enabled anywhere
    const sslEnabled = userConfig.sslEnableFileServer || userConfig.sslEnableSpawnServer || userConfig.sslEnableScServer;
    if (sslEnabled) {
        // Ensure proper SSL file settings
        if (!userConfig.sslPrivateKeyFile || !userConfig.sslCertificateFile) {
            throw new Error(`SSL enabled but both key and certificate files have not been specified`);
        }
        // Must have public hostname set for SSL
        if (!userConfig.publicHostname) {
            throw new Error(`SSL enabled but public hostname not specified`);
        }
    }
    // Determine if we need to load the SSL files into memory
    const sslLoadBuffers = sslEnabled && (userConfig.sslEnableFileServer || userConfig.sslEnableSpawnServer);
    // Ensure that the communicator directory is valid
    const commDir = Utils_1.expandHomeDir(userConfig.communicatorDir);
    const commAbsDir = path.resolve(commDir);
    const commDirStats = fs.statSync(commAbsDir);
    if (!commDirStats.isDirectory()) {
        throw new Error(`Invalid directory specified for config value 'communicatorDir': ${userConfig.communicatorDir}`);
    }
    /// SCW: Note that explicit Ipv6 is disabled until we can update the stream-cache server to support it
    if (userConfig.ipVersion === SpawnerTypes_1.IPVersion.ForceIPv6Disabled) {
        throw new Error(`Explicit IPv6 support is disabled at this time, the ipVersion setting must be changed`);
    }
    const sslPrivateKeyAbsFile = userConfig.sslPrivateKeyFile ? Utils_1.resolveDirs(commDir, userConfig.sslPrivateKeyFile) : null;
    const sslCertificateAbsFile = userConfig.sslCertificateFile ? Utils_1.resolveDirs(commDir, userConfig.sslCertificateFile) : null;
    const ssProtocol = Utils_1.getHttpProtocol(userConfig.sslEnableSpawnServer);
    const ssHostname = Utils_1.getLocalHostname(userConfig.sslEnableSpawnServer, userConfig.publicHostname, userConfig.ipVersion);
    // Setup the full config from the user config. The resolveDirs() function handles the second 
    // path element being either absolute or relative
    const platform = os.platform();
    const appConfig = Object.assign(Object.assign({}, userConfig), { shutdownCallback: shutdownCallback, serverDir: serverDir, communicatorAbsDir: commAbsDir, spawnExeAbsFile: Utils_1.resolveDirs(commDir, (() => {
            if (userConfig.streamCacheExeFile) {
                return userConfig.streamCacheExeFile;
            }
            else if (platform === "win32") {
                return "./server/bin/win64/ts3d_sc_server.exe";
            }
            else if (platform === "linux") {
                return "./server/bin/linux64/ts3d_sc_server";
            }
            else if (platform === "darwin") {
                return "./server/bin/macos/ts3d_sc_server";
            }
            else {
                throw new Error("Unsupported OS");
            }
        })()), logAbsDir: userConfig.logDir ? Utils_1.resolveDirs(commDir, userConfig.logDir) : null, modelAbsDirs: userConfig.modelDirs ? userConfig.modelDirs.map(p => Utils_1.resolveDirs(commDir, p)) : null, workspaceAbsDir: userConfig.workspaceDir ? Utils_1.resolveDirs(commDir, userConfig.workspaceDir) : null, licenseAbsFile: userConfig.licenseFile ? Utils_1.resolveDirs(commDir, userConfig.licenseFile) : null, statusUriBase: `${ssProtocol}://${ssHostname}:${userConfig.spawnServerPort}/api/spawns/`, fileServerStaticAbsDirs: userConfig.fileServerStaticDirs ? userConfig.fileServerStaticDirs.map(p => Utils_1.resolveDirs(commDir, p)) : null, sslPrivateKeyAbsFile: sslPrivateKeyAbsFile, sslCertificateAbsFile: sslCertificateAbsFile, sslPrivateKey: sslLoadBuffers ? fs.readFileSync(sslPrivateKeyAbsFile) : null, sslCertificate: sslLoadBuffers ? fs.readFileSync(sslCertificateAbsFile) : null });
    // Verify license file if it was specified (throws if non-exist). Note that while the idea of loading
    // the license now from the file then passing it as '--license' might seem like a reasonable optimization,
    // it's actually important *not* to do this. The issue is that on Linux/Mac platforms, you can typically
    // see the entire command line for a running process with something like `ps -ef`. If the customer desires
    // to keep that license hidden, the file approach is the way to do it.
    if (appConfig.licenseAbsFile) {
        fs.accessSync(appConfig.licenseAbsFile);
    }
    // Ensure the spawn exe exists (throws if it's not)
    fs.accessSync(appConfig.spawnExeAbsFile);
    // Create the log directory if needed
    if (appConfig.logAbsDir && appConfig.logSpawnFileCategoryMask !== 0) {
        fs.mkdirSync(appConfig.logAbsDir, { recursive: true });
    }
    // Create the workspace directory if needed
    if (appConfig.workspaceAbsDir) {
        fs.mkdirSync(appConfig.workspaceAbsDir, { recursive: true });
    }
    return appConfig;
}
/** Try to exit the server gracefully. This will allow all log entries to be written */
function triggerShutdown(code) {
    // First shutdown our servers so to discourage any new connections during the period 
    if (gFileServer !== null) {
        gFileServer.close();
        gFileServer = null;
    }
    if (gSpawnServer !== null) {
        gSpawnServer.close();
        gSpawnServer = null;
    }
    // SCW Note - for now, we're really only going to worry about ensuring the logger
    //  shuts down properly and thus spits out all logged entries
    // If we can get a full graceful shutdown, then use: process.exitCode = code;
    // SCW: Tried various ways to get a decent shutdown *and* logs to flush and be written.
    // The logger 'finish' callback will trigger, but in some cases the log-file may not
    // have even been created yet. I had to move on from the callback to just a timer hack
    // logger().on('finish', function () {/* doesn't really work */ });
    // Use timers (which is a non-deterministic kludge) to allow winston time to flush and write
    // logs. Very hacky for now, but mostly works. Or at least, works better than the winston
    // 'finish' callback which mostly doesn't work. Note from this issue that shutdown is clearly an
    // active problem with winston:
    //  https://github.com/winstonjs/winston/issues/228
    // First set a timer to log our exit. This is to allow any pending CB's that may log to go
    // and give us a much higher likelihood that this log message will be the final one (particularly 
    // during startup)
    // TODO: Should probably see if the Spawner has been created and request it to stop/shutdown 
    //  now as well, killing all active child processes before we continue the shutdown process . 
    //  This would add some grace to this whole endeavor 
    setTimeout(() => {
        // Only obey the first shutdown code. We can get called multiple times due to the async nature of things
        if (gShutdownCode === null) {
            gShutdownCode = code;
            Logging_1.logger().info(`Exiting server with code ${gShutdownCode}`);
        }
        // See if anything can get cleaned up asap 
        if (global.gc) {
            global.gc();
        }
        // The next timer is set before ending the logger. This helps when there are multiple
        // queued things that might trigger a shutdown and try to log.
        setTimeout(() => {
            Logging_1.logger().end();
            // The third timer will do the final exit, allowing winston to flush and write.
            setTimeout(() => {
                // We use the `service` stop as it will do any service related cleanup and then issue 
                // the final process exit with our code 
                service.stop(gShutdownCode);
            }, 250);
        }, 250);
    }, 250);
    // TODO. Consider full shutdown of express apps. See:
    //   https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html
}
//# sourceMappingURL=Startup.js.map