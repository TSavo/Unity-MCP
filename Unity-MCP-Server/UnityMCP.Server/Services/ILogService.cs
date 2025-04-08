using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityMCP.Server.Models;

namespace UnityMCP.Server.Services
{
    /// <summary>
    /// Log severity levels
    /// </summary>
    public enum LogSeverity
    {
        Debug,
        Info,
        Warning,
        Error,
        Critical
    }

    /// <summary>
    /// Interface for log service
    /// </summary>
    public interface ILogService
    {
        /// <summary>
        /// Log a message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="severity">The severity of the log</param>
        void Log(string message, LogSeverity severity = LogSeverity.Info);

        /// <summary>
        /// Log an error message
        /// </summary>
        /// <param name="message">The error message</param>
        /// <param name="exception">The exception (optional)</param>
        void LogError(string message, Exception? exception = null);

        /// <summary>
        /// Get all logs for a specific log name
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <param name="limit">The maximum number of logs to return (0 for all)</param>
        /// <returns>The log entries</returns>
        Task<List<LogEntry>> GetLogsByNameAsync(string logName, int limit = 0);

        /// <summary>
        /// Append data to a log
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <param name="data">The data to append</param>
        /// <returns>The log entry</returns>
        Task<LogEntry> AppendToLogAsync(string logName, object data);

        /// <summary>
        /// Clear a log
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <returns>True if the log was cleared, false otherwise</returns>
        Task<bool> ClearLogAsync(string logName);
    }
}
