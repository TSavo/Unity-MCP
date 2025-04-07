#if SERILOG
using System;
using System.Collections.Generic;
using Serilog.Core;
using Serilog.Events;

namespace AI.Logging.Adapters
{
    /// <summary>
    /// Serilog sink that forwards logs to AI Logger
    /// </summary>
    public class AILoggerSink : ILogEventSink
    {
        private readonly AILogger logger;
        private readonly IFormatProvider formatProvider;

        /// <summary>
        /// Create a new AI Logger sink
        /// </summary>
        /// <param name="formatProvider">Format provider</param>
        public AILoggerSink(IFormatProvider formatProvider = null)
        {
            this.logger = new AILogger("Serilog");
            this.formatProvider = formatProvider;
        }

        /// <summary>
        /// Create a new AI Logger sink with the specified logger
        /// </summary>
        /// <param name="logger">AI Logger to forward logs to</param>
        /// <param name="formatProvider">Format provider</param>
        public AILoggerSink(AILogger logger, IFormatProvider formatProvider = null)
        {
            this.logger = logger;
            this.formatProvider = formatProvider;
        }

        /// <summary>
        /// Emit a log event
        /// </summary>
        /// <param name="logEvent">Log event to emit</param>
        public void Emit(LogEvent logEvent)
        {
            var level = ConvertLogLevel(logEvent.Level);
            var message = logEvent.RenderMessage(formatProvider);
            var properties = new Dictionary<string, object>();
            
            // Extract properties
            foreach (var property in logEvent.Properties)
            {
                properties[property.Key] = ConvertPropertyValue(property.Value);
            }
            
            logger.Log(level, message, new
            {
                properties = properties,
                exception = logEvent.Exception != null ? new
                {
                    message = logEvent.Exception.Message,
                    stackTrace = logEvent.Exception.StackTrace,
                    type = logEvent.Exception.GetType().FullName
                } : null,
                timestamp = logEvent.Timestamp
            });
        }
        
        private LogLevel ConvertLogLevel(LogEventLevel level)
        {
            switch (level)
            {
                case LogEventLevel.Verbose:
                case LogEventLevel.Debug:
                    return LogLevel.Debug;
                case LogEventLevel.Information:
                    return LogLevel.Info;
                case LogEventLevel.Warning:
                    return LogLevel.Warning;
                case LogEventLevel.Error:
                    return LogLevel.Error;
                case LogEventLevel.Fatal:
                    return LogLevel.Critical;
                default:
                    return LogLevel.Info;
            }
        }
        
        private object ConvertPropertyValue(LogEventPropertyValue value)
        {
            if (value is ScalarValue scalarValue)
            {
                return scalarValue.Value;
            }
            
            if (value is SequenceValue sequenceValue)
            {
                var result = new List<object>();
                foreach (var element in sequenceValue.Elements)
                {
                    result.Add(ConvertPropertyValue(element));
                }
                return result;
            }
            
            if (value is StructureValue structureValue)
            {
                var result = new Dictionary<string, object>();
                foreach (var property in structureValue.Properties)
                {
                    result[property.Name] = ConvertPropertyValue(property.Value);
                }
                return result;
            }
            
            if (value is DictionaryValue dictionaryValue)
            {
                var result = new Dictionary<object, object>();
                foreach (var element in dictionaryValue.Elements)
                {
                    result[ConvertPropertyValue(element.Key)] = ConvertPropertyValue(element.Value);
                }
                return result;
            }
            
            return value.ToString();
        }
    }
}
#endif
