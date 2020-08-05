#pragma once
#define _SC_SERVER_H

#include <memory>
#include <string>
#include <chrono>
#include <functional>

#undef TS3D_API_EXPORT
#if _WIN32
#  if TS3D_LIBSCSERVER_BUILD
#    define TS3D_API_EXPORT __declspec (dllexport)
#  else
#    define TS3D_API_EXPORT
#  endif
#elif __linux__ || __APPLE__
#  if TS3D_LIBSCSERVER_BUILD
#    define TS3D_API_EXPORT __attribute__ ((visibility ("default")))
#  else
#    define TS3D_API_EXPORT
#  endif
#else
#  error "Fix export symbols for this OS"
#endif

namespace SC {
namespace Store {
class MemoryDevice;
}
}

namespace SC {
namespace Server {

/*! Provides control over rendering locations supported by a server instance. */
enum TS3D_API_EXPORT RenderingLocation : uint8_t {
    RenderingLocationNone = 0,

    RenderingLocationClient = 1u << 0, 
    RenderingLocationServer = 1u << 1,

    RenderingLocationDefault = RenderingLocationClient, 
    RenderingLocationAll = RenderingLocationClient | RenderingLocationServer,
};

/*! Logging categories for use with libwebsockets. Can be combined using binary-or to specify which 
 * categories are enabled.  */
enum TS3D_API_EXPORT LwsLogCategory : uint32_t {
    LwsLogCategoryNone = 0,
    LwsLogCategoryError = 1u << 0,
    LwsLogCategoryWarn = 1u << 1,
    LwsLogCategoryNotice = 1u << 2,
    LwsLogCategoryInfo = 1u << 3,
    LwsLogCategoryDebug = 1u << 4,
    LwsLogCategoryParser = 1u << 5,
    LwsLogCategoryHeader = 1u << 6,
    LwsLogCategoryExit = 1u << 7,
    LwsLogCategoryClient = 1u << 8,
    LwsLogCategoryLatency = 1u << 9,
};

/*! Logging categories for use with the SC server. */
enum class TS3D_API_EXPORT LogCategory : uint8_t {
    Error, 
    Warning, 
    Info, 
    Debug, 
    Trace
};

// Indicates the state of the streamer. Idle indicates it's done streaming for the time being. 
enum class TS3D_API_EXPORT StreamTerminatorState : uint32_t {
    End = 0,
    Cancel = 1,
    Idle = 2,
};

/*! Allows an application to connect to a web-viewer client and stream CAD model data to it */
class StreamCacheServer {
public:
    /*! Function signature used for configuring stream-cache diagnostic logging callbacks  */
    using LogCallback = std::function<void(LogCategory cat, std::string const& message)>;
    /*! Function signature used for configuring the libwebsockets logging callback. */
    using LwsLogCallback = std::function<void(int cat, std::string const& message)>;
    /*! Function signature used for configuring stream-cache callbacks  */
    using MessageCallback = std::function<void(std::string const& message)>;
    /*! Function signature used for configuring stream-cache I/O stats callbacks  */
    using DataCallback = std::function<void(uint32_t rx, uint32_t tx, StreamTerminatorState terminator)>;
    /*! Function signature used for configuring stream-cache notify callbacks  */
    using NotifyCallback = std::function<void()>;

    /*! Use to configure the various settings used by the stream-cache. */
    struct Config
    {
        /*! A networking port used for websocket communications with the web-viewer client. */
        uint16_t port = 0;

        /*! Determines if client and/or server rendering is allowed. It's valid to set either mode, or
         *  both. The web-viewer will request the type of rendering when it first connects, and will only
         *  succeeded if the matching type has been enabled with this setting. */
        RenderingLocation enabledRenderingLocations = RenderingLocation::RenderingLocationDefault;

        /*! A valid HOOPS Communicator license must be specified */
        std::string license; 

        /*! An optional stream-cache memory device which is useful for sandboxing file I/O within 
         *  application memory. See sc_store.h for more information. If this is set to a valid memory 
         *  device, the paths defined by 'workspaceDir' and 'modelSearchDirs' must point to directories 
         *  within this device. If it is null, then those directories will be interpreted within the 
         *  standard filesystem. 
         */
        SC::Store::MemoryDevice* memoryDevice = nullptr;

        /*! An optional path to a directory that will be used for temporary storage. If this setting is empty, 
         * the current working directory will be used. */
        std::string workspaceDir;

        /*! A list of directory paths to be used when searching for a model file. This is a single string with each
         * directory path concatenated, and using a single semi-colon character to separate each path. */
        std::string modelSearchDirs;

        /*! An optional relative-only file path that, when set to a non-empty string, will override any model requested by the 
         * web-viewer client. This should be a model file name that exists within the specified 
         * 'modelSearchDirs' setting. ie. "bnc". */
        std::string modelFile;

        /*! An optional token that must be shared with the web-viewer client. The string is simply compared for
         * equality against the session token provided by the client, thus there is no format specification. */
        std::string sessionToken;

        /*! A file path to an SSL certificate, which is needed to support the 'wss' protocol. */
        std::string sslCertificateFile;

        /*! A file path to an SSL private key, which is needed to support the 'wss' protocol. */
        std::string sslPrivateKeyFile;

        /*! Optional 0-based index for specifying which GPU to be used. If set to 
         *  'std::numeric_limits<uint32_t>::max()', then the server will use the default GPU */
        uint32_t ssrGpuIndex = std::numeric_limits<uint32_t>::max();

        /*! Indicates the amount of time that the tick() function will sleep for after performing a work
         * cycle. The value here will set the internal default used when the tick() function is called with
         * no value. It can be overridden by providing an explicit value to the tick() function.
         * A negative value will result in the tick() call not sleeping after the work cycle. */
        std::chrono::milliseconds tickTimeout = std::chrono::milliseconds{-1};

        /*! When true, this indicates that this stream-cache session should should allow a new web-viewer 
         *  connection to take priority over the existing connection. If this happens, the existing 
         *  connection will be closed, and the new connection can proceed. */
        bool kickOnNewConnection = false;

        /*! Specifies an optional file path that will be used to record server-side rendering commands 
         * for later replay via the 'rpcLogFileRead' setting. */
        std::string rpcLogFileWrite; 

        /*! Specifies an optional file path to a server-side rendering log session that will be replayed 
         * upon a "bounding" event trigger */
        std::string rpcLogFileRead; 

        /*! If true, increased diagnostic messages will be sent to the onDebug callback. */
        bool verboseLogging = false; 

        /*! This will set the enabled log-levels for the internal libwebsocket library. It can be 
         * a bitwise-or of LwsLogCategory values. */
        LwsLogCategory lwsLogLevel = LwsLogCategoryNone; 

        /*! Optional function that will receive the libwebsocket log messages that were enabled by 
         * the 'lowLogLevel' setting. */
        LwsLogCallback onLwsLog; 

        /*! Optional function that will receive a stream-cache log messages */
        LogCallback onLog; 

        /*! Optional function that will be called upon a client disconnect. The message indicates 
         * why the client disconnected. */
        MessageCallback onDisconnect; 

        /*! Optional function that will be called with incremental data transmit and receive 
         * statistics. */
        DataCallback onData; 

        /*! Optional function that will be called upon the initial client connection */
        NotifyCallback onInitialUse;

        /*! If true, and the server is running on a Linux system, will use EGL for OpenGL context creation in the case of Server Side Rendering.
         * The use of this option is recommended for headless server environments which are equipped with graphics cards. */
        bool ssrEgl = false;
    };

    TS3D_API_EXPORT StreamCacheServer();
    TS3D_API_EXPORT ~StreamCacheServer();

    // Move enabled
    TS3D_API_EXPORT StreamCacheServer(StreamCacheServer&&);
    TS3D_API_EXPORT StreamCacheServer& operator=(StreamCacheServer&&);

    // Copying disabled 
    StreamCacheServer(StreamCacheServer const&) = delete;
    StreamCacheServer& operator=(StreamCacheServer const&) = delete;

    /*! Initializes the stream-cache using the given configuration. This must be called before 
     * the stream-cache can accept incoming connections and perform any model streaming, and 
     * must only be called once. 
     * 
     * \param config The configuration to be used for the stream-cache server. 
     * \param errorMessage Will contain an error message if the initialization failed, otherwise 
     *                    will be returned as empty. 
     * \return true if the initialization succeeded, else false. 
     */
    TS3D_API_EXPORT bool Init(Config const& config, std::string& errorMessage);

    /*! Performs a stream-cache processing cycle which will service the client connection and 
     * stream out model data. The function will return after completion of the cycle which is 
     * relatively short, and is therefore intended to be called repeatedly from within a loop. 
     * 
     * After the cycle is complete, if a positive timeout value was set either via the 
     * configuration 'tickTimeout' setting, or by the 'timeout' function argument, then the 
     * function will sleep for that specified amount of time. This will ensure the current 
     * thread yields and allows other threads processing time. 
     *
     * \param timeout Optional parameter that, when set to a positive value, will override 
     *    the configuration 'tickTimeout' value and cause the tick() function to sleep at 
     *    the end of its processing cycle. 
     */
    TS3D_API_EXPORT void Tick(std::chrono::milliseconds timeout = std::chrono::milliseconds{-1});

    /*! Shuts down the stream-cache and performs any final cleanup. After calling this, the 
     *  tick() function should not be called again. */
    TS3D_API_EXPORT void Stop();

private: 
    class Impl;
    std::unique_ptr<Impl> impl_; 
};

}   // namespace Server
}   // namespace SC

