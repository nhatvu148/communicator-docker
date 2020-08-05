"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const process = require("process");
const winston = require("winston");
const logform = require("logform");
const Utils_1 = require("./Utils");
const SpawnerTypes_1 = require("./SpawnerTypes");
const kTwoDigitFormatter = new Intl.NumberFormat('en-US', { minimumIntegerDigits: 2 });
const kDeltaFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
});
const format = logform.format;
// Start time for the server. Used for delta time and also logged
const kStartTime = new Date();
const gLogger = winston.createLogger();
/** Winston logger formatter object to support delta-time */
const deltaTimeFormatter = format((info, opts = {}) => {
    const now = Date.now();
    const delta = (now - kStartTime.valueOf()) / 1000.0; // Convert to time in seconds
    info.deltaTime = kDeltaFormatter.format(delta);
    return info;
});
/** Winston logger formatter object to support ISO style absolute-time */
const isoTimeFormatter = format((info, opts = {}) => {
    // TODO: This format should get reconciled against the log format for
    // TODO: ts3d_sc_server. They should output the identical format. (research needed)
    info.isoTime = new Date().toISOString();
    return info;
});
/** Winston logger formatter object to support Local-time style absolute-time */
const localTimeFormatter = format((info, opts = {}) => {
    // TODO: This format should get reconciled against the log format for
    // TODO: ts3d_sc_server. They should output the identical format. (research needed)
    info.localTime = new Date().toLocaleString();
    return info;
});
/** Creates a winston formatter for our given time format */
function createFormatter(format, useColor = false) {
    const { combine, colorize, printf } = winston.format;
    switch (format) {
        case SpawnerTypes_1.LogTimeFormat.Delta: {
            const custom = printf(({ deltaTime, level, message }) => {
                return `${deltaTime}:${level}: ${message}`;
            });
            return useColor ? combine(deltaTimeFormatter(), colorize(), custom) :
                combine(deltaTimeFormatter(), custom);
        }
        case SpawnerTypes_1.LogTimeFormat.ISO: {
            const custom = printf(({ isoTime, level, message }) => {
                return `${isoTime}:${level}: ${message}`;
            });
            return useColor ? combine(isoTimeFormatter(), colorize(), custom) :
                combine(isoTimeFormatter(), custom);
        }
        case SpawnerTypes_1.LogTimeFormat.Local:
        default: {
            const custom = printf(({ localTime, level, message }) => {
                return `${localTime}:${level}: ${message}`;
            });
            return useColor ? combine(localTimeFormatter(), colorize(), custom) :
                combine(localTimeFormatter(), custom);
        }
    }
}
/** Creates a file-transport object for a logger. Note that the format is not json at this
 *  time. We can make that a config option when needed. The overall format however is designed
 *  to mirror the sc_server log format which is human readable.
 *  @return Tuple with first value as a string to be logged, the second is the created Transport
 */
function createFileLogger(userConfig) {
    if (!userConfig.logDir || !userConfig.logFileLevelCutoff || !userConfig.logFileTimeFormat) {
        return [`File logging disabled by config`, null];
    }
    // Create the logDir if we can. We must use the commDir to honor the config
    // notion that "all relative dirs are relative to the commDir"
    const logDirAbs = Utils_1.resolveDirs(Utils_1.expandHomeDir(userConfig.communicatorDir), userConfig.logDir);
    try {
        fs.mkdirSync(logDirAbs, { recursive: true });
    }
    catch (error) {
        return [`File logging disabled - unable to create logging directory: ${logDirAbs}`, null];
    }
    // Filename format: comm_server_YYYY_MM_DD_HH_MM_SS_<pid>.log
    const logPath = (() => {
        const fmt = kTwoDigitFormatter;
        const now = kStartTime;
        const logFilename = `comm_server_${now.getFullYear()}_${fmt.format(now.getMonth() + 1)}_\
${fmt.format(now.getDate())}_${fmt.format(now.getHours())}_${fmt.format(now.getMinutes())}_\
${fmt.format(now.getSeconds())}_${process.pid}.log`;
        const logPath = path.join(logDirAbs, logFilename);
        return logPath;
    })();
    const formatter = createFormatter(userConfig.logFileTimeFormat ? userConfig.logFileTimeFormat : SpawnerTypes_1.LogTimeFormat.ISO);
    const transport = new winston.transports.File({
        format: formatter,
        level: userConfig.logFileLevelCutoff,
        filename: `${logPath}`,
        handleExceptions: true,
        maxsize: 1024 * 1024 * 10,
        maxFiles: 5,
    });
    const logString = `File logging enabled at ${logPath}`;
    return [logString, transport];
}
/** Creates a console-transport for a winston logger */
function createConsoleLogger(userConfig) {
    // Check if console logging is disabled. We always add it console transport even if it's
    // disabled so that winston has at least one transport
    const isSilent = userConfig.logConsoleLevelCutoff ? false : true;
    const formatter = createFormatter(userConfig.logConsoleTimeFormat ? userConfig.logConsoleTimeFormat : SpawnerTypes_1.LogTimeFormat.Local, true);
    return new winston.transports.Console({
        format: formatter,
        silent: isSilent,
        level: userConfig.logConsoleLevelCutoff,
        handleExceptions: true,
    });
}
/** Creates the application logger, accessible via logger() */
function createLogger(userConfig) {
    gLogger.clear();
    gLogger.exitOnError = false;
    gLogger.on('error', function (err) {
        // SCW uncomment this for debugging
        // console.error(`logging error: ${err.message}`);
    });
    // Setup our logging targets (aka transports) Note that we always include the console even
    // if it's disabled by the config so that we don't have issues with our log calls and no transports
    const consoleTransport = createConsoleLogger(userConfig);
    const [fileLoggingMessage, fileTransport] = createFileLogger(userConfig);
    // Setup the console logger - only log the file-logging message to the console log
    if (consoleTransport) {
        gLogger.add(consoleTransport);
        if (fileLoggingMessage) {
            gLogger.info(fileLoggingMessage);
        }
    }
    // Setup the file logger
    if (fileTransport) {
        gLogger.add(fileTransport);
    }
    // Always log our start time. This is important for delta-time mode
    gLogger.info(`Start Time Local: ${kStartTime.toLocaleString()}, ISO: ${kStartTime.toISOString()}`);
}
exports.createLogger = createLogger;
/** Gets the global application logger */
function logger() {
    return gLogger;
}
exports.logger = logger;
//# sourceMappingURL=Logging.js.map