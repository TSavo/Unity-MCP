using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using UnityMCP.Server.Models;

namespace UnityMCP.Server.Services
{
    /// <summary>
    /// In-memory implementation of ILogService
    /// </summary>
    public class InMemoryLogService : ILogService
    {
        private readonly Dictionary<string, List<LogEntry>> _logs = new Dictionary<string, List<LogEntry>>();
        private readonly object _lock = new object();
        private readonly ILogger<InMemoryLogService> _logger;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="logger">Logger</param>
        public InMemoryLogService(ILogger<InMemoryLogService> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Log a message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="severity">The severity of the log</param>
        public void Log(string message, LogSeverity severity = LogSeverity.Info)
        {
            _logger.LogInformation($"[{severity}] {message}");
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
                _logger.LogError(exception, message);
            }
            else
            {
                _logger.LogError(message);
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
            lock (_lock)
            {
                if (!_logs.TryGetValue(logName, out var logs))
                {
                    return Task.FromResult(new List<LogEntry>());
                }

                var result = logs.OrderByDescending(l => l.Timestamp).ToList();
                if (limit > 0 && result.Count > limit)
                {
                    result = result.Take(limit).ToList();
                }

                return Task.FromResult(result);
            }
        }

        /// <summary>
        /// Append data to a log
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <param name="data">The data to append</param>
        /// <returns>The log entry</returns>
        public Task<LogEntry> AppendToLogAsync(string logName, object data)
        {
            var entry = new LogEntry
            {
                Name = logName,
                Data = data,
                Timestamp = DateTime.UtcNow
            };

            lock (_lock)
            {
                if (!_logs.TryGetValue(logName, out var logs))
                {
                    logs = new List<LogEntry>();
                    _logs[logName] = logs;
                }

                logs.Add(entry);
            }

            return Task.FromResult(entry);
        }

        /// <summary>
        /// Clear a log
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <returns>True if the log was cleared, false otherwise</returns>
        public Task<bool> ClearLogAsync(string logName)
        {
            lock (_lock)
            {
                if (!_logs.TryGetValue(logName, out _))
                {
                    return Task.FromResult(false);
                }

                _logs.Remove(logName);
                return Task.FromResult(true);
            }
        }
    }
}
