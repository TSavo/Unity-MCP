#if LOG4NET
using System.Collections.Generic;
using log4net.Appender;
using log4net.Core;

namespace AI.Logging.Adapters
{
    /// <summary>
    /// log4net appender that forwards logs to AI Logger
    /// </summary>
    public class AILoggerAppender : AppenderSkeleton
    {
        private readonly AILogger logger;

        /// <summary>
        /// Create a new AI Logger appender
        /// </summary>
        public AILoggerAppender()
        {
            this.logger = new AILogger("log4net");
        }

        /// <summary>
        /// Create a new AI Logger appender with the specified logger
        /// </summary>
        /// <param name="logger">AI Logger to forward logs to</param>
        public AILoggerAppender(AILogger logger)
        {
            this.logger = logger;
        }

        /// <summary>
        /// Append a logging event
        /// </summary>
        /// <param name="loggingEvent">Logging event to append</param>
        protected override void Append(LoggingEvent loggingEvent)
        {
            var level = ConvertLogLevel(loggingEvent.Level);
            var message = loggingEvent.RenderedMessage;
            var properties = new Dictionary<string, object>();
            
            // Extract properties
            if (loggingEvent.Properties != null)
            {
                foreach (var key in loggingEvent.Properties.GetKeys())
                {
                    properties[key] = loggingEvent.Properties[key];
                }
            }
            
            logger.Log(level, message, new
            {
                loggerName = loggingEvent.LoggerName,
                properties = properties,
                exception = loggingEvent.ExceptionObject != null ? new
                {
                    message = loggingEvent.ExceptionObject.Message,
                    stackTrace = loggingEvent.ExceptionObject.StackTrace,
                    type = loggingEvent.ExceptionObject.GetType().FullName
                } : null,
                threadName = loggingEvent.ThreadName,
                timeStamp = loggingEvent.TimeStamp
            });
        }
        
        private LogLevel ConvertLogLevel(Level level)
        {
            if (level == Level.Debug) return LogLevel.Debug;
            if (level == Level.Info) return LogLevel.Info;
            if (level == Level.Warn) return LogLevel.Warning;
            if (level == Level.Error) return LogLevel.Error;
            if (level == Level.Fatal) return LogLevel.Critical;
            return LogLevel.Info;
        }
    }
}
#endif
