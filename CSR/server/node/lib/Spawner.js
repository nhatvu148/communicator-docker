"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
const os = require("os");
const url = require("url");
const proxy = require("http-proxy");
const child_process = require("child_process");
const SpawnerTypes_1 = require("./SpawnerTypes");
const Utils_1 = require("./Utils");
const Logging_1 = require("./Logging");
const kInvalidSpawnPort = -1;
const kKillWaitTime = 5000;
const kTwoDigitFormatter = new Intl.NumberFormat('en-US', { minimumIntegerDigits: 2 });
/** The primary class for managing spawned streamers */
class Spawner {
    /** Setup the spawner based on the passed config. If something important goes wrong, or an improper configutation
     *  is detected, this will throw an exception and thus halt the spawner initialization.  */
    constructor(config) {
        // Primary map for active streamer instance. key=uuid
        this._spawns = new Map();
        // Array of available spawn websocket ports
        this._spawnPorts = [];
        /** Will contain active gpu counts per gpu-index which are [0, config.ssrGpuCount) */
        this._gpuCounts = [];
        this._config = config;
        // Setup the port arrays
        for (let i = config.spawnWebsocketPortsBegin + config.spawnMaxSpawnCount - 1; i >= config.spawnWebsocketPortsBegin; --i) {
            this._spawnPorts.push(i);
        }
        // Setup Gpu indexes. This should only be done when ssrGpuCount is set and >0
        if (this._config.ssrGpuCount) {
            this._gpuCounts.length = this._config.ssrGpuCount;
            this._gpuCounts.fill(0);
        }
        // Kick-off the timer that periodically does spawn lifetime maintenance
        setInterval(this._doSpawnMaintenance.bind(this), 1000);
    }
    /** Creates an express router for the 'service' route (aka spawn viewer) */
    createServiceRouter() {
        const router = express.Router();
        router.post('/service', this._onBrokerRequest.bind(this));
        return router;
    }
    /** Creates an express router object for our REST api calls */
    createRouter() {
        const router = express.Router();
        // API calls for users to manage streamers
        router.post('/shutdown', this._onShutdown.bind(this));
        router.post('/gc', this._onRunGC.bind(this));
        router.get('/status', this._onGetStatus.bind(this));
        router.post('/spawn', this._onBrokerRequest.bind(this));
        router.get('/spawns', this._onListSpawns.bind(this));
        router.post('/spawns/:spawnId', this._onSpawnUpdate.bind(this));
        router.get('/help', this._onGetHelp.bind(this));
        return router;
    }
    /** Called on on a direct web-socket request which comes in as an "upgrade" */
    onWsRequest(req, socket, head) {
        const parsedUrl = url.parse(req.url, true);
        // Find the rending location. Default to csr if not specified
        const urlRenderLoc = parsedUrl.query["renderingLocation"];
        const renderingLocation = urlRenderLoc === "ssr" ? SpawnerTypes_1.RenderingLocation.Server : SpawnerTypes_1.RenderingLocation.Client;
        // For now, we don't support the session token, model search dirs, or model file for the proxy mode.
        // The only way to get the token is via URL params, and that may negate the whole point since it's visible in
        // the URL? HTTP headers are out as we can't set them via the JS Websocket APIs:
        // https://stackoverflow.com/questions/4361173/http-headers-in-websockets-client-api
        const spawnConfig = SpawnerTypes_1.SpawnConfig.createWsProxyConfig(req, socket, head, renderingLocation);
        this._spawnScServer(spawnConfig);
    }
    /** Return help on server commands */
    _onGetHelp(req, res) {
        const curlExe = (os.platform() === "win32") ? "curl.exe" : "curl";
        const hostname = Utils_1.getLocalHostname(this._config.sslEnableSpawnServer, this._config.publicHostname, this._config.ipVersion);
        const httpProtocol = Utils_1.getHttpProtocol(this._config.sslEnableSpawnServer);
        const json = {
            "status": "ok",
            "rest-commands": {
                "help": {
                    "description:": "Returns help on REST commands",
                    "endpoint": "api/help",
                    "http-command": "GET",
                    "curl": `${curlExe} ${httpProtocol}://${hostname}:${this._config.spawnServerPort}/api/help`,
                },
                "shutdown": {
                    "description:": "Initiate a server shutdown",
                    "endpoint": "api/shutdown",
                    "http-command": "POST",
                    "curl": `${curlExe} -X POST ${httpProtocol}://${hostname}:${this._config.spawnServerPort}/api/shutdown`,
                },
                "status": {
                    "description:": "Returns status information for the server",
                    "endpoint": "api/status",
                    "http-command": "GET",
                    "curl": `${curlExe} ${httpProtocol}://${hostname}:${this._config.spawnServerPort}/api/status`,
                },
                "spawns": {
                    "description:": "Returns information on active spawned-servers",
                    "endpoint": "api/spawns",
                    "http-command": "GET",
                    "curl": `${curlExe} ${httpProtocol}://${hostname}:${this._config.spawnServerPort}/api/spawns`,
                },
                "gc": {
                    "description:": "Forces NodeJS to run the garbage collector",
                    "endpoint": "api/gc",
                    "http-command": "POST",
                    "curl": `${curlExe} -X POST ${httpProtocol}://${hostname}:${this._config.spawnServerPort}/api/gc`,
                },
            },
        };
        Utils_1.sendJsonResponse(req, res, 200, json);
    }
    /** Called by a "service" request to spawn a viewer. This is intended to be compatible with the
     *  legacy TS3d service-broker approach  */
    _onBrokerRequest(req, res) {
        const json = req.body;
        // Find the rending location. Default to csr if not specified
        const renderingLocation = json.class && (json.class === "ssr_session") ?
            SpawnerTypes_1.RenderingLocation.Server : SpawnerTypes_1.RenderingLocation.Client;
        const sessionToken = json.params ? json.params.sessionToken : null;
        const modelSearchDirectories = json.params ? json.params.modelSearchDirectories : null;
        const modelFile = json.params ? json.params.model : null;
        const spawnConfig = SpawnerTypes_1.SpawnConfig.createBrokerConfig(res, renderingLocation, sessionToken, modelSearchDirectories, modelFile);
        this._spawnScServer(spawnConfig);
    }
    /** This function checks on the active spawns and updates their status as needed. It should be called
     *  periodically at a reasonable frequency (say every 1000ms)
     */
    _doSpawnMaintenance() {
        const now = Date.now();
        const suspectCutoffTime = now - (((this._config.spawnLivelinessReportIntervalTime * 2) + 2) * 1000);
        const killCutoffTime = now - (((this._config.spawnLivelinessReportIntervalTime * 3) + 2) * 1000);
        // Assuming the total spawn count will be reasonably low... 1000 max. Thus just iterate through them
        for (const info of this._spawns.values()) {
            // We can flat delete any dead spawns now
            if (info.state === SpawnerTypes_1.SpawnState.Dead) {
                this._spawns.delete(info.id);
                continue;
            }
            // For everything else, let's see if we've heard from it appropriately
            if (info.lastUpdateTime < killCutoffTime) {
                this._doKillSpawn(info, now);
            }
            else if (info.lastUpdateTime < suspectCutoffTime) {
                info.state = SpawnerTypes_1.SpawnState.Suspect;
            }
        }
    }
    /** Kill the spawn. We will ultimately make two attempts to kill the spawn if needed - the first is the default
     *  'kill()' call, which is somewhat friendly and does a SIGTERM to allow the spawn to shutdown gracefully.
     *  If that fails (based on time), we will go the harsher SIGKILL approach. We also check for and flag zombies.
     */
    _doKillSpawn(info, now) {
        switch (info.state) {
            case SpawnerTypes_1.SpawnState.Killed: {
                const timeSinceKill = now - info.killTime;
                if (timeSinceKill > kKillWaitTime) {
                    Logging_1.logger().warn(`${info.exeName} zombified: pid=${info.childProcess.pid}, id=${info.id}`);
                    info.state = SpawnerTypes_1.SpawnState.Zombie;
                }
                break;
            }
            case SpawnerTypes_1.SpawnState.NiceKilled: {
                // We've already done the friendly kill. If it's been long enough, nuke it from orbit
                const timeSinceNiceKill = now - info.killTime;
                if (timeSinceNiceKill > kKillWaitTime) {
                    Logging_1.logger().warn(`${info.exeName} hard-killed: pid=${info.childProcess.pid}, id=${info.id}`);
                    info.state = SpawnerTypes_1.SpawnState.Killed;
                    info.killTime = Date.now(); // Not using 'now' so that we get the full time since kill on our next
                    // calls
                    info.childProcess.kill('SIGKILL');
                }
                break;
            }
            case SpawnerTypes_1.SpawnState.Suspect: {
                // A suspect spawn hasn't pinged us for a while, so we go ahead and do the SIGTERM kill on it.
                Logging_1.logger().warn(`${info.exeName} nice-killed: pid=${info.childProcess.pid}, id=${info.id}`);
                info.state = SpawnerTypes_1.SpawnState.NiceKilled;
                info.killTime = Date.now();
                info.childProcess.kill();
                break;
            }
            case SpawnerTypes_1.SpawnState.Zombie: {
                // What more can we do?
                break;
            }
            default:
                break;
        }
    }
    /** Convert memory number to displayable megabytes */
    static _asMb(bytes) {
        const mb = (bytes / (1024.0 * 1024.0)).toFixed(3);
        return `${mb} MB`;
    }
    /** Called via HTTP request to explicitly run the GC. Responds with some stats */
    _onRunGC(req, res) {
        if (global.gc) {
            const preGcMemory = process.memoryUsage();
            global.gc();
            const postGcMemory = process.memoryUsage();
            const json = {
                "status": "ok",
                "preGcMemory": {},
                "postGcMemory": {},
                "delta": {}
            };
            // Include memory usage stats
            for (const key in preGcMemory) {
                if (preGcMemory.hasOwnProperty(key)) {
                    json.preGcMemory[key] = Spawner._asMb(preGcMemory[key]);
                    json.postGcMemory[key] = Spawner._asMb(postGcMemory[key]);
                    json.delta[key] = Spawner._asMb(preGcMemory[key] - postGcMemory[key]);
                }
            }
            Utils_1.sendJsonResponse(req, res, 200, json);
        }
        else {
            Utils_1.sendJsonResponse(req, res, 503, { "status": "failed", "reason": "Manual GC is not enabled" });
        }
    }
    /** Called to shutdown the serveer */
    _onShutdown(req, res) {
        Utils_1.sendJsonResponse(req, res, 200, { "status": "ok", "message": "Server is shutting down" });
        this._config.shutdownCallback(0);
    }
    /** Called to give general server status */
    _onGetStatus(req, res) {
        const json = {
            "timestamp": new Date().toISOString(),
            "status": "ok",
            "config": {},
            "memory": {},
            "usedSpawnPorts": this._config.spawnMaxSpawnCount - this._spawnPorts.length,
            "availableSpawnPorts": this._spawnPorts.length,
        };
        // Show internal config as well
        for (const configKey in this._config) {
            if (this._config.hasOwnProperty(configKey)) {
                json.config[configKey] = this._config[configKey];
            }
        }
        // Gpu index stats
        if (this._config.ssrGpuCount) {
            const gpuIndexMap = {};
            for (let i = 0; i < this._gpuCounts.length; i++) {
                gpuIndexMap[i] = this._gpuCounts[i];
            }
            json["gpuAllocation"] = gpuIndexMap;
        }
        // Add per-spawn stats
        for (const category in SpawnerTypes_1.SpawnState) {
            if (SpawnerTypes_1.SpawnState.hasOwnProperty(category)) {
                json[SpawnerTypes_1.SpawnState[category]] = 0; // Ensure we show all stats even if 0
            }
        }
        for (const spawnInfo of this._spawns.values()) {
            json[spawnInfo.state]++;
        }
        // Memory usage stats
        const memory = process.memoryUsage();
        for (const key in memory) {
            if (memory.hasOwnProperty(key)) {
                json.memory[key] = Spawner._asMb(memory[key]);
            }
        }
        // Don't show the license or SSL buffers
        json.config["license"] = "<hidden>";
        json.config["sslPrivateKey"] = "<hidden>";
        json.config["sslCertificate"] = "<hidden>";
        // Default is to send raw JSON data. Url param "pretty=true" will pretty-ify the JSON
        Utils_1.sendJsonResponse(req, res, 200, json);
    }
    /** Called to list all known spawns */
    _onListSpawns(req, res) {
        const json = {
            "timestamp": new Date(),
            "spawns": new Array()
        };
        for (const spawnInfo of this._spawns.values()) {
            const spawnJson = {
                "id": spawnInfo.id,
                "state": spawnInfo.state,
                "spawnTime": new Date(spawnInfo.spawnTime).toISOString(),
                "lastUpdateTime": new Date(spawnInfo.lastUpdateTime).toISOString(),
            };
            json.spawns.push(spawnJson);
        }
        Utils_1.sendJsonResponse(req, res, 200, json);
    }
    /** Called when a spawn has reported liveliness */
    _onSpawnLiveliness(info, liveliness) {
        const spawnId = info.id;
        const spawnConfig = info.config;
        const config = this._config;
        // In all cases, we've heard from the spawn
        info.lastUpdateTime = Date.now();
        // Do any specific logic per-liveliness type
        switch (liveliness) {
            case "ready": {
                Logging_1.logger().info(`${info.exeName} ready to stream: id=${info.id}`);
                info.state = SpawnerTypes_1.SpawnState.Ready;
                // Handle broker vs proxy approach
                if (info.isBrokerType()) {
                    // For broker mode, we need the public hostname if specified as the receiver of the broker result
                    // and associated URI is assumed to not be on this machine
                    const hostname = Utils_1.getPublicHostname(config.publicHostname, config.ipVersion);
                    const resJson = {
                        "result": "ok",
                        "serviceId": info.id,
                        "endpoints": {
                            "ws": `${(Utils_1.getWsProtocol(config.sslEnableScServer))}://${hostname}:${info.spawnPort}`,
                        }
                    };
                    // We've been waiting for the server to be "ready" so we can respond to the original
                    // HTTP broker request. Do it now!
                    this._completeBrokerRequest(spawnConfig, resJson);
                }
                else if (info.isWsProxyType()) {
                    // We're proxying the ws connection from the sc-server through us. Thus, use localhost
                    const useSsl = config.sslEnableScServer;
                    const proxyHost = Utils_1.getLocalHostname(useSsl, config.publicHostname, config.ipVersion);
                    const spawnUrl = `${(Utils_1.getWsProtocol(useSsl))}://${proxyHost}:${info.spawnPort}`;
                    Logging_1.logger().verbose(`proxy: id=${info.id} -> ${spawnUrl}`);
                    // We've been waiting for the server to be "ready" so we can go ahead and proxy
                    // the original request to the server's websocket port. Do it now
                    const sslKeys = useSsl ? { key: config.sslPrivateKey, cert: config.sslCertificate } : null;
                    info.proxyServer = proxy.createServer({ target: spawnUrl, ws: true, secure: useSsl, ssl: sslKeys });
                    info.proxyServer.on('error', function (err, req, res) {
                        Logging_1.logger().error(`proxy-error: proxy=${spawnUrl}, err=${err}`);
                    });
                    info.proxyServer.ws(spawnConfig.wsReq, spawnConfig.wsSocket, spawnConfig.wsHead);
                }
                else {
                    throw new Error("A request must be setup for either broker or proxy mode");
                }
                break;
            }
            case "ping": {
                Logging_1.logger().debug(`${info.exeName} ping: id=${info.id}`);
                info.state = SpawnerTypes_1.SpawnState.Ready;
                break;
            }
            case "disconnect": {
                Logging_1.logger().verbose(`${info.exeName} disconnect: id=${info.id}`);
                // The spawn has claimed it's disconnected. The spawn will now become defunct
                // The port will be reclaimed in our code that processes the dead spawns.
                // TODO: Consider adding code here to reclaim the port asap
                info.state = SpawnerTypes_1.SpawnState.Disconnected;
                break;
            }
            default: {
                info.state = SpawnerTypes_1.SpawnState.Suspect;
                throw new Error("Invalid liveliness settings");
            }
        }
    }
    /** Called when a spawn has contacted us to update it's status */
    _onSpawnUpdate(req, res) {
        const spawnId = req.params.spawnId;
        const info = this._spawns.get(spawnId);
        if (!info) {
            throw new Error("Reported spawn doesn't exist");
        }
        // Handle liveliness status
        if (req.query.liveliness) {
            this._onSpawnLiveliness(info, req.query.liveliness);
        }
        res.status(200).end();
    }
    /** Sends a successful HTTP response to the broker request associated with the spawn */
    _completeBrokerRequest(spawnConfig, json) {
        if (spawnConfig.isBrokerType() && (spawnConfig.brokerResponse !== null)) {
            spawnConfig.brokerResponse.status(200).json(json);
            spawnConfig.brokerResponse = null; // Ensure we only send it once!
        }
    }
    /** Call to fail a specific view/spawn request. Handles proxy/broker types */
    _failSpawnRequest(spawnConfig, httpCode, message) {
        // Don't this fail - it's already been logged
        if (spawnConfig.isBrokerType()) {
            if (spawnConfig.brokerResponse) {
                spawnConfig.brokerResponse.status(httpCode).json({ "status": "failed", "reason": message });
                spawnConfig.brokerResponse = null; // Ensure we only send it once!
            }
        }
        else if (spawnConfig.isWsProxyType()) {
            if (spawnConfig.wsSocket) {
                const response = `HTTP/1.1 ${httpCode} ${message}`;
                spawnConfig.wsSocket.end(response);
                spawnConfig.wsSocket = null;
                spawnConfig.wsHead = null;
                spawnConfig.wsReq = null;
            }
        }
    }
    /** Called when a spawn is no longer functional and shouldn't be using it's port */
    _spawnIsDead(info) {
        Logging_1.logger().info(`${info.exeName} died: pid=${info.childProcess.pid}, id=${info.id}`);
        // Reclaim the spawn-ports asap
        if (info.spawnPort !== kInvalidSpawnPort) {
            this._spawnPorts.push(info.spawnPort);
            info.spawnPort = kInvalidSpawnPort;
        }
        // Deallocate from a gpu
        if (info.gpuIndex !== null) {
            this._gpuCounts[info.gpuIndex]--;
        }
        info.state = SpawnerTypes_1.SpawnState.Dead;
        info.lastUpdateTime = Date.now();
    }
    /** Called when spawning a streamer fails */
    _onSpawnError(info, err) {
        Logging_1.logger().warn(`${info.exeName} error: id=${info.id}, error=${err.message}`);
        this._spawnIsDead(info);
        this._failSpawnRequest(info.config, 500, err.message);
    }
    /** Called when a spawned streamer exits */
    _onSpawnExit(info, exitCode, signal) {
        this._spawnIsDead(info);
        // This response only gets applied if we haven't already responded to it
        if (exitCode !== 0) {
            const reasonStr = exitCode ?
                `'${Utils_1.getTs3dScServerExitReason(exitCode)}', exit-code=${exitCode}` :
                `'exited because of signal=${signal}, no exit-code'`;
            const fullErrorString = `${info.exeName} failed: reason=${reasonStr}, id=${info.id}`;
            Logging_1.logger().warn(`${fullErrorString}`);
            this._failSpawnRequest(info.config, 500, fullErrorString);
        }
        else {
            // Handle the *very* unlikely case that the spawned sc-server has properly exited, but
            // we have not yet responded to its original spawn-request.
            if (info.isBrokerType()) {
                this._completeBrokerRequest(info.config, { status: "ok" });
            }
        }
    }
    /** Called on an incoming spawn request */
    _spawnScServer(spawnConfig) {
        // Validate the rendering location
        if ((spawnConfig.renderingLocation === SpawnerTypes_1.RenderingLocation.Client && !this._config.csrEnabled) ||
            (spawnConfig.renderingLocation === SpawnerTypes_1.RenderingLocation.Server && !this._config.ssrEnabled)) {
            Logging_1.logger().warn(`spawn request denied: disabled rendering location, location=${spawnConfig.renderingLocation}`);
            this._failSpawnRequest(spawnConfig, 403, "Invalid rendering location");
            return;
        }
        // Ensure we have a spawn-port we can give it
        if (this._spawnPorts.length === 0) {
            Logging_1.logger().warn(`spawn request denied: no ports available`);
            this._failSpawnRequest(spawnConfig, 503, "No ports available");
            return;
        }
        // Create the new spawn instance with an available port. Note that the spawn's state will
        // be "Dead" initially. We only change it after our spawn() call. If some exception were to
        // happen prior to success of the spawn() call, the Dead state would allow the spawn entry
        // to get cleaned up from the _spawns collection
        const info = new SpawnerTypes_1.SpawnProcessInfo(this._config.spawnExeAbsFile, spawnConfig, this._spawnPorts.pop(), this._getBestGpuIndex(spawnConfig));
        this._spawns.set(info.id, info);
        // Setup config and launch args
        const args = this._createSpawnArgs(info);
        // Setup SpawnOptions - these are defined by child_process.spawn()
        // For Unix the DISPLAY env variable may be needed for an X-server when using SSR. Just set it always
        const displayVar = process.env.DISPLAY ? process.env.DISPLAY : ":0"; // TODO - allow config value for this
        const exeDir = path.dirname(this._config.spawnExeAbsFile);
        // Setting env vars that are needed for Linux/Mac. Should be no harm on Windows thus not bothering to
        // do some type of per-OS options here.
        // TODO: display var should go into config
        const spawnOptions = {
            env: {
                "LD_LIBRARY_PATH": exeDir,
                "DYLD_LIBRARY_PATH": exeDir
            }
        };
        // Note: Setting the DISPLAY Env var when attempting to use EGL causes GL initialization to fail
        if (!this._config.ssrUseEgl) {
            spawnOptions.env["DISPLAY"] = displayVar;
        }
        // Spawn the child process. It's fully asynchronous and not expected to 'throw' here even
        // when a problem occurs. Instead, it will call the error callback later
        Logging_1.logger().verbose(`spawn command: ${this._config.spawnExeAbsFile} ${args.join(" ")}`);
        info.childProcess = child_process.spawn(this._config.spawnExeAbsFile, args, spawnOptions);
        info.state = SpawnerTypes_1.SpawnState.Launching;
        // Even though the `spawn` call is async, it apparently actually creates a process prior to 
        // returning and thus the PID value is set. There's also no "started" event or anything like 
        // that to indicate the process has actually spawned and is ready to rock. If there is some 
        // catastrophic error, like the named exe doesn't exist, the pid will be `undefined`.
        Logging_1.logger().info(`${info.exeName} spawned: pid=${info.childProcess.pid}, id=${info.id}`);
        // Set any important callbacks for this spawn
        info.childProcess.on('error', (err) => {
            this._onSpawnError(info, err);
        });
        info.childProcess.on('exit', (code, signal) => {
            this._onSpawnExit(info, code, signal);
        });
        // Optionally log stdout/stderr from child processes
        // Note data is showing as a Uint8Array
        info.childProcess.stdout.on('data', (data) => {
            if (this._config.logStdoutAsLevel) {
                const message = data.toString().trim();
                Logging_1.logger().log(this._config.logStdoutAsLevel, `stdout: id=${info.id}: ${message}`);
            }
        });
        info.childProcess.stderr.on('data', (data) => {
            if (this._config.logStderrAsLevel) {
                const message = data.toString().trim();
                Logging_1.logger().log(this._config.logStderrAsLevel, `stderr: id=${info.id}: ${message}`);
            }
        });
    }
    /** Creates a descriptive filename to use for logging the given spawn */
    _createLogFilepath(spawnInfo) {
        const spawnConfig = spawnInfo.config;
        const renderLocationCode = spawnConfig.renderingLocation === SpawnerTypes_1.RenderingLocation.Client ? "csr" : "ssr";
        const now = new Date();
        // Filename format: comm_scserver_<ssr|csr>_YYYY_MM_DD_HH_MM_SS_<id>.log
        const filename = `\
comm_scserver_${renderLocationCode}_\
${now.getFullYear()}_\
${kTwoDigitFormatter.format(now.getMonth() + 1)}_\
${kTwoDigitFormatter.format(now.getDate())}_\
${kTwoDigitFormatter.format(now.getHours())}_\
${kTwoDigitFormatter.format(now.getMinutes())}_\
${kTwoDigitFormatter.format(now.getSeconds())}_\
${spawnInfo.id}.log`;
        const filepath = path.join(this._config.logAbsDir, filename);
        return filepath;
    }
    /** Determine the gpu index to use for the next spawn */
    _getBestGpuIndex(spawnConfig) {
        // Only assign a GPU for SSR when multi-GPUs are specified.
        // NOTE - while the server may be configured to support both ssr and csr, a given HWV viewing
        //   session can't change. Therefore, we do *not* assign a GPU for a CSR request even
        //   when SSR is enabled, because that request (and associated viewing session) will remain
        //   a CSR session for it's duration (It can't switch to SSR via the HWV API's)
        if (!this._config.ssrGpuCount || spawnConfig.renderingLocation === SpawnerTypes_1.RenderingLocation.Client) {
            return null;
        }
        // Find the gpu index with the lowest count. GPU count is anticipated to be very low thus O(n)
        let bestIndex = 0;
        let lowestCount = this._gpuCounts[0];
        for (let i = 1; i < this._gpuCounts.length; ++i) {
            if (this._gpuCounts[i] < lowestCount) {
                lowestCount = this._gpuCounts[i];
                bestIndex = i;
            }
        }
        this._gpuCounts[bestIndex]++;
        console.assert(this._gpuCounts[bestIndex] > 0, "bad gpu count");
        return bestIndex;
    }
    /** Sets up the CL args used for a spawn */
    _createSpawnArgs(spawnInfo) {
        const config = this._config;
        const spawnConfig = spawnInfo.config;
        const modelSearchDirectories = spawnConfig.modelSearchDirectories ?
            spawnConfig.modelSearchDirectories.concat(config.modelAbsDirs) : config.modelAbsDirs;
        // Start with required and always set args
        const args = [
            "--id", spawnInfo.id,
            "--sc-port", spawnInfo.spawnPort.toString(),
            "--liveliness-endpoint", config.statusUriBase,
            "--liveliness-update-frequency", config.spawnLivelinessReportIntervalTime.toString(),
            "--model-search-directories", modelSearchDirectories.join(';'),
        ];
        // Windows Service support arguments 
        if (config.windowsServiceRespawnEnabled) {
            args.push("--service-respawn", "true");
            if (config.windowsServiceRespawnLogSuffix) {
                args.push("--service-respawn-log-suffix", config.windowsServiceRespawnLogSuffix);
            }
            else {
                // If no suffix is specified, suppress respawner log file creation with an empty string 
                args.push("--service-respawn-log-suffix", "");
            }
        }
        // If the user has enabled Debug logging for the SC, ensure we let it know 
        if (((config.logSpawnFileCategoryMask & SpawnerTypes_1.LogSpawnCategory.Debug) === SpawnerTypes_1.LogSpawnCategory.Debug) ||
            ((config.logSpawnStdoutCategoryMask & SpawnerTypes_1.LogSpawnCategory.Debug) === SpawnerTypes_1.LogSpawnCategory.Debug)) {
            args.push("--sc-verbose-logging", "true");
        }
        // The file logger is only enabled with a non-empty log mask
        if (config.logSpawnFileCategoryMask && config.logDir) {
            const logFile = this._createLogFilepath(spawnInfo);
            const logUseDelta = config.logSpawnUseDeltaTime;
            args.push("--log-file", logFile);
            args.push("--log-style-delta", logUseDelta.toString());
            args.push("--log-file-category-mask", config.logSpawnFileCategoryMask.toString());
        }
        // Stdout logging is enabled with a non-empty mask 
        if (config.logSpawnStdoutCategoryMask) {
            args.push("--log-stdout-category-mask", config.logSpawnStdoutCategoryMask.toString());
        }
        if (config.spawnInitialUseDuration) {
            args.push("--initial-use-duration", config.spawnInitialUseDuration.toString());
        }
        if (config.workspaceAbsDir) {
            args.push("--workspace-dir", config.workspaceAbsDir);
        }
        if (spawnConfig.sessionToken) {
            args.push("--session-token", spawnConfig.sessionToken);
        }
        if (spawnConfig.modelFile) {
            args.push("--model-file", spawnConfig.modelFile);
        }
        // Since a spawn request includes a csr/ssr designation, we only enable that particular
        // mode with the spawned sc-server.
        if (config.csrEnabled && spawnConfig.renderingLocation === SpawnerTypes_1.RenderingLocation.Client) {
            args.push("--csr", "true");
        }
        else if (config.ssrEnabled && spawnConfig.renderingLocation === SpawnerTypes_1.RenderingLocation.Server) {
            args.push("--ssr", "true");
            if (config.ssrGpuCount) {
                args.push("--ssr-gpu-index", spawnInfo.gpuIndex.toString());
            }
            if (os.platform() === "linux" && config.ssrUseEgl) {
                args.push("--ssr-egl", "true");
            }
        }
        else {
            // This case shouldn't happen given that we've rejected invalid requests earlier, but putting
            // it in out of an abundance of caution
            throw new Error("invalid rendering mode");
        }
        if (config.sslEnableScServer) {
            args.push("--ssl-certificate-file", config.sslCertificateAbsFile);
            args.push("--ssl-private-key-file", config.sslPrivateKeyAbsFile);
        }
        // TODO: model-file: Add support for the user to specify a model-file in the request, then set the
        // TODO: "--model-file" argument here if so. The mode file can be relative to the model-dirs
        // TODO: ex: args.push("--model-file", "bnc");
        // Always put license last for debugging clarity
        // TODO: We should probably add a config option to "auto-create a license file from a license" to help
        // TODO: with the problem where the license key is visible via `ps -ef`
        if (config.license) {
            args.push("--license", `${config.license}`);
        }
        else {
            console.assert(config.licenseAbsFile !== null, "empty license file");
            args.push("--license-file", `${config.licenseAbsFile}`);
        }
        return args;
    }
}
exports.Spawner = Spawner;
//# sourceMappingURL=Spawner.js.map