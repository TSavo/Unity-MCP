using System;
using System.Threading.Tasks;
using UnityMCP.Unity.Models;
using UnityMCP.Unity.Services;

namespace UnityMCP.Unity.Logging
{
    /// <summary>
    /// AI Logger implementation
    /// </summary>
    public class AILogger
    {
        private readonly ILogService _logService;
        private readonly string _loggerName;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="loggerName">The name of the logger</param>
        /// <param name="logService">The log service</param>
        public AILogger(string loggerName, ILogService logService)
        {
            _loggerName = loggerName;
            _logService = logService;
        }

        /// <summary>
        /// Constructor with just the logger name
        /// </summary>
        /// <param name="loggerName">The name of the logger</param>
        public AILogger(string loggerName)
        {
            _loggerName = loggerName;
            _logService = null;
        }

        /// <summary>
        /// Log a debug message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="data">Additional data (optional)</param>
        public async Task Debug(string message, object data = null)
        {
            await LogAsync(message, data, LogSeverity.Debug);
        }

        /// <summary>
        /// Log an info message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="data">Additional data (optional)</param>
        public async Task Info(string message, object data = null)
        {
            await LogAsync(message, data, LogSeverity.Info);
        }

        /// <summary>
        /// Log a warning message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="data">Additional data (optional)</param>
        public async Task Warning(string message, object data = null)
        {
            await LogAsync(message, data, LogSeverity.Warning);
        }

        /// <summary>
        /// Log an error message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="data">Additional data (optional)</param>
        public async Task Error(string message, object data = null)
        {
            await LogAsync(message, data, LogSeverity.Error);
        }

        /// <summary>
        /// Log a critical message
        /// </summary>
        /// <param name="message">The message to log</param>
        /// <param name="data">Additional data (optional)</param>
        public async Task Critical(string message, object data = null)
        {
            await LogAsync(message, data, LogSeverity.Critical);
        }

        private async Task LogAsync(string message, object data, LogSeverity severity)
        {
            var logData = new
            {
                message,
                data,
                severity = severity.ToString(),
                timestamp = DateTime.UtcNow
            };

            if (_logService != null)
            {
                await _logService.AppendToLogAsync(_loggerName, logData);
            }
            else
            {
                // If no log service is provided, just log to the console
                Console.WriteLine($"[{severity}] {message}");
            }
        }
    }
}
