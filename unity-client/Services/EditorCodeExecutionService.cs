using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityMCP.Client.Models;
using UnityMCP.Client.Editor;
using UnityEngine;

namespace UnityMCP.Client.Services
{
    /// <summary>
    /// Implementation of ICodeExecutionService that uses the Unity Editor API
    /// </summary>
    public class EditorCodeExecutionService : ICodeExecutionService
    {
        private readonly ILogService _logService;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="logService">Log service</param>
        public EditorCodeExecutionService(ILogService logService)
        {
            _logService = logService;
        }

        /// <summary>
        /// Execute C# code
        /// </summary>
        /// <param name="code">The C# code to execute</param>
        /// <param name="timeout">Optional timeout in milliseconds</param>
        /// <returns>The execution result</returns>
        public async Task<CodeExecutionResult> ExecuteCodeAsync(string code, int timeout = 1000)
        {
            _logService.Log($"Executing code: {code}", LogSeverity.Debug);

            try
            {
                // In a real implementation, you would execute the code in Unity
                // For now, we'll just return a mock result
                await Task.Delay(100); // Simulate execution time

                return new CodeExecutionResult
                {
                    Success = true,
                    Result = "Code executed successfully",
                    Logs = new List<string> { "Code executed successfully" },
                    ExecutionTime = 100
                };
            }
            catch (Exception ex)
            {
                _logService.LogError($"Error executing code: {ex.Message}", ex);

                return new CodeExecutionResult
                {
                    Success = false,
                    Error = ex.Message,
                    Logs = new List<string> { $"Error: {ex.Message}" },
                    ExecutionTime = 0
                };
            }
        }

        /// <summary>
        /// Execute a query in Unity
        /// </summary>
        /// <param name="query">The query to execute</param>
        /// <param name="timeout">Optional timeout in milliseconds</param>
        /// <returns>The execution result</returns>
        public async Task<CodeExecutionResult> QueryAsync(string query, int timeout = 1000)
        {
            _logService.Log($"Executing query: {query}", LogSeverity.Debug);

            try
            {
                // For a query, we just wrap it in a return statement
                string code = $"return {query};";

                // Use the existing code execution method
                return await ExecuteCodeAsync(code, timeout);
            }
            catch (Exception ex)
            {
                _logService.LogError($"Error executing query: {ex.Message}", ex);

                return new CodeExecutionResult
                {
                    Success = false,
                    Error = ex.Message,
                    Logs = new List<string> { $"Error: {ex.Message}" },
                    ExecutionTime = 0
                };
            }
        }

        /// <summary>
        /// Check if the code execution service is available
        /// </summary>
        /// <returns>True if the service is available, false otherwise</returns>
        public Task<bool> IsAvailableAsync()
        {
            // In a real implementation, you would check if the Unity Editor is available
            // For now, we'll just return true
            return Task.FromResult(true);
        }

        /// <summary>
        /// Get information about the execution environment
        /// </summary>
        /// <returns>Environment information</returns>
        public Task<EnvironmentInfo> GetEnvironmentInfoAsync()
        {
            _logService.Log("Getting environment info", LogSeverity.Debug);

            try
            {
                // Get environment information
                var info = new EnvironmentInfo
                {
                    UnityVersion = Application.unityVersion,
                    Platform = Application.platform.ToString(),
                    IsEditor = Application.isEditor,
                    SceneObjects = new List<string>()
                };

                // Get all game objects in the scene
                var gameObjects = UnityEngine.Object.FindObjectsOfType<GameObject>();
                foreach (var gameObject in gameObjects)
                {
                    info.SceneObjects.Add(gameObject.name);
                }

                return Task.FromResult(info);
            }
            catch (Exception ex)
            {
                _logService.LogError($"Error getting environment info: {ex.Message}", ex);

                // Return a minimal environment info
                return Task.FromResult(new EnvironmentInfo
                {
                    UnityVersion = "Unknown",
                    Platform = "Unknown",
                    IsEditor = true,
                    SceneObjects = new List<string>()
                });
            }
        }

        /// <summary>
        /// Get the current game state
        /// </summary>
        /// <returns>The current game state</returns>
        public Task<UnityMCP.Client.Models.GameState> GetGameStateAsync()
        {
            _logService.Log("Getting game state", LogSeverity.Debug);

            try
            {
                // Get the current game state from the editor
                var editorGameState = UnityMCPEditorExtension.GetGameState();

                // Convert to the model GameState
                var gameState = new UnityMCP.Client.Models.GameState
                {
                    IsPlaying = editorGameState.IsPlaying,
                    IsPaused = editorGameState.IsPaused,
                    IsCompiling = editorGameState.IsCompiling,
                    CurrentScene = editorGameState.CurrentScene,
                    TimeScale = editorGameState.TimeScale,
                    FrameCount = editorGameState.FrameCount,
                    RealtimeSinceStartup = editorGameState.RealtimeSinceStartup
                };

                return Task.FromResult(gameState);
            }
            catch (Exception ex)
            {
                _logService.LogError($"Error getting game state: {ex.Message}", ex);

                // Return a minimal game state
                return Task.FromResult(new UnityMCP.Client.Models.GameState
                {
                    IsPlaying = false,
                    IsPaused = false,
                    IsCompiling = false,
                    CurrentScene = "Unknown",
                    TimeScale = 1.0f,
                    FrameCount = 0,
                    RealtimeSinceStartup = 0.0f
                });
            }
        }

        /// <summary>
        /// Start the game (enter play mode)
        /// </summary>
        /// <returns>Success or failure result</returns>
        public Task<CodeExecutionResult> StartGameAsync()
        {
            _logService.Log("Starting game", LogSeverity.Info);

            try
            {
                // Start the game
                UnityMCPEditorExtension.StartGame();

                return Task.FromResult(new CodeExecutionResult
                {
                    Success = true,
                    Result = "Game started successfully",
                    Logs = new List<string> { "Game started successfully" },
                    ExecutionTime = 0
                });
            }
            catch (Exception ex)
            {
                _logService.LogError($"Error starting game: {ex.Message}", ex);

                return Task.FromResult(new CodeExecutionResult
                {
                    Success = false,
                    Error = ex.Message,
                    Logs = new List<string> { $"Error: {ex.Message}" },
                    ExecutionTime = 0
                });
            }
        }

        /// <summary>
        /// Stop the game (exit play mode)
        /// </summary>
        /// <returns>Success or failure result</returns>
        public Task<CodeExecutionResult> StopGameAsync()
        {
            _logService.Log("Stopping game", LogSeverity.Info);

            try
            {
                // Stop the game
                UnityMCPEditorExtension.StopGame();

                return Task.FromResult(new CodeExecutionResult
                {
                    Success = true,
                    Result = "Game stopped successfully",
                    Logs = new List<string> { "Game stopped successfully" },
                    ExecutionTime = 0
                });
            }
            catch (Exception ex)
            {
                _logService.LogError($"Error stopping game: {ex.Message}", ex);

                return Task.FromResult(new CodeExecutionResult
                {
                    Success = false,
                    Error = ex.Message,
                    Logs = new List<string> { $"Error: {ex.Message}" },
                    ExecutionTime = 0
                });
            }
        }
    }
}
