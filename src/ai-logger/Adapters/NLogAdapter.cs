#if NLOG
using System.Collections.Generic;
using NLog;
using NLog.Targets;

namespace AI.Logging.Adapters
{
    /// <summary>
    /// NLog target that forwards logs to AI Logger
    /// </summary>
    [Target("AILogger")]
    public class AILoggerTarget : TargetWithLayout
    {
        private readonly AILogger logger;

        /// <summary>
        /// Create a new AI Logger target
        /// </summary>
        public AILoggerTarget()
        {
            this.logger = new AILogger("NLog");
        }

        /// <summary>
        /// Create a new AI Logger target with the specified logger
        /// </summary>
        /// <param name="logger">AI Logger to forward logs to</param>
        public AILoggerTarget(AILogger logger)
        {
            this.logger = logger;
        }

        /// <summary>
        /// Write a log event
        /// </summary>
        /// <param name="logEvent">Log event to write</param>
        protected override void Write(LogEventInfo logEvent)
        {
            var level = ConvertLogLevel(logEvent.Level);
            var message = Layout.Render(logEvent);
            var properties = new Dictionary<string, object>();
            
            // Extract properties
            foreach (var key in logEvent.Properties.Keys)
            {
                properties[key.ToString()] = logEvent.Properties[key];
            }
            
            logger.Log(level, message, new
            {
                loggerName = logEvent.LoggerName,
                properties = properties,
                exception = logEvent.Exception != null ? new
                {
                    message = logEvent.Exception.Message,
                    stackTrace = logEvent.Exception.StackTrace,
                    type = logEvent.Exception.GetType().FullName
                } : null
            });
        }
        
        private LogLevel ConvertLogLevel(NLog.LogLevel level)
        {
            if (level == NLog.LogLevel.Debug) return LogLevel.Debug;
            if (level == NLog.LogLevel.Info) return LogLevel.Info;
            if (level == NLog.LogLevel.Warn) return LogLevel.Warning;
            if (level == NLog.LogLevel.Error) return LogLevel.Error;
            if (level == NLog.LogLevel.Fatal) return LogLevel.Critical;
            return LogLevel.Info;
        }
    }
}
#endif
