using UnityMCP.Client.Models;
using UnityMCP.Client.Editor;

namespace UnityMCP.Client.Services
{
    /// <summary>
    /// Interface for executing C# code
    /// </summary>
    public interface ICodeExecutionService
    {
        /// <summary>
        /// Execute C# code
        /// </summary>
        /// <param name="code">The C# code to execute</param>
        /// <param name="timeout">Optional timeout in milliseconds</param>
        /// <returns>The execution result</returns>
        Task<CodeExecutionResult> ExecuteCodeAsync(string code, int timeout = 1000);

        /// <summary>
        /// Execute a query in Unity
        /// </summary>
        /// <param name="query">The query to execute</param>
        /// <param name="timeout">Optional timeout in milliseconds</param>
        /// <returns>The execution result</returns>
        Task<CodeExecutionResult> QueryAsync(string query, int timeout = 1000);

        /// <summary>
        /// Check if the code execution service is available
        /// </summary>
        /// <returns>True if the service is available, false otherwise</returns>
        Task<bool> IsAvailableAsync();

        /// <summary>
        /// Get information about the execution environment
        /// </summary>
        /// <returns>Environment information</returns>
        Task<EnvironmentInfo> GetEnvironmentInfoAsync();

        /// <summary>
        /// Get the current game state
        /// </summary>
        /// <returns>The current game state</returns>
        Task<GameState> GetGameStateAsync();

        /// <summary>
        /// Start the game (enter play mode)
        /// </summary>
        /// <returns>Success or failure result</returns>
        Task<CodeExecutionResult> StartGameAsync();

        /// <summary>
        /// Stop the game (exit play mode)
        /// </summary>
        /// <returns>Success or failure result</returns>
        Task<CodeExecutionResult> StopGameAsync();
    }
}
