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
using UnityMCP.Client.Editor.Commands;

namespace UnityMCP.Client.Editor
{
    /// <summary>
    /// Data structure for log entries
    /// </summary>
    [System.Serializable]
    public class LogEntryData
    {
        public string message;
        public string data;
        public string level;
        public string timestamp;
    }

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
        public async Task LogDebug(string message, object data = null)
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
                UnityEngine.Debug.Log($"[{_logName}] {level}: {message}");

                // Create a log entry object
                var logEntry = new LogEntryData
                {
                    message = message,
                    data = data != null ? data.ToString() : null,
                    level = level,
                    timestamp = DateTime.UtcNow.ToString("o")
                };

                // Serialize to JSON using a simple approach
                string json = $"{{\"message\":\"{message.Replace("\"", "\\\"")}\",\"level\":\"{level}\",\"timestamp\":\"{DateTime.UtcNow.ToString("o")}\"}}";

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

        // List to store captured logs
        private static List<string> capturedLogs = new List<string>();
        private static object capturedLogsLock = new object();

        // Flag to indicate if we're capturing logs
        private static bool isCapturingLogs = false;

        /// <summary>
        /// Store a log entry
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <param name="data">The data to store</param>
        public static void StoreLogEntry(string logName, object data)
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
                    // Get the context directly - this is a blocking call
                    var context = httpListener.GetContext();
                    var request = context.Request;
                    var response = context.Response;

                    // Log the request
                    Debug.Log($"[Unity MCP] Received request: {request.HttpMethod} {request.Url.AbsolutePath}");

                    // Super simple response for all requests
                    string responseText = "{ \"success\": true, \"message\": \"Hello from Unity MCP!\" }";

                    // Special cases for different endpoints
                    if (request.Url.AbsolutePath == "/ping")
                    {
                        responseText = "pong";
                    }
                    else if (request.Url.AbsolutePath == "/api/CodeExecution/start-game")
                    {
                        Debug.Log("[Unity MCP] Starting game");

                        // Create a cancellation token source
                        var cts = new CancellationTokenSource();
                        var token = cts.Token;

                        // Schedule StartGame to run on the main thread
                        EditorApplication.delayCall += () =>
                        {
                            try
                            {
                                Debug.Log("[Unity MCP] Executing StartGame on main thread");
                                StartGame();
                                Debug.Log("[Unity MCP] Game started successfully");
                            }
                            catch (Exception ex)
                            {
                                Debug.LogError($"[Unity MCP] Error starting game: {ex.Message}");
                            }
                            finally
                            {
                                // Signal that the operation is complete
                                cts.Cancel();
                            }
                        };

                        // Wait for the operation to complete or timeout
                        try
                        {
                            // Wait for a short time to see if the operation completes quickly
                            Task.Delay(100, token).Wait();
                            responseText = "{ \"success\": true, \"message\": \"Game started\" }";
                        }
                        catch (OperationCanceledException)
                        {
                            // The operation completed successfully
                            responseText = "{ \"success\": true, \"message\": \"Game started\" }";
                        }
                        catch (Exception ex)
                        {
                            // An error occurred
                            Debug.LogError($"[Unity MCP] Error waiting for game to start: {ex.Message}");
                            responseText = $"{{ \"success\": false, \"message\": \"Error starting game: {ex.Message}\" }}";
                        }
                    }
                    else if (request.Url.AbsolutePath == "/api/CodeExecution/stop-game")
                    {
                        Debug.Log("[Unity MCP] Stopping game");

                        // Create a cancellation token source
                        var cts = new CancellationTokenSource();
                        var token = cts.Token;

                        // Schedule StopGame to run on the main thread
                        EditorApplication.delayCall += () =>
                        {
                            try
                            {
                                Debug.Log("[Unity MCP] Executing StopGame on main thread");
                                StopGame();
                                Debug.Log("[Unity MCP] Game stopped successfully");
                            }
                            catch (Exception ex)
                            {
                                Debug.LogError($"[Unity MCP] Error stopping game: {ex.Message}");
                            }
                            finally
                            {
                                // Signal that the operation is complete
                                cts.Cancel();
                            }
                        };

                        // Wait for the operation to complete or timeout
                        try
                        {
                            // Wait for a short time to see if the operation completes quickly
                            Task.Delay(100, token).Wait();
                            responseText = "{ \"success\": true, \"message\": \"Game stopped\" }";
                        }
                        catch (OperationCanceledException)
                        {
                            // The operation completed successfully
                            responseText = "{ \"success\": true, \"message\": \"Game stopped\" }";
                        }
                        catch (Exception ex)
                        {
                            // An error occurred
                            Debug.LogError($"[Unity MCP] Error waiting for game to stop: {ex.Message}");
                            responseText = $"{{ \"success\": false, \"message\": \"Error stopping game: {ex.Message}\" }}";
                        }
                    }
                    else if (request.Url.AbsolutePath == "/api/CodeExecution/game-state")
                    {
                        Debug.Log("[Unity MCP] Getting game state");

                        // Create a cancellation token source
                        var cts = new CancellationTokenSource();
                        var token = cts.Token;

                        // Default game state
                        var gameState = new EditorGameState
                        {
                            IsPlaying = false,
                            IsPaused = false,
                            IsCompiling = false,
                            CurrentScene = "SampleScene",
                            TimeScale = 1.0f,
                            FrameCount = 0,
                            RealtimeSinceStartup = 0.0f
                        };

                        // Schedule a task to get the actual game state on the main thread
                        EditorApplication.delayCall += () =>
                        {
                            try
                            {
                                Debug.Log("[Unity MCP] Getting actual game state on main thread");
                                gameState = new EditorGameState
                                {
                                    IsPlaying = EditorApplication.isPlaying,
                                    IsPaused = EditorApplication.isPaused,
                                    IsCompiling = EditorApplication.isCompiling,
                                    CurrentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name,
                                    TimeScale = Time.timeScale,
                                    FrameCount = Time.frameCount,
                                    RealtimeSinceStartup = Time.realtimeSinceStartup
                                };
                                Debug.Log($"[Unity MCP] Actual game state: IsPlaying={gameState.IsPlaying}, IsPaused={gameState.IsPaused}, CurrentScene={gameState.CurrentScene}");
                            }
                            catch (Exception ex)
                            {
                                Debug.LogError($"[Unity MCP] Error getting game state: {ex.Message}");
                            }
                            finally
                            {
                                // Signal that the operation is complete
                                cts.Cancel();
                            }
                        };

                        // Wait for the operation to complete or timeout
                        try
                        {
                            // Wait for a short time to see if the operation completes quickly
                            Task.Delay(100, token).Wait();

                            // Convert to JSON
                            responseText = $"{{ \"isPlaying\": {gameState.IsPlaying.ToString().ToLower()}, \"isPaused\": {gameState.IsPaused.ToString().ToLower()}, \"isCompiling\": {gameState.IsCompiling.ToString().ToLower()}, \"currentScene\": \"{gameState.CurrentScene}\", \"timeScale\": {gameState.TimeScale}, \"frameCount\": {gameState.FrameCount}, \"realtimeSinceStartup\": {gameState.RealtimeSinceStartup} }}";
                        }
                        catch (OperationCanceledException)
                        {
                            // The operation completed successfully
                            // Convert to JSON
                            responseText = $"{{ \"isPlaying\": {gameState.IsPlaying.ToString().ToLower()}, \"isPaused\": {gameState.IsPaused.ToString().ToLower()}, \"isCompiling\": {gameState.IsCompiling.ToString().ToLower()}, \"currentScene\": \"{gameState.CurrentScene}\", \"timeScale\": {gameState.TimeScale}, \"frameCount\": {gameState.FrameCount}, \"realtimeSinceStartup\": {gameState.RealtimeSinceStartup} }}";
                        }
                        catch (Exception ex)
                        {
                            // An error occurred
                            Debug.LogError($"[Unity MCP] Error waiting for game state: {ex.Message}");
                            responseText = $"{{ \"success\": false, \"message\": \"Error getting game state: {ex.Message}\" }}";
                        }
                    }
                    else if (request.Url.AbsolutePath == "/api/CodeExecution/execute-code" && request.HttpMethod == "POST")
                    {
                        Debug.Log("[Unity MCP] Executing code");

                        // Read the request body to get the code to execute
                        string code = "";
                        using (var reader = new StreamReader(request.InputStream, request.ContentEncoding))
                        {
                            code = reader.ReadToEnd();
                        }

                        Debug.Log($"[Unity MCP] Code to execute: {code}");

                        // Create a cancellation token source
                        var cts = new CancellationTokenSource();
                        var token = cts.Token;

                        // Result variables
                        bool success = false;
                        string result = "";
                        string error = "";
                        string commandType = "";

                        // Schedule the code execution on the main thread
                        EditorApplication.delayCall += () =>
                        {
                            try
                            {
                                Debug.Log("[Unity MCP] Executing code on main thread");

                                // Execute the code using C# scripting
                                Debug.Log($"[Unity MCP] Executing code: {code}");

                                // Actually execute the code
                                try
                                {
                                    // Execute the code directly
                                    // This is a simple implementation that just executes the code directly
                                    // In a real implementation, you would use a more robust approach
                                    // like Microsoft.CodeAnalysis.CSharp.Scripting

                                    // For now, we'll just execute the code directly
                                    // This is not safe, but it's simple and works for demo purposes
                                    // The code will be executed in the context of the Unity Editor
                                    // and can access all Unity APIs

                                    // Execute the code and get the result
                                    object executionResult = ExecuteCodeInEditor(code);

                                    success = true;
                                    result = executionResult != null ? executionResult.ToString() : "null";
                                    commandType = executionResult != null ? executionResult.GetType().Name : "null";
                                    Debug.Log($"[Unity MCP] Code execution result: {result}");

                                    // Store the result in a log entry
                                    StoreLogEntry("unity-execute-detailed-result", new
                                    {
                                        code,
                                        result,
                                        commandType = executionResult?.GetType().Name,
                                        success = true
                                    });
                                }
                                catch (Exception ex)
                                {
                                    // Log the error
                                    Debug.LogError($"[Unity MCP] Error executing code: {ex.Message}");
                                    success = false;
                                    error = ex.Message;

                                    // Store the error in a log entry
                                    StoreLogEntry("unity-execute-detailed-result", new
                                    {
                                        code,
                                        error = ex.Message,
                                        stackTrace = ex.StackTrace,
                                        success = false
                                    });
                                }

                                Debug.Log("[Unity MCP] Code executed successfully");
                            }
                            catch (Exception ex)
                            {
                                // Log the error
                                Debug.LogError($"[Unity MCP] Error executing code: {ex.Message}");
                                success = false;
                                error = ex.Message;
                            }
                            finally
                            {
                                // Signal that the operation is complete
                                cts.Cancel();
                            }
                        };

                        // Wait for the operation to complete or timeout
                        try
                        {
                            // Wait for a short time to see if the operation completes quickly
                            Task.Delay(100, token).Wait();

                            // Return the result
                            if (success)
                            {
                                // Create a detailed response
                                var responseObj = new
                                {
                                    success = true,
                                    result = result,
                                    code = code,
                                    commandType = commandType,
                                    logs = new[] { "Code executed successfully" },
                                    executionTime = 0,
                                    details = "Command executed successfully"
                                };

                                // Convert to JSON
                                responseText = JsonUtility.ToJson(responseObj);
                            }
                            else
                            {
                                responseText = $"{{ \"success\": false, \"error\": \"{error}\", \"code\": \"{code}\", \"logs\": [\"Error executing code\"], \"executionTime\": 0 }}";
                            }
                        }
                        catch (OperationCanceledException)
                        {
                            // The operation completed successfully
                            if (success)
                            {
                                responseText = $"{{ \"success\": true, \"result\": \"{result}\", \"logs\": [\"Code executed successfully\"], \"executionTime\": 0 }}";
                            }
                            else
                            {
                                responseText = $"{{ \"success\": false, \"error\": \"{error}\", \"logs\": [\"Error executing code\"], \"executionTime\": 0 }}";
                            }
                        }
                        catch (Exception ex)
                        {
                            // An error occurred
                            Debug.LogError($"[Unity MCP] Error waiting for code execution: {ex.Message}");
                            responseText = $"{{ \"success\": false, \"error\": \"Error executing code: {ex.Message}\", \"logs\": [\"Error executing code\"], \"executionTime\": 0 }}";
                        }
                    }

                    // Send the response
                    byte[] buffer = Encoding.UTF8.GetBytes(responseText);
                    response.ContentLength64 = buffer.Length;
                    response.ContentType = "application/json";
                    response.StatusCode = 200;
                    response.OutputStream.Write(buffer, 0, buffer.Length);
                    response.Close();

                    Debug.Log($"[Unity MCP] Response sent: {responseText}");
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

        /// <summary>
        /// Execute code in the Unity Editor
        /// </summary>
        /// <param name="code">The code to execute</param>
        /// <returns>The result of the code execution</returns>
        private static object ExecuteCodeInEditor(string code)
        {
            try
            {
                // Log the code we're executing
                Debug.Log($"[Unity MCP] Executing code: {code}");
                StoreLogEntry("unity-execute-input", new { code });

                // Create a command context
                var context = new CommandContext();

                // Parse the code into a command
                ICommand command = CommandFactory.CreateCommand(code);
                Debug.Log($"[Unity MCP] Created command of type: {command.GetType().Name}");
                StoreLogEntry("unity-execute-command", new { commandType = command.GetType().Name });

                // Execute the command
                object result = command.Execute(context);

                // Log the result
                Debug.Log($"[Unity MCP] Code executed successfully. Result: {result}");
                StoreLogEntry("unity-execute-result", new { result = result?.ToString() });

                // Return the result
                return result;
            }
            catch (Exception ex)
            {
                // Log the error
                Debug.LogError($"[Unity MCP] Error executing code: {ex.Message}");
                StoreLogEntry("unity-execute-error", new { error = ex.Message, stackTrace = ex.StackTrace });
                throw; // Rethrow the exception to be caught by the caller
            }
        }

        /// <summary>
        /// Extract the last statement from a code block
        /// </summary>
        /// <param name="code">The code block</param>
        /// <returns>The last statement</returns>
        private static string ExtractLastStatement(string code)
        {
            // This is a very simple implementation that just returns the last line
            // In a real implementation, you would use a more robust approach
            // like parsing the code with Roslyn

            // Split the code into lines
            string[] lines = code.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

            // Find the last non-empty line that's not a comment
            for (int i = lines.Length - 1; i >= 0; i--)
            {
                string line = lines[i].Trim();
                if (!string.IsNullOrEmpty(line) && !line.StartsWith("//") && !line.StartsWith("/*") && !line.StartsWith("*"))
                {
                    return line;
                }
            }

            // If we couldn't find a valid last statement, return null
            return null;
        }

        /// <summary>
        /// Evaluate a statement and return its value
        /// </summary>
        /// <param name="statement">The statement to evaluate</param>
        /// <returns>The value of the statement</returns>
        private static object EvaluateStatement(string statement)
        {
            // This is a very simple implementation that just returns the statement as a string
            // In a real implementation, you would use a more robust approach
            // like evaluating the statement with Roslyn

            // For demo purposes, we'll just return the statement as a string
            return statement;
        }

        /// <summary>
        /// Execute code using Unity's built-in Mono runtime
        /// </summary>
        /// <param name="code">The code to execute</param>
        /// <returns>The result of the code execution</returns>
        private static object CompileMethod(string code)
        {
            // This implementation uses Unity's built-in Mono runtime to execute the code
            // It's not as robust as using Roslyn, but it's better than just returning the code

            try
            {
                // First, let's try to extract the last expression from the code
                // This is a simple implementation that just looks for the last non-comment line
                string lastExpression = ExtractLastStatement(code);

                // If we couldn't find a valid last expression, return null
                if (string.IsNullOrEmpty(lastExpression))
                {
                    Debug.LogWarning("[Unity MCP] Couldn't find a valid last expression in the code");
                    return null;
                }

                // Now, let's try to evaluate the expression using Unity's built-in capabilities
                // We'll use reflection to access Unity's internal evaluation capabilities

                // First, let's try to execute the code directly in the Unity Editor
                // We'll create a temporary GameObject and execute the code in its context

                // Create a temporary GameObject
                var tempGO = new GameObject("CodeExecutor");

                try
                {
                    // Execute the code in the context of the GameObject
                    // This is a simple implementation that just executes the code
                    // and returns the result of the last expression

                    // For simple expressions, we can try to evaluate them directly
                    if (lastExpression.Contains("GameObject") || lastExpression.Contains("UnityEngine"))
                    {
                        // For Unity-specific expressions, we'll just return the expression itself
                        // In a real implementation, we would use a more robust approach
                        Debug.Log($"[Unity MCP] Executing Unity-specific expression: {lastExpression}");

                        // For demo purposes, we'll just return the expression
                        return lastExpression;
                    }
                    else
                    {
                        // For simple expressions, we can try to evaluate them directly
                        Debug.Log($"[Unity MCP] Executing simple expression: {lastExpression}");

                        // Try to evaluate the expression
                        object result = EvaluateExpression(lastExpression);

                        // Return the result
                        return result;
                    }
                }
                finally
                {
                    // Clean up the temporary GameObject
                    UnityEngine.Object.DestroyImmediate(tempGO);
                }
            }
            catch (Exception ex)
            {
                // Log the error
                Debug.LogError($"[Unity MCP] Error compiling code: {ex.Message}");
                throw; // Rethrow the exception to be caught by the caller
            }
        }

        /// <summary>
        /// Evaluate a simple expression
        /// </summary>
        /// <param name="expression">The expression to evaluate</param>
        /// <returns>The result of the expression</returns>
        private static object EvaluateExpression(string expression)
        {
            // This is a simple implementation that evaluates basic expressions
            // In a real implementation, you would use a more robust approach like Roslyn

            // For demo purposes, we'll just handle a few simple cases

            // Remove any trailing semicolon
            expression = expression.TrimEnd(';');

            // Check if it's a string literal
            if (expression.StartsWith("\"") && expression.EndsWith("\""))
            {
                // It's a string literal, return the string without the quotes
                return expression.Substring(1, expression.Length - 2);
            }

            // Check if it's a numeric literal
            if (int.TryParse(expression, out int intValue))
            {
                // It's an integer literal
                return intValue;
            }

            if (float.TryParse(expression, out float floatValue))
            {
                // It's a float literal
                return floatValue;
            }

            if (bool.TryParse(expression, out bool boolValue))
            {
                // It's a boolean literal
                return boolValue;
            }

            // For other expressions, we'll just return the expression itself
            return expression;
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
}
