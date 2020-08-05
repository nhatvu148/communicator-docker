"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const uuidv4 = require("uuid/v4");
/** Internet protocol configuration */
var IPVersion;
(function (IPVersion) {
    IPVersion["Auto"] = "auto";
    IPVersion["ForceIPv4"] = "forceIPv4";
    /// SCW: IPv6 is disabled until the stream-cache is updated to support it, but we're leaving 
    /// the bulk of the code in here as "disabled" so we don't have to redo it later. 
    IPVersion["ForceIPv6Disabled"] = "forceIPv6Disabled";
})(IPVersion = exports.IPVersion || (exports.IPVersion = {}));
/** Logging time formats */
var LogTimeFormat;
(function (LogTimeFormat) {
    LogTimeFormat["ISO"] = "iso";
    LogTimeFormat["Local"] = "local";
    LogTimeFormat["Delta"] = "delta";
})(LogTimeFormat = exports.LogTimeFormat || (exports.LogTimeFormat = {}));
// Valid levels in order are: "error", "warn", "info", "verbose", "debug"
var LogLevel;
(function (LogLevel) {
    LogLevel["Error"] = "error";
    LogLevel["Warn"] = "warn";
    LogLevel["Info"] = "info";
    LogLevel["Verbose"] = "verbose";
    LogLevel["Debug"] = "debug";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
var LogSpawnCategory;
(function (LogSpawnCategory) {
    LogSpawnCategory[LogSpawnCategory["None"] = 0] = "None";
    LogSpawnCategory[LogSpawnCategory["Error"] = 1] = "Error";
    LogSpawnCategory[LogSpawnCategory["Warn"] = 2] = "Warn";
    LogSpawnCategory[LogSpawnCategory["Info"] = 4] = "Info";
    LogSpawnCategory[LogSpawnCategory["Debug"] = 8] = "Debug";
    LogSpawnCategory[LogSpawnCategory["All"] = 255] = "All";
})(LogSpawnCategory = exports.LogSpawnCategory || (exports.LogSpawnCategory = {}));
/** CSR or SSR */
var RenderingLocation;
(function (RenderingLocation) {
    RenderingLocation["Client"] = "client";
    RenderingLocation["Server"] = "server";
})(RenderingLocation = exports.RenderingLocation || (exports.RenderingLocation = {}));
/** Current state of spawn */
var SpawnState;
(function (SpawnState) {
    // The spawn has been launched, but has not reported in as ready
    SpawnState["Launching"] = "launching";
    // A spawn is "ready" after it has reported in that's ready which indicates it can start streaming 3D data
    SpawnState["Ready"] = "ready";
    // A suspect spawn has not reported in via a ping for a specified time. Once suspect, a nice-kill
    // will follow shortly unless the spawn reports
    SpawnState["Suspect"] = "suspect";
    // The spawn has disconnected voluntarily. It should soon exit on it's own
    SpawnState["Disconnected"] = "disconnected";
    // NiceKilled is our first attempt to kill a spawn. The spawn should be able to detect this
    // request and do a graceful shutdown.
    SpawnState["NiceKilled"] = "nice-killed";
    // Killed indicates that the NiceKilled didn't work, so we do a hard/abrupt kill on the spawn
    SpawnState["Killed"] = "killed";
    // Zombie indicates that the spawn hasn't responded to a hard kill. We can't do more with it,
    // but we can at least recognize it internally and report it via status
    SpawnState["Zombie"] = "zombie";
    // The spawn has died. The spawn information will get reclaimed during our next maintenance cycle
    SpawnState["Dead"] = "dead";
})(SpawnState = exports.SpawnState || (exports.SpawnState = {}));
var ConnectionType;
(function (ConnectionType) {
    ConnectionType["Broker"] = "broker";
    ConnectionType["WsProxy"] = "ws-proxy";
})(ConnectionType = exports.ConnectionType || (exports.ConnectionType = {}));
/** Per-spawn configuration values that are used prior to the spawn-child process creation.
 *
 *  This would be an appropriate place to add per-spawn parameters
 *  such as a temporary model directory. Like, if you were to load a model from S3 to a temporary location, that
 *  location directory could be added here and used to override the spawn's model dirs
 */
class SpawnConfig {
    constructor(connectionType, renderingLocation, sessionToken, modelSearchDirectories, modelFile) {
        // This is the REST response object from the "spawn/view" request that needs to be processed
        // after the spawn is alive and well, or if it has failed to start properly. Once it's
        // processed, it will be set to null so that it only gets processed once.
        this.brokerResponse = null;
        this.wsReq = null;
        this.wsSocket = null;
        this.wsHead = null;
        this.connectionType = connectionType;
        this.renderingLocation = renderingLocation;
        this.sessionToken = sessionToken;
        this.modelSearchDirectories = modelSearchDirectories;
        this.modelFile = modelFile;
    }
    static createWsProxyConfig(req, socket, head, renderingLocation) {
        const config = new SpawnConfig(ConnectionType.WsProxy, renderingLocation, null, null, null);
        config.wsHead = head;
        config.wsReq = req;
        config.wsSocket = socket;
        return config;
    }
    static createBrokerConfig(res, renderingLocation, sessionToken, modelSearchDirectories, modelFile) {
        const config = new SpawnConfig(ConnectionType.Broker, renderingLocation, sessionToken, modelSearchDirectories, modelFile);
        config.brokerResponse = res;
        return config;
    }
    isBrokerType() { return this.connectionType === ConnectionType.Broker; }
    isWsProxyType() { return this.connectionType === ConnectionType.WsProxy; }
}
exports.SpawnConfig = SpawnConfig;
/** Contextual information about a spawned streamer */
class SpawnProcessInfo {
    constructor(exePath, spawnConfig, spawnPort, gpuIndex) {
        this.id = uuidv4();
        this.state = SpawnState.Dead;
        // Holds the childProcess created by the spawn.
        this.childProcess = null;
        this.spawnTime = Date.now();
        this.lastUpdateTime = Date.now();
        this.killTime = 0;
        // TODO: correct type
        this.proxyServer = null;
        this.exePath = exePath;
        this.exeName = path.basename(exePath);
        this.config = spawnConfig;
        this.spawnPort = spawnPort;
        this.gpuIndex = gpuIndex;
    }
    isBrokerType() { return this.config.isBrokerType(); }
    isWsProxyType() { return this.config.isWsProxyType(); }
}
exports.SpawnProcessInfo = SpawnProcessInfo;
//# sourceMappingURL=SpawnerTypes.js.map