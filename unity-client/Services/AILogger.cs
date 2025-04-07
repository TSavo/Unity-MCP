using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace AI.Logging
{
    /// <summary>
    /// Log levels supported by the AI Logger
    /// </summary>
    public enum LogLevel
    {
        Debug = 0,
        Info = 1,
        Warning = 2,
        Error = 3,
        Critical = 4
    }

    /// <summary>
    /// Log entry
    /// </summary>
    public class LogEntry
    {
        /// <summary>
        /// Log level
        /// </summary>
        public LogLevel Level { get; set; }

        /// <summary>
        /// Logger name
        /// </summary>
        public string LoggerName { get; set; }

        /// <summary>
        /// Log message
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// Log data
        /// </summary>
        public object Data { get; set; }

        /// <summary>
        /// Log timestamp
        /// </summary>
        public DateTime Timestamp { get; set; }

        /// <summary>
        /// Log tags
        /// </summary>
        public List<string> Tags { get; set; } = new List<string>();

        /// <summary>
        /// Log context
        /// </summary>
        public Dictionary<string, object> Context { get; set; } = new Dictionary<string, object>();
    }

    /// <summary>
    /// Interface for log appenders
    /// </summary>
    public interface ILogAppender
    {
        /// <summary>
        /// Append a log entry
        /// </summary>
        /// <param name="entry">Log entry</param>
        void Append(LogEntry entry);
    }

    /// <summary>
    /// Console appender
    /// </summary>
    public class ConsoleAppender : ILogAppender
    {
        private readonly ILogger<ConsoleAppender> _logger;

        /// <summary>
        /// Create a new console appender
        /// </summary>
        public ConsoleAppender()
        {
            // Create a logger factory
            var loggerFactory = LoggerFactory.Create(builder =>
            {
                builder.AddConsole();
            });

            _logger = loggerFactory.CreateLogger<ConsoleAppender>();
        }

        /// <summary>
        /// Append a log entry
        /// </summary>
        /// <param name="entry">Log entry</param>
        public void Append(LogEntry entry)
        {
            var logLevel = ConvertLogLevel(entry.Level);
            var message = $"[{entry.LoggerName}] {entry.Message}";
            
            if (entry.Data != null)
            {
                message += $" Data: {JsonSerializer.Serialize(entry.Data)}";
            }
            
            _logger.Log(logLevel, message);
        }
        
        private Microsoft.Extensions.Logging.LogLevel ConvertLogLevel(LogLevel level)
        {
            switch (level)
            {
                case LogLevel.Debug:
                    return Microsoft.Extensions.Logging.LogLevel.Debug;
                case LogLevel.Info:
                    return Microsoft.Extensions.Logging.LogLevel.Information;
                case LogLevel.Warning:
                    return Microsoft.Extensions.Logging.LogLevel.Warning;
                case LogLevel.Error:
                    return Microsoft.Extensions.Logging.LogLevel.Error;
                case LogLevel.Critical:
                    return Microsoft.Extensions.Logging.LogLevel.Critical;
                default:
                    return Microsoft.Extensions.Logging.LogLevel.Information;
            }
        }
    }

    /// <summary>
    /// MCP server appender
    /// </summary>
    public class MCPServerAppender : ILogAppender
    {
        private readonly string _serverUrl;
        private readonly HttpClient _httpClient;

        /// <summary>
        /// Create a new MCP server appender
        /// </summary>
        /// <param name="serverUrl">URL of the MCP server</param>
        public MCPServerAppender(string serverUrl)
        {
            _serverUrl = serverUrl;
            _httpClient = new HttpClient();
        }

        /// <summary>
        /// Append a log entry
        /// </summary>
        /// <param name="entry">Log entry</param>
        public void Append(LogEntry entry)
        {
            try
            {
                // Serialize the entry
                var json = JsonSerializer.Serialize(entry);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                // Send to MCP server
                var task = _httpClient.PostAsync($"{_serverUrl}/logs/{entry.LoggerName}/append", content);
                task.Wait();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error sending log to MCP server: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// AI Logger
    /// </summary>
    public class AILogger
    {
        private readonly string _loggerName;
        private readonly List<ILogAppender> _appenders = new List<ILogAppender>();
        private readonly List<string> _tags = new List<string>();
        private readonly Dictionary<string, object> _context = new Dictionary<string, object>();

        /// <summary>
        /// Create a new AI Logger
        /// </summary>
        /// <param name="loggerName">Logger name</param>
        public AILogger(string loggerName)
        {
            _loggerName = loggerName;

            // Add default appender
            AddAppender(new MCPServerAppender("http://mcp-server-dev:8080"));
        }

        /// <summary>
        /// Add an appender to the logger
        /// </summary>
        /// <param name="appender">Appender to add</param>
        public void AddAppender(ILogAppender appender)
        {
            _appenders.Add(appender);
        }

        /// <summary>
        /// Create a new logger with the specified tags
        /// </summary>
        /// <param name="tags">Tags to add</param>
        /// <returns>New logger with the specified tags</returns>
        public AILogger WithTags(params string[] tags)
        {
            var logger = new AILogger(_loggerName);
            
            foreach (var appender in _appenders)
            {
                logger.AddAppender(appender);
            }
            
            logger._tags.AddRange(_tags);
            logger._tags.AddRange(tags);
            
            foreach (var kvp in _context)
            {
                logger._context[kvp.Key] = kvp.Value;
            }
            
            return logger;
        }

        /// <summary>
        /// Create a new logger with the specified context
        /// </summary>
        /// <param name="key">Context key</param>
        /// <param name="value">Context value</param>
        /// <returns>New logger with the specified context</returns>
        public AILogger WithContext(string key, object value)
        {
            var logger = new AILogger(_loggerName);
            
            foreach (var appender in _appenders)
            {
                logger.AddAppender(appender);
            }
            
            logger._tags.AddRange(_tags);
            
            foreach (var kvp in _context)
            {
                logger._context[kvp.Key] = kvp.Value;
            }
            
            logger._context[key] = value;
            
            return logger;
        }

        /// <summary>
        /// Log a message at the specified level
        /// </summary>
        /// <param name="level">Log level</param>
        /// <param name="message">Log message</param>
        /// <param name="data">Log data</param>
        public void Log(LogLevel level, string message, object data = null)
        {
            var entry = new LogEntry
            {
                Level = level,
                LoggerName = _loggerName,
                Message = message,
                Data = data,
                Timestamp = DateTime.UtcNow,
                Tags = new List<string>(_tags),
                Context = new Dictionary<string, object>(_context)
            };

            foreach (var appender in _appenders)
            {
                appender.Append(entry);
            }
        }

        /// <summary>
        /// Log a debug message
        /// </summary>
        /// <param name="message">Log message</param>
        /// <param name="data">Log data</param>
        public void Debug(string message, object data = null)
        {
            Log(LogLevel.Debug, message, data);
        }

        /// <summary>
        /// Log an info message
        /// </summary>
        /// <param name="message">Log message</param>
        /// <param name="data">Log data</param>
        public void Info(string message, object data = null)
        {
            Log(LogLevel.Info, message, data);
        }

        /// <summary>
        /// Log a warning message
        /// </summary>
        /// <param name="message">Log message</param>
        /// <param name="data">Log data</param>
        public void Warning(string message, object data = null)
        {
            Log(LogLevel.Warning, message, data);
        }

        /// <summary>
        /// Log an error message
        /// </summary>
        /// <param name="message">Log message</param>
        /// <param name="data">Log data</param>
        public void Error(string message, object data = null)
        {
            Log(LogLevel.Error, message, data);
        }

        /// <summary>
        /// Log a critical message
        /// </summary>
        /// <param name="message">Log message</param>
        /// <param name="data">Log data</param>
        public void Critical(string message, object data = null)
        {
            Log(LogLevel.Critical, message, data);
        }
    }
}
