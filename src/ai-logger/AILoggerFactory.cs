using System;
using System.Collections.Generic;

namespace AI.Logging
{
    /// <summary>
    /// Factory for creating AI Loggers
    /// </summary>
    public static class AILoggerFactory
    {
        private static readonly Dictionary<string, AILogger> loggers = new Dictionary<string, AILogger>();
        private static AILoggerConfig defaultConfig;

        /// <summary>
        /// Configure the default logger configuration
        /// </summary>
        /// <param name="config">Default configuration</param>
        public static void Configure(AILoggerConfig config)
        {
            defaultConfig = config;
        }

        /// <summary>
        /// Get or create a logger with the specified name
        /// </summary>
        /// <param name="name">Logger name</param>
        /// <returns>Logger with the specified name</returns>
        public static AILogger GetLogger(string name)
        {
            if (loggers.TryGetValue(name, out var logger))
            {
                return logger;
            }

            logger = new AILogger(name, defaultConfig);
            loggers[name] = logger;
            return logger;
        }

        /// <summary>
        /// Get or create a logger for the specified type
        /// </summary>
        /// <param name="type">Type to create logger for</param>
        /// <returns>Logger for the specified type</returns>
        public static AILogger GetLogger(Type type)
        {
            return GetLogger(type.FullName);
        }

        /// <summary>
        /// Get or create a logger for the specified type
        /// </summary>
        /// <typeparam name="T">Type to create logger for</typeparam>
        /// <returns>Logger for the specified type</returns>
        public static AILogger GetLogger<T>()
        {
            return GetLogger(typeof(T));
        }

#if UNITY_2018_1_OR_NEWER
        /// <summary>
        /// Get or create a Unity logger for the specified MonoBehaviour
        /// </summary>
        /// <param name="monoBehaviour">MonoBehaviour to create logger for</param>
        /// <returns>Unity logger for the specified MonoBehaviour</returns>
        public static Unity.UnityAILogger GetUnityLogger(UnityEngine.MonoBehaviour monoBehaviour)
        {
            return Unity.UnityAILogger.ForMonoBehaviour(monoBehaviour, defaultConfig);
        }
#endif
    }
}
