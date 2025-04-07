using Newtonsoft.Json;

namespace UnityMCP.Client.Models
{
    /// <summary>
    /// Log entry
    /// </summary>
    public class LogEntry
    {
        /// <summary>
        /// Unique ID for the log entry
        /// </summary>
        [JsonProperty("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Log message
        /// </summary>
        [JsonProperty("message")]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Log level
        /// </summary>
        [JsonProperty("level")]
        public LogSeverity Level { get; set; }

        /// <summary>
        /// Timestamp
        /// </summary>
        [JsonProperty("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Optional operation ID
        /// </summary>
        [JsonProperty("operationId")]
        public string? OperationId { get; set; }

        /// <summary>
        /// Optional stack trace
        /// </summary>
        [JsonProperty("stackTrace")]
        public string? StackTrace { get; set; }
    }
}
