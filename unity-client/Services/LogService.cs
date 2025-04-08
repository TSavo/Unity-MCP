using UnityMCP.Client.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace UnityMCP.Client.Services
{
    /// <summary>
    /// Implementation of the log service
    /// </summary>
    public class LogService : ILogService
    {
        private readonly List<LogEntry> _logs = new List<LogEntry>();
        private readonly int _maxLogCount;
        private readonly object _lock = new object();
        private readonly ILogger<LogService> _logger;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="logger">Logger</param>
        /// <param name="maxLogCount">Maximum number of logs to keep in memory</param>
        public LogService(ILogger<LogService> logger, int maxLogCount = 1000)
        {
            _logger = logger;
            _maxLogCount = maxLogCount;
        }

        /// <summary>
        /// Log a message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="logLevel">The log level</param>
        public void Log(string message, LogSeverity logLevel = LogSeverity.Info)
        {
            var entry = new LogEntry
            {
                Message = message,
                Level = logLevel,
                Timestamp = DateTime.UtcNow
            };

            lock (_lock)
            {
                _logs.Add(entry);

                // Trim logs if we exceed the maximum count
                if (_logs.Count > _maxLogCount)
                {
                    _logs.RemoveRange(0, _logs.Count - _maxLogCount);
                }
            }

            // Also log to the built-in logger
            switch (logLevel)
            {
                case LogSeverity.Debug:
                    _logger.LogDebug(message);
                    break;
                case LogSeverity.Info:
                    _logger.LogInformation(message);
                    break;
                case LogSeverity.Warning:
                    _logger.LogWarning(message);
                    break;
                case LogSeverity.Error:
                    _logger.LogError(message);
                    break;
            }
        }

        /// <summary>
        /// Log an error
        /// </summary>
        /// <param name="error">The error to log</param>
        /// <param name="exception">Optional exception</param>
        public void LogError(string error, Exception? exception = null)
        {
            var entry = new LogEntry
            {
                Message = error,
                Level = LogSeverity.Error,
                Timestamp = DateTime.UtcNow,
                StackTrace = exception?.StackTrace
            };

            lock (_lock)
            {
                _logs.Add(entry);

                // Trim logs if we exceed the maximum count
                if (_logs.Count > _maxLogCount)
                {
                    _logs.RemoveRange(0, _logs.Count - _maxLogCount);
                }
            }

            // Also log to the built-in logger
            _logger.LogError(exception, error);
        }

        /// <summary>
        /// Get recent logs
        /// </summary>
        /// <param name="count">Maximum number of logs to return</param>
        /// <returns>Recent logs</returns>
        public IEnumerable<LogEntry> GetRecentLogs(int count = 100)
        {
            lock (_lock)
            {
                return _logs.OrderByDescending(l => l.Timestamp).Take(count).ToList();
            }
        }

        /// <summary>
        /// Get logs for a specific operation
        /// </summary>
        /// <param name="operationId">The operation ID</param>
        /// <returns>Logs for the operation</returns>
        public IEnumerable<LogEntry> GetLogsForOperation(string operationId)
        {
            lock (_lock)
            {
                return _logs.Where(l => l.OperationId == operationId).OrderBy(l => l.Timestamp).ToList();
            }
        }
    }
}
