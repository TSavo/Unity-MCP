using UnityEditor;
using UnityEngine;

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
            
            // Check if server is already running
            // In a real implementation, you would check the actual server status
            serverStarted = false;
            
            // Register for editor update to refresh the UI
            EditorApplication.update += OnEditorUpdate;
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
        private void OnEditorUpdate()
        {
            // Check if the server status has changed
            // In a real implementation, you would check the actual server status
            
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
