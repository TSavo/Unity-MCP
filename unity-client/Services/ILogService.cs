using UnityMCP.Client.Models;

namespace UnityMCP.Client.Services
{
    /// <summary>
    /// Interface for logging service
    /// </summary>
    public interface ILogService
    {
        /// <summary>
        /// Log a message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="logLevel">The log level</param>
        void Log(string message, LogSeverity logLevel = LogSeverity.Info);

        /// <summary>
        /// Log an error
        /// </summary>
        /// <param name="error">The error to log</param>
        /// <param name="exception">Optional exception</param>
        void LogError(string error, Exception? exception = null);

        /// <summary>
        /// Get recent logs
        /// </summary>
        /// <param name="count">Maximum number of logs to return</param>
        /// <returns>Recent logs</returns>
        IEnumerable<LogEntry> GetRecentLogs(int count = 100);

        /// <summary>
        /// Get logs for a specific operation
        /// </summary>
        /// <param name="operationId">The operation ID</param>
        /// <returns>Logs for the operation</returns>
        IEnumerable<LogEntry> GetLogsForOperation(string operationId);
    }
}
