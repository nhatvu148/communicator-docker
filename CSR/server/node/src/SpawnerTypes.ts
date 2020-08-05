import * as http from 'http';
import * as net from 'net';
import * as path from 'path';
import * as uuidv4 from 'uuid/v4';
import * as express from 'express';
import * as child_process from 'child_process';
import {logger} from "./Logging";

/** Internet protocol configuration */
export enum IPVersion {
    Auto = "auto",
    ForceIPv4 = "forceIPv4",
    
    /// SCW: IPv6 is disabled until the stream-cache is updated to support it, but we're leaving 
    /// the bulk of the code in here as "disabled" so we don't have to redo it later. 
    ForceIPv6Disabled = "forceIPv6Disabled",
}

/** Logging time formats */
export enum LogTimeFormat {
    ISO = "iso",
    Local = "local",
    Delta = "delta",
}

// Valid levels in order are: "error", "warn", "info", "verbose", "debug"
export enum LogLevel {
    Error = "error",
    Warn = "warn",
    Info = "info",
    Verbose = "verbose",
    Debug = "debug",
}

export enum  LogSpawnCategory {
    None = 0,
    Error = 1 << 0,
    Warn = 1 << 1,
    Info = 1 << 2,
    Debug = 1 << 3,
    All = 0xff,
}

/** User config for spawner */
export interface UserConfig {
    // License settings
    readonly license?: string | null; // A valid communicator license if 'licenseFile' not specified
    readonly licenseFile?: string | null;   // A valid communicator licenseFile if 'license" not specified

    // Networking settings
    readonly ipVersion: IPVersion | null;  // Defaults to "auto" when unset
    readonly publicHostname: string | null;   // Public hostname used for broker mode or SSL cert validation
    readonly spawnServerPort: number;    // Port that the Spawner will listen on for REST calls
    readonly spawnWebsocketPortsBegin: number;  // First port for spawn WS connections. Each spawn uses 1 WS port

    // SSL
    readonly sslPrivateKeyFile: string | null;  // Private key file path
    readonly sslCertificateFile: string | null;    // "full chain" certificate file path
    readonly sslEnableFileServer: boolean | null;   // Should the file server use SSL?
    readonly sslEnableSpawnServer: boolean | null;   // Should the spawn server use SSL?
    readonly sslEnableScServer: boolean | null;   // Should the stream-cache server use SSL?

    // Limits
    readonly spawnMaxSpawnCount: number;   // Maximum number of simultaneous spawns
    readonly spawnLivelinessReportIntervalTime: number; // How often a spawn will issue a liveliness ping to the server in seconds.
    readonly spawnInitialUseDuration?: number | null; // Seconds after which time the spawn will exit with no initial activity (default 60)

    // CSR/SSR
    readonly csrEnabled: boolean; // Determines if client-side rendering is enabled
    readonly ssrEnabled: boolean; // Determines if server-side rendering is enabled
    readonly ssrGpuCount?: number | null; // Number of GPUs to choose between, or 'null' for no explicit choice.
    readonly ssrUseEgl?: boolean; // Use Egl for context creation.  Only supported on linux.

    // Internal functionality
    readonly autoGcIntervalTime?: number | null; // If set to non-null, this will cause the garbage collection to be run at explicitly at the specified interval (in seconds)
    readonly disableConsoleEnterToShutdown?: boolean | null; // If true, Enter on console won't shutdown the server

    // Windows Service support
    readonly windowsServiceRespawnEnabled?: boolean | null; 
    readonly windowsServiceRespawnLogSuffix?: string | null;
    
    // Directory / package config
    readonly communicatorDir: string; // Root directory for communicator installation
    readonly modelDirs: string[];     // Locations of model files
    readonly workspaceDir?: string | null;   // Temporary directory for stream-cache files.
    readonly streamCacheExeFile?: string | null;  // Path to stream-cache server file. Can be 'null' for default package server

    // Logging
    readonly logDir?: string;          // Directory to place log files

    // Spawn logging
    readonly logSpawnFileCategoryMask?: number; // Enabled categories for spawn file logs. 0 disables 
    readonly logSpawnStdoutCategoryMask?: number; // Enabled categories for spawn stdout logging. 0 disables 
    readonly logSpawnUseDeltaTime?: boolean; // Enabled categories for spawn logs. 0 disables spawn logging.

    // Server logging
    readonly logFileTimeFormat?: LogTimeFormat | null; // Use absolute or relative time stamps in logs
    readonly logConsoleTimeFormat?: LogTimeFormat | null; // Use absolute or relative time stamps in logs
    readonly logFileLevelCutoff?: LogLevel | null;    // Winston log-Level cutoff for file logging: crit, error, warning, info, debug
    readonly logConsoleLevelCutoff?: LogLevel | null; // Level for console logging. See 'logFileLevel'
    readonly logStdoutAsLevel?: LogLevel | null; // Level for stdout logging. See 'logFileLevel'
    readonly logStderrAsLevel?: LogLevel | null; // Level for stderr logging. See 'logFileLevel'
    readonly logRestFilterRegex?: RegExp | null; // If set, any REST requests who's URL tests true against the regex will be hidden.
    readonly logRestHttpRequestsAsLevel?: LogLevel | null; // Log level for REST HTTP requests. null/undefined to disable
    readonly logFileHttpRequestsAsLevel?: LogLevel | null; // Log level for file HTTP requests. null/undefined to disable

    // Http file server
    readonly fileServerPort?: number | null; // If null, no file-server is created
    readonly fileServerStaticDirs?: string[] | null; // Array of directories to be used as static file roots
    readonly fileServerProxyViewerConnections?: boolean | null; // If true, direct `ws://` connections are supported
}

/** Application config. This will have some redundant entries to the UserConfig, but allows us to not
 *  need to modify the incoming UserConfig values.  It also allows us to see both the user-provided config values
 *  and the application transformed values via a "/status" check */
export interface AppConfig extends UserConfig {
    readonly serverDir: string;
    readonly spawnExeAbsFile: string;
    readonly communicatorAbsDir: string;
    readonly logAbsDir: string;
    readonly modelAbsDirs: string[];
    readonly workspaceAbsDir: string | null;
    readonly licenseAbsFile: string;
    readonly shutdownCallback: (exitCode: number) => void;
    readonly statusUriBase: string;
    readonly fileServerStaticAbsDirs?: string[] | null;

    readonly sslPrivateKeyAbsFile: string | null;
    readonly sslCertificateAbsFile: string | null;
    readonly sslPrivateKey: Buffer | null;
    readonly sslCertificate: Buffer | null;
}

/** CSR or SSR */
export enum RenderingLocation {
    Client = "client",
    Server = "server",
}

/** Current state of spawn */
export enum SpawnState {
    // The spawn has been launched, but has not reported in as ready
    Launching = "launching",

    // A spawn is "ready" after it has reported in that's ready which indicates it can start streaming 3D data
    Ready = "ready",

    // A suspect spawn has not reported in via a ping for a specified time. Once suspect, a nice-kill
    // will follow shortly unless the spawn reports
    Suspect = "suspect",

    // The spawn has disconnected voluntarily. It should soon exit on it's own
    Disconnected = "disconnected",

    // NiceKilled is our first attempt to kill a spawn. The spawn should be able to detect this
    // request and do a graceful shutdown.
    NiceKilled = "nice-killed",

    // Killed indicates that the NiceKilled didn't work, so we do a hard/abrupt kill on the spawn
    Killed = "killed",

    // Zombie indicates that the spawn hasn't responded to a hard kill. We can't do more with it,
    // but we can at least recognize it internally and report it via status
    Zombie = "zombie",

    // The spawn has died. The spawn information will get reclaimed during our next maintenance cycle
    Dead = "dead",
}

export enum ConnectionType {
    Broker = "broker",
    WsProxy = "ws-proxy",
}

/** Per-spawn configuration values that are used prior to the spawn-child process creation.
 *
 *  This would be an appropriate place to add per-spawn parameters
 *  such as a temporary model directory. Like, if you were to load a model from S3 to a temporary location, that
 *  location directory could be added here and used to override the spawn's model dirs
 */
export class SpawnConfig {
    public readonly renderingLocation: RenderingLocation;

    // Session tokens are always optional
    public readonly sessionToken: string | null;

    // Broker, or proxy.
    public readonly connectionType: ConnectionType;

    // Additional model search directories for the SC streaming server.
    // The paths specified here will have a higher priority than those specified in the config file.
    public modelSearchDirectories: string[];

    // A Model path that will override anything specified via the WebViewer constructor.
    public modelFile: string | null;

    // This is the REST response object from the "spawn/view" request that needs to be processed
    // after the spawn is alive and well, or if it has failed to start properly. Once it's
    // processed, it will be set to null so that it only gets processed once.
    public brokerResponse: express.Response | null = null;
    public wsReq: http.IncomingMessage | null = null;
    public wsSocket: net.Socket | null = null;
    public wsHead: any = null;

    constructor(
        connectionType: ConnectionType,
        renderingLocation: RenderingLocation,
        sessionToken: string | null,
        modelSearchDirectories: string[] | null,
        modelFile: string | null) {
        this.connectionType = connectionType;
        this.renderingLocation = renderingLocation;
        this.sessionToken = sessionToken;
        this.modelSearchDirectories = modelSearchDirectories;
        this.modelFile = modelFile;
    }

    public static createWsProxyConfig(
        req: http.IncomingMessage, socket: net.Socket, head: any,
        renderingLocation: RenderingLocation) : SpawnConfig {
        const config = new SpawnConfig(ConnectionType.WsProxy, renderingLocation, null, null, null);
        config.wsHead = head;
        config.wsReq = req;
        config.wsSocket = socket;
        return config;
    }

    public static createBrokerConfig(
        res: express.Response,
        renderingLocation: RenderingLocation,
        sessionToken: string | null,
        modelSearchDirectories: string[] | null,
        modelFile: string | null) : SpawnConfig {
        const config = new SpawnConfig(ConnectionType.Broker, renderingLocation, sessionToken, modelSearchDirectories, modelFile);
        config.brokerResponse = res;
        return config;
    }

    public isBrokerType() : boolean { return this.connectionType === ConnectionType.Broker; }
    public isWsProxyType() : boolean { return this.connectionType === ConnectionType.WsProxy; }
}

/** Contextual information about a spawned streamer */
export class SpawnProcessInfo {
    public readonly exePath: string;    // Full path to the exe
    public readonly exeName: string; // Just the name of the exe, like 'ts3d_sc_server.exe' on windows
    public readonly config: SpawnConfig;
    public readonly id: string = uuidv4();
    public readonly gpuIndex: number | null;

    public spawnPort: number;

    public state: SpawnState = SpawnState.Dead;

    // Holds the childProcess created by the spawn.
    public childProcess: child_process.ChildProcess | null = null;

    public spawnTime: number = Date.now();
    public lastUpdateTime: number = Date.now();
    public killTime: number = 0;

    // TODO: correct type
    public proxyServer: any | null = null;

    constructor(exePath: string, spawnConfig: SpawnConfig, spawnPort: number, gpuIndex: number | null) {
        this.exePath = exePath;
        this.exeName = path.basename(exePath);
        this.config = spawnConfig;
        this.spawnPort = spawnPort;
        this.gpuIndex = gpuIndex;
    }

    public isBrokerType() : boolean { return this.config.isBrokerType(); }
    public isWsProxyType() : boolean { return this.config.isWsProxyType(); }
}

