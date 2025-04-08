using UnityEditor;
using UnityEngine;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace UnityMCP.Client.Editor
{
    /// <summary>
    /// Editor extension for Unity MCP integration
    /// </summary>
    [InitializeOnLoad]
    public class UnityMCPEditorExtension
    {
        private static bool isInitialized = false;
        private static bool autoStartServer = true;
        private static bool serverStarted = false;
        private static System.Diagnostics.Process serverProcess;

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
                // Start the server process
                // Note: In a real implementation, you would start the actual server process here
                // For now, we'll just set the flag
                serverStarted = true;
                
                Debug.Log("[Unity MCP] Unity MCP server started");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Unity MCP] Error starting Unity MCP server: {ex.Message}");
            }
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
                // Stop the server process
                // Note: In a real implementation, you would stop the actual server process here
                // For now, we'll just set the flag
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
        public static GameState GetGameState()
        {
            return new GameState
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
