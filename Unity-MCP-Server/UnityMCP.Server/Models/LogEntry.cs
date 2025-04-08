using System;

namespace UnityMCP.Server.Models
{
    /// <summary>
    /// A log entry
    /// </summary>
    public class LogEntry
    {
        /// <summary>
        /// The unique identifier for this log entry
        /// </summary>
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// The name of the log
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// The log data
        /// </summary>
        public object? Data { get; set; }

        /// <summary>
        /// The timestamp when this log entry was created
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
