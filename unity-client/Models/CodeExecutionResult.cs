using Newtonsoft.Json;

namespace UnityMCP.Client.Models
{
    /// <summary>
    /// Result of a code execution
    /// </summary>
    public class CodeExecutionResult
    {
        /// <summary>
        /// Whether the execution was successful
        /// </summary>
        [JsonProperty("success")]
        public bool Success { get; set; }
        
        /// <summary>
        /// The result value (if any)
        /// </summary>
        [JsonProperty("result")]
        public object? Result { get; set; }
        
        /// <summary>
        /// Any error that occurred during execution
        /// </summary>
        [JsonProperty("error")]
        public string? Error { get; set; }
        
        /// <summary>
        /// Execution logs/output
        /// </summary>
        [JsonProperty("logs")]
        public List<string> Logs { get; set; } = new List<string>();
        
        /// <summary>
        /// Execution time in milliseconds
        /// </summary>
        [JsonProperty("executionTime")]
        public long ExecutionTime { get; set; }
    }
}
