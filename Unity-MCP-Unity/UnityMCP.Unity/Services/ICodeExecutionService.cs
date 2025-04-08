using System.Threading.Tasks;
using UnityMCP.Unity.Models;

namespace UnityMCP.Unity.Services
{
    /// <summary>
    /// Interface for code execution service
    /// </summary>
    public interface ICodeExecutionService
    {
        /// <summary>
        /// Execute code in the Unity environment
        /// </summary>
        /// <param name="code">The code to execute</param>
        /// <returns>The result of the execution</returns>
        Task<CodeExecutionResult> ExecuteCodeAsync(string code);

        /// <summary>
        /// Query the Unity environment
        /// </summary>
        /// <param name="query">The query to execute</param>
        /// <returns>The result of the query</returns>
        Task<CodeExecutionResult> QueryAsync(string query);

        /// <summary>
        /// Check if the service is available
        /// </summary>
        /// <returns>True if the service is available, false otherwise</returns>
        Task<bool> IsAvailableAsync();

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
