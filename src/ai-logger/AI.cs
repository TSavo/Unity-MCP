using System;

namespace AI
{
    /// <summary>
    /// Static API for AI Logger
    /// </summary>
    public static class AI
    {
        /// <summary>
        /// Get or create a logger with the specified name
        /// </summary>
        /// <param name="logName">Logger name</param>
        /// <returns>Logger with the specified name</returns>
        public static Logging.AILogger Log(string logName)
        {
            return Logging.AILoggerFactory.GetLogger(logName);
        }

        /// <summary>
        /// Get or create a logger for the specified type
        /// </summary>
        /// <param name="type">Type to create logger for</param>
        /// <returns>Logger for the specified type</returns>
        public static Logging.AILogger LogForType(Type type)
        {
            return Logging.AILoggerFactory.GetLogger(type);
        }

        /// <summary>
        /// Get or create a logger for the specified type
        /// </summary>
        /// <typeparam name="T">Type to create logger for</typeparam>
        /// <returns>Logger for the specified type</returns>
        public static Logging.AILogger LogForType<T>()
        {
            return Logging.AILoggerFactory.GetLogger<T>();
        }

        /// <summary>
        /// Configure the AI Logger
        /// </summary>
        /// <param name="config">Logger configuration</param>
        public static void Configure(Logging.AILoggerConfig config)
        {
            Logging.AILoggerFactory.Configure(config);
        }

#if UNITY_2018_1_OR_NEWER
        /// <summary>
        /// Get or create a Unity logger for the specified MonoBehaviour
        /// </summary>
        /// <param name="monoBehaviour">MonoBehaviour to create logger for</param>
        /// <returns>Unity logger for the specified MonoBehaviour</returns>
        public static Logging.Unity.UnityAILogger LogForBehaviour(UnityEngine.MonoBehaviour monoBehaviour)
        {
            return Logging.AILoggerFactory.GetUnityLogger(monoBehaviour);
        }
#endif
    }
}
