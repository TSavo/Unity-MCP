using System;
using AI.Logging;

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
        public static AILogger Log(string logName)
        {
            return new AILogger(logName);
        }
    }
}
