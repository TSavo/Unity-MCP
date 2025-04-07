using UnityMCP.Client.Models;

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
        /// Check if the code execution service is available
        /// </summary>
        /// <returns>True if the service is available, false otherwise</returns>
        Task<bool> IsAvailableAsync();
        
        /// <summary>
        /// Get information about the execution environment
        /// </summary>
        /// <returns>Environment information</returns>
        Task<EnvironmentInfo> GetEnvironmentInfoAsync();
    }
}
