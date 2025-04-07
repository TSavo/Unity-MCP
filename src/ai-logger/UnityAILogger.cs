#if UNITY_2018_1_OR_NEWER
using System;
using System.Collections.Generic;
using UnityEngine;

namespace AI.Logging.Unity
{
    /// <summary>
    /// Unity-specific AI Logger
    /// </summary>
    public class UnityAILogger : AILogger
    {
        /// <summary>
        /// Create a new Unity AI Logger
        /// </summary>
        /// <param name="loggerName">Logger name</param>
        /// <param name="config">Logger configuration</param>
        public UnityAILogger(string loggerName, AILoggerConfig config = null)
            : base(loggerName, config)
        {
            // Add Unity context
            WithContext("unityVersion", Application.unityVersion)
                .WithContext("platform", Application.platform.ToString())
                .WithContext("productName", Application.productName)
                .WithContext("companyName", Application.companyName)
                .WithContext("targetFrameRate", Application.targetFrameRate)
                .WithContext("systemLanguage", Application.systemLanguage.ToString());
        }

        /// <summary>
        /// Create a new Unity AI Logger for a MonoBehaviour
        /// </summary>
        /// <param name="monoBehaviour">MonoBehaviour to create logger for</param>
        /// <param name="config">Logger configuration</param>
        /// <returns>New Unity AI Logger</returns>
        public static UnityAILogger ForMonoBehaviour(MonoBehaviour monoBehaviour, AILoggerConfig config = null)
        {
            var logger = new UnityAILogger(monoBehaviour.GetType().Name, config);
            
            // Add GameObject context
            logger.WithContext("gameObject", monoBehaviour.gameObject.name)
                .WithContext("scene", monoBehaviour.gameObject.scene.name)
                .WithContext("position", monoBehaviour.transform.position)
                .WithContext("rotation", monoBehaviour.transform.rotation.eulerAngles)
                .WithContext("scale", monoBehaviour.transform.localScale);
            
            return logger;
        }

        /// <summary>
        /// Log an exception
        /// </summary>
        /// <param name="exception">Exception to log</param>
        /// <param name="message">Optional message</param>
        public void LogException(Exception exception, string message = null)
        {
            Error(message ?? exception.Message, new
            {
                exceptionType = exception.GetType().FullName,
                message = exception.Message,
                stackTrace = exception.StackTrace,
                innerException = exception.InnerException != null ? new
                {
                    exceptionType = exception.InnerException.GetType().FullName,
                    message = exception.InnerException.Message,
                    stackTrace = exception.InnerException.StackTrace
                } : null
            });
        }

        /// <summary>
        /// Log a Unity message
        /// </summary>
        /// <param name="logType">Unity log type</param>
        /// <param name="message">Log message</param>
        /// <param name="context">Log context</param>
        public void LogUnityMessage(LogType logType, string message, UnityEngine.Object context = null)
        {
            var level = ConvertLogType(logType);
            var contextData = context != null ? new
            {
                name = context.name,
                type = context.GetType().Name
            } : null;

            Log(level, message, contextData);
        }

        private LogLevel ConvertLogType(LogType logType)
        {
            switch (logType)
            {
                case LogType.Log:
                    return LogLevel.Info;
                case LogType.Warning:
                    return LogLevel.Warning;
                case LogType.Error:
                case LogType.Exception:
                    return LogLevel.Error;
                case LogType.Assert:
                    return LogLevel.Critical;
                default:
                    return LogLevel.Info;
            }
        }
    }

    /// <summary>
    /// Unity log handler that forwards logs to AI Logger
    /// </summary>
    public class UnityAILogHandler : ILogHandler
    {
        private readonly UnityAILogger logger;
        private readonly ILogHandler defaultLogHandler;

        /// <summary>
        /// Create a new Unity AI log handler
        /// </summary>
        /// <param name="logger">AI Logger to forward logs to</param>
        /// <param name="defaultLogHandler">Default log handler to forward logs to</param>
        public UnityAILogHandler(UnityAILogger logger, ILogHandler defaultLogHandler)
        {
            this.logger = logger;
            this.defaultLogHandler = defaultLogHandler;
        }

        /// <summary>
        /// Log a message
        /// </summary>
        /// <param name="logType">Log type</param>
        /// <param name="context">Log context</param>
        /// <param name="format">Message format</param>
        /// <param name="args">Message arguments</param>
        public void LogFormat(LogType logType, UnityEngine.Object context, string format, params object[] args)
        {
            defaultLogHandler.LogFormat(logType, context, format, args);
            logger.LogUnityMessage(logType, string.Format(format, args), context);
        }

        /// <summary>
        /// Log an exception
        /// </summary>
        /// <param name="exception">Exception to log</param>
        /// <param name="context">Log context</param>
        public void LogException(Exception exception, UnityEngine.Object context)
        {
            defaultLogHandler.LogException(exception, context);
            logger.LogException(exception);
        }
    }

    /// <summary>
    /// Unity AI Logger extensions
    /// </summary>
    public static class UnityAILoggerExtensions
    {
        /// <summary>
        /// Intercept Unity logs and forward them to AI Logger
        /// </summary>
        /// <param name="logger">AI Logger to forward logs to</param>
        public static void InterceptUnityLogs(this UnityAILogger logger)
        {
            var defaultLogger = Debug.unityLogger;
            var defaultLogHandler = defaultLogger.logHandler;
            defaultLogger.logHandler = new UnityAILogHandler(logger, defaultLogHandler);
        }
    }
}
#endif
