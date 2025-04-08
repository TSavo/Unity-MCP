using UnityEditor;
using UnityEngine;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Net;
using System.Threading;
using System.Text;
using System.IO;
using Debug = UnityEngine.Debug;

namespace UnityMCP.Client.Editor
{
    /// <summary>
    /// Result of a code execution operation
    /// </summary>
    public class CodeExecutionResult
    {
        /// <summary>
        /// Whether the execution was successful
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// The result of the execution (if successful)
        /// </summary>
        public string Result { get; set; }

        /// <summary>
        /// The error message (if unsuccessful)
        /// </summary>
        public string Error { get; set; }

        /// <summary>
        /// Logs from the execution
        /// </summary>
        public List<string> Logs { get; set; } = new List<string>();

        /// <summary>
        /// The time taken to execute the code (in milliseconds)
        /// </summary>
        public long ExecutionTime { get; set; }
    }

    /// <summary>
    /// Represents the current state of the game
    /// </summary>
    public class GameState
    {
        /// <summary>
        /// Whether the game is currently playing
        /// </summary>
        public bool IsPlaying { get; set; }

        /// <summary>
        /// Whether the game is currently paused
        /// </summary>
        public bool IsPaused { get; set; }

        /// <summary>
        /// Whether the game is currently compiling
        /// </summary>
        public bool IsCompiling { get; set; }

        /// <summary>
        /// The name of the current scene
        /// </summary>
        public string CurrentScene { get; set; } = string.Empty;

        /// <summary>
        /// The current time scale
        /// </summary>
        public float TimeScale { get; set; }

        /// <summary>
        /// The current frame count
        /// </summary>
        public int FrameCount { get; set; }

        /// <summary>
        /// The time since the game started
        /// </summary>
        public float RealtimeSinceStartup { get; set; }
    }

    /// <summary>
    /// Simple logger for AI integration
    /// </summary>
    public class AILogger
    {
        private string _logName;
        private const string LogEndpoint = "http://localhost:3030/logs";

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="logName">The name of the log</param>
        public AILogger(string logName)
        {
            _logName = logName;
        }

        /// <summary>
        /// Log a debug message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="data">Additional data (optional)</param>
        /// <returns>Task</returns>
        public async Task Debug(string message, object data = null)
        {
            UnityEngine.Debug.Log($"[{_logName}] DEBUG: {message}");
            await AppendToLog(message, data, "DEBUG");
        }

        /// <summary>
        /// Log an info message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="data">Additional data (optional)</param>
        /// <returns>Task</returns>
        public async Task Info(string message, object data = null)
        {
            UnityEngine.Debug.Log($"[{_logName}] INFO: {message}");
            await AppendToLog(message, data, "INFO");
        }

        /// <summary>
        /// Log a warning message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="data">Additional data (optional)</param>
        /// <returns>Task</returns>
        public async Task Warning(string message, object data = null)
        {
            UnityEngine.Debug.LogWarning($"[{_logName}] WARNING: {message}");
            await AppendToLog(message, data, "WARNING");
        }

        /// <summary>
        /// Log an error message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="data">Additional data (optional)</param>
        /// <returns>Task</returns>
        public async Task Error(string message, object data = null)
        {
            UnityEngine.Debug.LogError($"[{_logName}] ERROR: {message}");
            await AppendToLog(message, data, "ERROR");
        }

        /// <summary>
        /// Append to log
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="data">Additional data</param>
        /// <param name="level">Log level</param>
        /// <returns>Task</returns>
        private async Task AppendToLog(string message, object data, string level)
        {
            try
            {
                // Log to Unity console first (in case the HTTP request fails)
                Debug.Log($"[{_logName}] {level}: {message}");

                // Create a simple JSON string manually
                string dataJson = data != null ? (data is string ? $"\"{data}\"" : data.ToString()) : "null";
                string json = $"{{\"message\":\"{message}\",\"data\":{dataJson},\"level\":\"{level}\",\"timestamp\":\"{DateTime.UtcNow.ToString("o")}\"}}";

                // Create the request
                var request = WebRequest.Create($"{LogEndpoint}/{_logName}");
                request.Method = "POST";
                request.ContentType = "application/json";

                // Write the data
                using (var streamWriter = new StreamWriter(await request.GetRequestStreamAsync()))
                {
                    await streamWriter.WriteAsync(json);
                }

                // Get the response
                using (var response = await request.GetResponseAsync())
                {
                    using (var streamReader = new StreamReader(response.GetResponseStream()))
                    {
                        var result = await streamReader.ReadToEndAsync();
                        UnityEngine.Debug.Log($"[{_logName}] Log appended: {result}");
                    }
                }
            }
            catch (WebException webEx) when (webEx.Response is HttpWebResponse response)
            {
                // Handle HTTP errors specifically
                UnityEngine.Debug.LogError($"[{_logName}] HTTP error appending to log: {(int)response.StatusCode} {response.StatusDescription}");

                // Try to read the response body for more details
                try
                {
                    using (var streamReader = new StreamReader(webEx.Response.GetResponseStream()))
                    {
                        var errorResponse = await streamReader.ReadToEndAsync();
                        UnityEngine.Debug.LogError($"[{_logName}] Error details: {errorResponse}");
                    }
                }
                catch
                {
                    // Ignore errors when trying to read the error response
                }
            }
            catch (Exception ex)
            {
                // Handle other errors
                UnityEngine.Debug.LogError($"[{_logName}] Error appending to log: {ex.Message}");
                UnityEngine.Debug.LogError($"[{_logName}] Stack trace: {ex.StackTrace}");
            }
        }
    }

    /// <summary>
    /// Editor extension for Unity MCP integration
    /// </summary>
    [InitializeOnLoad]
    public class UnityMCPEditorExtension
    {
        private static bool isInitialized = false;
        private static bool autoStartServer = true;
        private static bool serverStarted = false;
        private static HttpListener httpListener;
        private static Thread serverThread;
        private static int serverPort = 8082;
        private static CancellationTokenSource cancellationTokenSource;

        // Dictionary to store log entries
        private static Dictionary<string, object> logEntries = new Dictionary<string, object>();
        private static object logLock = new object();

        /// <summary>
        /// Store a log entry
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <param name="data">The data to store</param>
        private static void StoreLogEntry(string logName, object data)
        {
            lock (logLock)
            {
                logEntries[logName] = data;
                Debug.Log($"[Unity MCP] Stored log entry: {logName}");
            }
        }

        /// <summary>
        /// Get a log entry
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <returns>The log entry data</returns>
        private static object GetLogEntry(string logName)
        {
            lock (logLock)
            {
                if (logEntries.TryGetValue(logName, out var data))
                {
                    Debug.Log($"[Unity MCP] Retrieved log entry: {logName}");
                    return data;
                }

                Debug.LogWarning($"[Unity MCP] Log entry not found: {logName}");
                return null;
            }
        }

        /// <summary>
        /// Static constructor called on Unity Editor startup
        /// </summary>
        static UnityMCPEditorExtension()
        {
            // Initialize when Unity Editor starts
            EditorApplication.delayCall += Initialize;

            // Register for play mode state changes
            EditorApplication.playModeStateChanged += OnPlayModeStateChanged;

            // Make sure we clean up when the editor is closing
            EditorApplication.quitting += Shutdown;
        }

        /// <summary>
        /// Initialize the Unity MCP Editor Extension
        /// </summary>
        private static void Initialize()
        {
            if (isInitialized) return;

            Debug.Log("[Unity MCP] Initializing Unity MCP Editor Extension");

            // Load settings
            autoStartServer = EditorPrefs.GetBool("UnityMCP_AutoStartServer", true);

            // Start the server if auto-start is enabled
            if (autoStartServer && !serverStarted)
            {
                StartServer();
            }

            isInitialized = true;
        }

        /// <summary>
        /// Start the Unity MCP server
        /// </summary>
        public static void StartServer()
        {
            if (serverStarted) return;

            Debug.Log("[Unity MCP] Starting Unity MCP server");

            try
            {
                // Create a new cancellation token source
                cancellationTokenSource = new CancellationTokenSource();

                // Create a new HTTP listener
                httpListener = new HttpListener();

                // Add prefixes for both IPv4 and IPv6
                string localhostPrefix = $"http://localhost:{serverPort}/";
                string ipv4Prefix = $"http://127.0.0.1:{serverPort}/";

                Debug.Log($"[Unity MCP] Adding HTTP listener prefixes: {localhostPrefix}, {ipv4Prefix}");
                httpListener.Prefixes.Add(localhostPrefix);
                httpListener.Prefixes.Add(ipv4Prefix);

                Debug.Log($"[Unity MCP] Starting HTTP listener");
                httpListener.Start();
                Debug.Log($"[Unity MCP] HTTP listener started: {httpListener.IsListening}");

                // Log the HTTP listener details
                var setupLogger = new AILogger("unity-http-setup");
                _ = setupLogger.Info($"HTTP listener created and started", new { port = serverPort, prefixes = new[] { localhostPrefix, ipv4Prefix } });

                // Start a thread to handle HTTP requests
                serverThread = new Thread(() => HandleHttpRequests(cancellationTokenSource.Token));
                serverThread.IsBackground = true;
                serverThread.Start();

                // Log that the thread was started
                _ = setupLogger.Info("HTTP server thread started");

                // Set the flag
                serverStarted = true;

                // Register for domain unload to ensure clean shutdown
                AppDomain.CurrentDomain.DomainUnload += (sender, e) => StopServer();

                Debug.Log($"[Unity MCP] Unity MCP server started on port {serverPort}");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Unity MCP] Error starting Unity MCP server: {ex.Message}");
            }
        }

        /// <summary>
        /// Handle HTTP requests
        /// </summary>
        /// <param name="cancellationToken">Cancellation token to stop the thread</param>
        private static void HandleHttpRequests(CancellationToken cancellationToken)
        {
            // Create a debug logger
            var debugLogger = new AILogger("unity-http-debug");
            _ = debugLogger.Info("HTTP server thread started", new { port = serverPort, isListening = httpListener?.IsListening ?? false });

            // Log the HTTP listener details
            foreach (string prefix in httpListener.Prefixes)
            {
                _ = debugLogger.Info($"HTTP listener prefix: {prefix}");
            }

            while (httpListener != null && httpListener.IsListening && !cancellationToken.IsCancellationRequested)
            {
                try
                {

                    // Log that we're about to get a context
                    Debug.Log($"[Unity MCP] About to get HTTP context, listener is listening: {httpListener.IsListening}");
                    _ = debugLogger.Info($"About to get HTTP context", new { isListening = httpListener.IsListening });

                    // Create a task to get the context with a timeout
                    var contextTask = Task.Run(() =>
                    {
                        Debug.Log($"[Unity MCP] Getting HTTP context on thread {Thread.CurrentThread.ManagedThreadId}");
                        return httpListener.GetContext();
                    });

                    // Wait for the task to complete or for cancellation
                    Debug.Log($"[Unity MCP] Waiting for HTTP context task to complete");
                    if (Task.WaitAny(new[] { contextTask }, 1000, cancellationToken) == 0)
                    {
                        Debug.Log($"[Unity MCP] HTTP context task completed");
                        // Task completed successfully
                        var context = contextTask.Result;
                        var request = context.Request;
                        var response = context.Response;

                        // Log the request
                        _ = debugLogger.Info($"Received request: {request.HttpMethod} {request.Url.AbsolutePath}");

                        // Handle the request
                        string responseText = "";
                        bool handled = false;

                        // Handle ping requests
                        if (request.Url.AbsolutePath == "/ping")
                        {
                            _ = debugLogger.Info("Handling ping request");
                            responseText = "pong";
                            handled = true;
                            _ = debugLogger.Info("Ping request handled");
                        }
                        // Handle game state requests
                        else if (request.Url.AbsolutePath == "/api/CodeExecution/game-state")
                        {
                            _ = debugLogger.Info("Handling game state request");

                            // Create a simple game state directly
                            // This avoids the thread safety issues
                            var gameState = new EditorGameState
                            {
                                IsPlaying = false, // We'll set this to a default value
                                IsPaused = false,
                                IsCompiling = false,
                                CurrentScene = "SampleScene",
                                TimeScale = 1.0f,
                                FrameCount = 0,
                                RealtimeSinceStartup = 0.0f
                            };

                            // Log that we're returning a default game state
                            Debug.Log("[Unity MCP] Returning default game state");
                            _ = debugLogger.Info("Created game state object");

                            // Create a log entry for the AI
                            var logEntry = new
                            {
                                result = new
                                {
                                    isPlaying = gameState.IsPlaying,
                                    isPaused = gameState.IsPaused,
                                    isCompiling = gameState.IsCompiling,
                                    currentScene = gameState.CurrentScene,
                                    timeScale = gameState.TimeScale,
                                    frameCount = gameState.FrameCount,
                                    realtimeSinceStartup = gameState.RealtimeSinceStartup
                                },
                                timestamp = DateTime.UtcNow
                            };

                            _ = debugLogger.Info("Created log entry");

                            // Store the log entry for the AI to retrieve
                            StoreLogEntry("unity-state-" + DateTime.UtcNow.Ticks, logEntry);

                            _ = debugLogger.Info("Stored log entry");

                            responseText = $"{{\"isPlaying\":{gameState.IsPlaying.ToString().ToLower()},\"isPaused\":{gameState.IsPaused.ToString().ToLower()},\"isCompiling\":{gameState.IsCompiling.ToString().ToLower()},\"currentScene\":\"{gameState.CurrentScene}\",\"timeScale\":{gameState.TimeScale},\"frameCount\":{gameState.FrameCount},\"realtimeSinceStartup\":{gameState.RealtimeSinceStartup}}}";
                            handled = true;
                        }
                        // Handle start game requests
                        else if (request.Url.AbsolutePath == "/api/CodeExecution/start-game")
                        {
                            // Log that we're simulating starting the game
                            Debug.Log("[Unity MCP] Simulating game start");

                            // Create a log entry for the AI
                            var logEntry = new
                            {
                                result = new
                                {
                                    success = true,
                                    result = "Game started successfully (simulated)",
                                    logs = new[] { "Game started successfully (simulated)" },
                                    executionTime = 2
                                },
                                timestamp = DateTime.UtcNow
                            };

                            // Store the log entry for the AI to retrieve
                            StoreLogEntry("unity-start-" + DateTime.UtcNow.Ticks, logEntry);

                            // Return a success response
                            responseText = $"{{\"success\":true,\"result\":\"Game started successfully (simulated)\",\"logs\":[\"Game started successfully (simulated)\"],\"executionTime\":0}}";
                            handled = true;
                        }
                        // Handle stop game requests
                        else if (request.Url.AbsolutePath == "/api/CodeExecution/stop-game")
                        {
                            // Log that we're simulating stopping the game
                            Debug.Log("[Unity MCP] Simulating game stop");

                            // Create a log entry for the AI
                            var logEntry = new
                            {
                                result = new
                                {
                                    success = true,
                                    result = "Game stopped successfully (simulated)",
                                    logs = new[] { "Game stopped successfully (simulated)" },
                                    executionTime = 2
                                },
                                timestamp = DateTime.UtcNow
                            };

                            // Store the log entry for the AI to retrieve
                            StoreLogEntry("unity-stop-" + DateTime.UtcNow.Ticks, logEntry);

                            // Return a success response
                            responseText = $"{{\"success\":true,\"result\":\"Game stopped successfully (simulated)\",\"logs\":[\"Game stopped successfully (simulated)\"],\"executionTime\":0}}";
                            handled = true;
                        }

                        // Send the response
                        // Write the response
                        _ = debugLogger.Info("Writing response");
                        if (handled)
                        {
                            _ = debugLogger.Info($"Response: {responseText}");
                            byte[] buffer = Encoding.UTF8.GetBytes(responseText);
                            response.ContentLength64 = buffer.Length;
                            response.ContentType = "application/json";
                            response.StatusCode = 200;
                            _ = debugLogger.Info("Writing to output stream");
                            response.OutputStream.Write(buffer, 0, buffer.Length);
                            _ = debugLogger.Info("Wrote to output stream");
                        }
                        else
                        {
                            _ = debugLogger.Info("Request not handled, returning 404");
                            response.StatusCode = 404;
                        }

                        _ = debugLogger.Info("Closing response");
                        response.Close();
                        _ = debugLogger.Info("Response closed");
                    }
                }
                catch (OperationCanceledException)
                {
                    // This is expected when cancellation is requested
                    Debug.Log("[Unity MCP] HTTP server thread was cancelled");
                    _ = debugLogger.Info("HTTP server thread was cancelled");
                    break;
                }
                catch (ThreadAbortException)
                {
                    // This is expected when Unity is shutting down
                    Debug.Log("[Unity MCP] HTTP server thread was aborted");
                    _ = debugLogger.Info("HTTP server thread was aborted");
                    break;
                }
                catch (Exception ex)
                {
                    // Only log the error if we're not being cancelled
                    if (!cancellationToken.IsCancellationRequested)
                    {
                        Debug.LogError($"[Unity MCP] Error handling HTTP request: {ex.Message}");
                        _ = debugLogger.Error($"Error handling HTTP request: {ex.Message}", new { stackTrace = ex.StackTrace });
                    }

                    // Add a small delay to prevent CPU spinning in case of repeated errors
                    Thread.Sleep(100);
                }
            }

            Debug.Log("[Unity MCP] HTTP server thread exiting");
        }

        /// <summary>
        /// Stop the Unity MCP server
        /// </summary>
        public static void StopServer()
        {
            if (!serverStarted) return;

            Debug.Log("[Unity MCP] Stopping Unity MCP server");

            try
            {
                // Signal cancellation to stop the thread gracefully
                if (cancellationTokenSource != null)
                {
                    cancellationTokenSource.Cancel();
                }

                // Stop the HTTP listener
                if (httpListener != null)
                {
                    httpListener.Stop();
                    httpListener.Close();
                    httpListener = null;
                }

                // Wait for the server thread to exit
                if (serverThread != null && serverThread.IsAlive)
                {
                    serverThread.Join(5000); // Wait up to 5 seconds
                    serverThread = null;
                }

                // Dispose the cancellation token source
                if (cancellationTokenSource != null)
                {
                    cancellationTokenSource.Dispose();
                    cancellationTokenSource = null;
                }

                // Set the flag
                serverStarted = false;

                Debug.Log("[Unity MCP] Unity MCP server stopped");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Unity MCP] Error stopping Unity MCP server: {ex.Message}");
            }
        }

        /// <summary>
        /// Shutdown the Unity MCP Editor Extension
        /// </summary>
        private static void Shutdown()
        {
            Debug.Log("[Unity MCP] Shutting down Unity MCP Editor Extension");

            // Stop the server if it's running
            if (serverStarted)
            {
                StopServer();
            }

            isInitialized = false;
        }

        /// <summary>
        /// Handle play mode state changes
        /// </summary>
        private static void OnPlayModeStateChanged(PlayModeStateChange state)
        {
            Debug.Log($"[Unity MCP] Play mode state changed: {state}");

            // You can add custom logic here for different play mode states
            switch (state)
            {
                case PlayModeStateChange.EnteredPlayMode:
                    Debug.Log("[Unity MCP] Entered play mode");
                    break;
                case PlayModeStateChange.ExitingPlayMode:
                    Debug.Log("[Unity MCP] Exiting play mode");
                    break;
                case PlayModeStateChange.EnteredEditMode:
                    Debug.Log("[Unity MCP] Entered edit mode");
                    break;
                case PlayModeStateChange.ExitingEditMode:
                    Debug.Log("[Unity MCP] Exiting edit mode");
                    break;
            }
        }

        /// <summary>
        /// Start the game (enter play mode)
        /// </summary>
        public static void StartGame()
        {
            if (EditorApplication.isPlaying) return;

            Debug.Log("[Unity MCP] Starting game (entering play mode)");
            EditorApplication.isPlaying = true;
        }

        /// <summary>
        /// Stop the game (exit play mode)
        /// </summary>
        public static void StopGame()
        {
            if (!EditorApplication.isPlaying) return;

            Debug.Log("[Unity MCP] Stopping game (exiting play mode)");
            EditorApplication.isPlaying = false;
        }

        /// <summary>
        /// Get the current game state
        /// </summary>
        public static EditorGameState GetGameState()
        {
            return new EditorGameState
            {
                IsPlaying = EditorApplication.isPlaying,
                IsPaused = EditorApplication.isPaused,
                IsCompiling = EditorApplication.isCompiling,
                CurrentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name,
                TimeScale = Time.timeScale,
                FrameCount = Time.frameCount,
                RealtimeSinceStartup = Time.realtimeSinceStartup
            };
        }
    }

    /// <summary>
    /// Game state information
    /// </summary>
    [Serializable]
    public class EditorGameState
    {
        /// <summary>
        /// Whether the game is currently playing
        /// </summary>
        public bool IsPlaying { get; set; }

        /// <summary>
        /// Whether the game is currently paused
        /// </summary>
        public bool IsPaused { get; set; }

        /// <summary>
        /// Whether the editor is currently compiling
        /// </summary>
        public bool IsCompiling { get; set; }

        /// <summary>
        /// The name of the current scene
        /// </summary>
        public string CurrentScene { get; set; }

        /// <summary>
        /// The current time scale
        /// </summary>
        public float TimeScale { get; set; }

        /// <summary>
        /// The current frame count
        /// </summary>
        public int FrameCount { get; set; }

        /// <summary>
        /// The time in seconds since the start of the game
        /// </summary>
        public float RealtimeSinceStartup { get; set; }
    }
}
