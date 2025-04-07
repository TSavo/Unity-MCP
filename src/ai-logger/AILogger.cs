using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

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
    /// Configuration for the AI Logger
    /// </summary>
    public class AILoggerConfig
    {
        /// <summary>
        /// URL of the MCP server
        /// </summary>
        public string ServerUrl { get; set; } = "http://localhost:8080";

        /// <summary>
        /// Default log level
        /// </summary>
        public LogLevel DefaultLogLevel { get; set; } = LogLevel.Info;

        /// <summary>
        /// Size of the log buffer before flushing
        /// </summary>
        public int BufferSize { get; set; } = 100;

        /// <summary>
        /// Interval to flush the log buffer
        /// </summary>
        public TimeSpan FlushInterval { get; set; } = TimeSpan.FromSeconds(5);

        /// <summary>
        /// Whether to include call site information
        /// </summary>
        public bool IncludeCallSite { get; set; } = true;

        /// <summary>
        /// Whether to include timestamp
        /// </summary>
        public bool IncludeTimestamp { get; set; } = true;
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

        /// <summary>
        /// Call site information
        /// </summary>
        public string CallSite { get; set; }
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
    /// MCP server appender
    /// </summary>
    public class MCPServerAppender : ILogAppender
    {
        private readonly string serverUrl;
        private readonly HttpClient httpClient;
        private readonly List<LogEntry> buffer = new List<LogEntry>();
        private readonly int bufferSize;
        private readonly Timer flushTimer;
        private readonly object lockObject = new object();

        /// <summary>
        /// Create a new MCP server appender
        /// </summary>
        /// <param name="serverUrl">URL of the MCP server</param>
        /// <param name="bufferSize">Size of the log buffer before flushing</param>
        /// <param name="flushInterval">Interval to flush the log buffer</param>
        public MCPServerAppender(string serverUrl, int bufferSize = 100, TimeSpan? flushInterval = null)
        {
            this.serverUrl = serverUrl;
            this.bufferSize = bufferSize;
            this.httpClient = new HttpClient();
            this.flushTimer = new Timer(FlushTimerCallback, null, flushInterval ?? TimeSpan.FromSeconds(5), flushInterval ?? TimeSpan.FromSeconds(5));
        }

        /// <summary>
        /// Append a log entry
        /// </summary>
        /// <param name="entry">Log entry</param>
        public void Append(LogEntry entry)
        {
            lock (lockObject)
            {
                buffer.Add(entry);

                if (buffer.Count >= bufferSize)
                {
                    Flush();
                }
            }
        }

        /// <summary>
        /// Flush the log buffer
        /// </summary>
        public void Flush()
        {
            List<LogEntry> entriesToFlush;

            lock (lockObject)
            {
                if (buffer.Count == 0)
                {
                    return;
                }

                entriesToFlush = new List<LogEntry>(buffer);
                buffer.Clear();
            }

            try
            {
                // Group entries by logger name
                var entriesByLogger = new Dictionary<string, List<LogEntry>>();

                foreach (var entry in entriesToFlush)
                {
                    if (!entriesByLogger.ContainsKey(entry.LoggerName))
                    {
                        entriesByLogger[entry.LoggerName] = new List<LogEntry>();
                    }

                    entriesByLogger[entry.LoggerName].Add(entry);
                }

                // Send entries to MCP server
                foreach (var kvp in entriesByLogger)
                {
                    var logName = kvp.Key;
                    var entries = kvp.Value;

                    var json = JsonSerializer.Serialize(entries);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");
                    var task = httpClient.PostAsync($"{serverUrl}/logs/{logName}/append", content);
                    task.Wait();
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error flushing logs: {ex.Message}");
            }
        }

        private void FlushTimerCallback(object state)
        {
            Flush();
        }
    }

    /// <summary>
    /// Console appender
    /// </summary>
    public class ConsoleAppender : ILogAppender
    {
        /// <summary>
        /// Append a log entry
        /// </summary>
        /// <param name="entry">Log entry</param>
        public void Append(LogEntry entry)
        {
            var color = GetColorForLevel(entry.Level);
            Console.ForegroundColor = color;
            Console.WriteLine($"[{entry.Timestamp:yyyy-MM-dd HH:mm:ss}] [{entry.Level}] [{entry.LoggerName}] {entry.Message}");
            
            if (entry.Data != null)
            {
                Console.WriteLine($"Data: {JsonSerializer.Serialize(entry.Data)}");
            }
            
            Console.ResetColor();
        }
        
        private ConsoleColor GetColorForLevel(LogLevel level)
        {
            switch (level)
            {
                case LogLevel.Debug: return ConsoleColor.Gray;
                case LogLevel.Info: return ConsoleColor.White;
                case LogLevel.Warning: return ConsoleColor.Yellow;
                case LogLevel.Error: return ConsoleColor.Red;
                case LogLevel.Critical: return ConsoleColor.DarkRed;
                default: return ConsoleColor.White;
            }
        }
    }

    /// <summary>
    /// AI Logger
    /// </summary>
    public class AILogger
    {
        private readonly string loggerName;
        private readonly AILoggerConfig config;
        private readonly List<ILogAppender> appenders = new List<ILogAppender>();
        private readonly List<string> tags = new List<string>();
        private readonly Dictionary<string, object> context = new Dictionary<string, object>();

        /// <summary>
        /// Create a new AI Logger
        /// </summary>
        /// <param name="loggerName">Logger name</param>
        /// <param name="config">Logger configuration</param>
        public AILogger(string loggerName, AILoggerConfig config = null)
        {
            this.loggerName = loggerName;
            this.config = config ?? new AILoggerConfig();

            // Add default appender if none provided
            if (appenders.Count == 0)
            {
                AddAppender(new MCPServerAppender(
                    this.config.ServerUrl,
                    this.config.BufferSize,
                    this.config.FlushInterval
                ));
            }
        }

        /// <summary>
        /// Add an appender to the logger
        /// </summary>
        /// <param name="appender">Appender to add</param>
        public void AddAppender(ILogAppender appender)
        {
            appenders.Add(appender);
        }

        /// <summary>
        /// Create a new logger with the specified tags
        /// </summary>
        /// <param name="tags">Tags to add</param>
        /// <returns>New logger with the specified tags</returns>
        public AILogger WithTags(params string[] tags)
        {
            var logger = new AILogger(loggerName, config);
            
            foreach (var appender in appenders)
            {
                logger.AddAppender(appender);
            }
            
            logger.tags.AddRange(this.tags);
            logger.tags.AddRange(tags);
            
            foreach (var kvp in context)
            {
                logger.context[kvp.Key] = kvp.Value;
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
            var logger = new AILogger(loggerName, config);
            
            foreach (var appender in appenders)
            {
                logger.AddAppender(appender);
            }
            
            logger.tags.AddRange(this.tags);
            
            foreach (var kvp in context)
            {
                logger.context[kvp.Key] = kvp.Value;
            }
            
            logger.context[key] = value;
            
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
            if (level < config.DefaultLogLevel)
            {
                return;
            }

            var entry = new LogEntry
            {
                Level = level,
                LoggerName = loggerName,
                Message = message,
                Data = data,
                Timestamp = DateTime.UtcNow,
                Tags = new List<string>(tags),
                Context = new Dictionary<string, object>(context)
            };

            if (config.IncludeCallSite)
            {
                entry.CallSite = GetCallSite();
            }

            foreach (var appender in appenders)
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

        private string GetCallSite()
        {
            try
            {
                var stackTrace = new System.Diagnostics.StackTrace(true);
                var frames = stackTrace.GetFrames();

                // Skip frames for the logger itself
                for (int i = 0; i < frames.Length; i++)
                {
                    var method = frames[i].GetMethod();
                    var declaringType = method.DeclaringType;

                    if (declaringType != typeof(AILogger))
                    {
                        var fileName = frames[i].GetFileName();
                        var lineNumber = frames[i].GetFileLineNumber();
                        return $"{declaringType.FullName}.{method.Name} ({fileName}:{lineNumber})";
                    }
                }
            }
            catch
            {
                // Ignore errors in getting call site
            }

            return null;
        }
    }
}
