using System.Collections.Generic;

namespace UnityMCP.Unity.Models
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
}
