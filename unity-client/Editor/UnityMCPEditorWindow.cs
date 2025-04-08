using UnityEditor;
using UnityEngine;
using System;
using System.Net;
using System.Net.Http;

namespace UnityMCP.Client.Editor
{
    /// <summary>
    /// Editor window for controlling the Unity MCP integration
    /// </summary>
    public class UnityMCPEditorWindow : EditorWindow
    {
        private bool autoStartServer = true;
        private bool serverStarted = false;
        private Vector2 scrollPosition;
        private string[] logMessages = new string[0];

        /// <summary>
        /// Show the Unity MCP Editor Window
        /// </summary>
        [MenuItem("Window/Unity MCP/Control Panel")]
        public static void ShowWindow()
        {
            GetWindow<UnityMCPEditorWindow>("Unity MCP");
        }

        /// <summary>
        /// Called when the window is enabled
        /// </summary>
        private void OnEnable()
        {
            // Load settings
            autoStartServer = EditorPrefs.GetBool("UnityMCP_AutoStartServer", true);

            // Check if server is already running by pinging it
            CheckServerStatus();

            // Register for editor update to refresh the UI
            EditorApplication.update += OnEditorUpdate;
        }

        /// <summary>
        /// Check if the server is running
        /// </summary>
        private void CheckServerStatus()
        {
            // Try to ping the server
            try
            {
                // Create a web request to the server's ping endpoint
                var request = WebRequest.Create("http://localhost:8081/ping");
                request.Method = "GET";
                request.Timeout = 1000; // 1 second timeout

                // Get the response
                using (var response = (HttpWebResponse)request.GetResponse())
                {
                    // If we get a 200 OK response, the server is running
                    serverStarted = (response.StatusCode == HttpStatusCode.OK);
                }
            }
            catch
            {
                // If we get an exception, the server is not running
                serverStarted = false;
            }
        }

        /// <summary>
        /// Called when the window is disabled
        /// </summary>
        private void OnDisable()
        {
            // Unregister from editor update
            EditorApplication.update -= OnEditorUpdate;
        }

        /// <summary>
        /// Called when the editor updates
        /// </summary>
        private float lastCheckTime = 0f;
        private void OnEditorUpdate()
        {
            // Check the server status every 5 seconds
            if (Time.realtimeSinceStartup - lastCheckTime > 5f)
            {
                CheckServerStatus();
                lastCheckTime = Time.realtimeSinceStartup;
            }

            // Repaint the window to update the UI
            Repaint();
        }

        /// <summary>
        /// Draw the GUI
        /// </summary>
        private void OnGUI()
        {
            // Server status section
            EditorGUILayout.LabelField("Unity MCP Server", EditorStyles.boldLabel);

            EditorGUILayout.Space();

            if (serverStarted)
            {
                EditorGUILayout.HelpBox("Unity MCP Server is running", MessageType.Info);

                if (GUILayout.Button("Stop Server"))
                {
                    UnityMCPEditorExtension.StopServer();
                    serverStarted = false;
                }
            }
            else
            {
                EditorGUILayout.HelpBox("Unity MCP Server is not running", MessageType.Warning);

                if (GUILayout.Button("Start Server"))
                {
                    UnityMCPEditorExtension.StartServer();
                    serverStarted = true;
                }
            }

            EditorGUILayout.Space();

            // Auto-start setting
            bool newAutoStartServer = EditorGUILayout.Toggle("Auto-start server on editor launch", autoStartServer);
            if (newAutoStartServer != autoStartServer)
            {
                autoStartServer = newAutoStartServer;
                EditorPrefs.SetBool("UnityMCP_AutoStartServer", autoStartServer);
            }

            EditorGUILayout.Space();
            EditorGUILayout.Separator();

            // Game control section
            EditorGUILayout.LabelField("Game Control", EditorStyles.boldLabel);

            EditorGUILayout.Space();

            // Display current game state
            var gameState = UnityMCPEditorExtension.GetGameState();
            EditorGUILayout.LabelField("Current State:", gameState.IsPlaying ? "Playing" : "Stopped");
            EditorGUILayout.LabelField("Current Scene:", gameState.CurrentScene);

            EditorGUILayout.Space();

            // Game control buttons
            using (new EditorGUILayout.HorizontalScope())
            {
                GUI.enabled = !EditorApplication.isPlaying;
                if (GUILayout.Button("Start Game"))
                {
                    UnityMCPEditorExtension.StartGame();
                }
                GUI.enabled = true;

                GUI.enabled = EditorApplication.isPlaying;
                if (GUILayout.Button("Stop Game"))
                {
                    UnityMCPEditorExtension.StopGame();
                }
                GUI.enabled = true;

                GUI.enabled = EditorApplication.isPlaying;
                if (GUILayout.Button(EditorApplication.isPaused ? "Resume Game" : "Pause Game"))
                {
                    EditorApplication.isPaused = !EditorApplication.isPaused;
                }
                GUI.enabled = true;
            }

            EditorGUILayout.Space();
            EditorGUILayout.Separator();

            // Log section
            EditorGUILayout.LabelField("Logs", EditorStyles.boldLabel);

            EditorGUILayout.Space();

            // Log messages
            scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition, GUILayout.Height(150));
            foreach (var message in logMessages)
            {
                EditorGUILayout.LabelField(message);
            }
            EditorGUILayout.EndScrollView();

            EditorGUILayout.Space();

            // Clear logs button
            if (GUILayout.Button("Clear Logs"))
            {
                logMessages = new string[0];
            }
        }

        /// <summary>
        /// Add a log message
        /// </summary>
        public void AddLogMessage(string message)
        {
            // Add the message to the log
            var newLogMessages = new string[logMessages.Length + 1];
            System.Array.Copy(logMessages, newLogMessages, logMessages.Length);
            newLogMessages[logMessages.Length] = $"[{System.DateTime.Now.ToString("HH:mm:ss")}] {message}";
            logMessages = newLogMessages;

            // Repaint the window to update the UI
            Repaint();
        }
    }
}
