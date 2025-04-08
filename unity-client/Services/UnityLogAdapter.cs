using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityMCP.Server.Models;
using UnityMCP.Server.Services;

namespace UnityMCP.Client.Services
{
    /// <summary>
    /// Adapter that bridges between Unity's logging system and our ILogService
    /// </summary>
    public class UnityLogAdapter : ILogService
    {
        /// <summary>
        /// Log a message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="severity">The severity of the log</param>
        public void Log(string message, LogSeverity severity = LogSeverity.Info)
        {
            switch (severity)
            {
                case LogSeverity.Debug:
                    Debug.Log($"[Debug] {message}");
                    break;
                case LogSeverity.Info:
                    Debug.Log($"[Info] {message}");
                    break;
                case LogSeverity.Warning:
                    Debug.LogWarning($"[Warning] {message}");
                    break;
                case LogSeverity.Error:
                case LogSeverity.Critical:
                    Debug.LogError($"[{severity}] {message}");
                    break;
                default:
                    Debug.Log(message);
                    break;
            }
        }

        /// <summary>
        /// Log an error message
        /// </summary>
        /// <param name="message">The error message</param>
        /// <param name="exception">The exception (optional)</param>
        public void LogError(string message, Exception? exception = null)
        {
            if (exception != null)
            {
                Debug.LogError($"{message}: {exception.Message}\n{exception.StackTrace}");
            }
            else
            {
                Debug.LogError(message);
            }
        }

        /// <summary>
        /// Get all logs for a specific log name
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <param name="limit">The maximum number of logs to return (0 for all)</param>
        /// <returns>The log entries</returns>
        public Task<List<LogEntry>> GetLogsByNameAsync(string logName, int limit = 0)
        {
            // Unity doesn't provide a way to get logs programmatically
            // This is just a stub implementation
            return Task.FromResult(new List<LogEntry>());
        }

        /// <summary>
        /// Append data to a log
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <param name="data">The data to append</param>
        /// <returns>The log entry</returns>
        public Task<LogEntry> AppendToLogAsync(string logName, object data)
        {
            // Create a log entry
            var entry = new LogEntry
            {
                Name = logName,
                Data = data,
                Timestamp = DateTime.UtcNow
            };

            // Log to Unity's console
            Debug.Log($"[{logName}] {data}");

            return Task.FromResult(entry);
        }

        /// <summary>
        /// Clear a log
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <returns>True if the log was cleared, false otherwise</returns>
        public Task<bool> ClearLogAsync(string logName)
        {
            // Unity doesn't provide a way to clear logs programmatically
            // This is just a stub implementation
            return Task.FromResult(true);
        }
    }
}
