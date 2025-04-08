using System;
using System.Collections.Generic;
using UnityEngine;
using UnityMCP.Client.Models;

namespace UnityMCP.Client.Services
{
    /// <summary>
    /// Unity implementation of ILogService
    /// </summary>
    public class UnityLogService : ILogService
    {
        /// <summary>
        /// Log a message
        /// </summary>
        public void Log(string message, LogSeverity logLevel = LogSeverity.Info)
        {
            switch (logLevel)
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
                    Debug.LogError($"[{logLevel}] {message}");
                    break;
                default:
                    Debug.Log(message);
                    break;
            }
        }

        /// <summary>
        /// Log an error
        /// </summary>
        public void LogError(string error, Exception exception = null)
        {
            if (exception != null)
            {
                Debug.LogError($"{error}: {exception.Message}\n{exception.StackTrace}");
            }
            else
            {
                Debug.LogError(error);
            }
        }

        /// <summary>
        /// Get recent logs
        /// </summary>
        public IEnumerable<LogEntry> GetRecentLogs(int count = 100)
        {
            // Unity doesn't provide a way to get logs programmatically
            // This is just a stub implementation
            return new List<LogEntry>();
        }

        /// <summary>
        /// Get logs for a specific operation
        /// </summary>
        public IEnumerable<LogEntry> GetLogsForOperation(string operationId)
        {
            // Unity doesn't provide a way to get logs programmatically
            // This is just a stub implementation
            return new List<LogEntry>();
        }
    }
}
