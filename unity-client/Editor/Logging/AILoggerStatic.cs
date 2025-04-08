using System;
using System.Threading.Tasks;
using UnityEngine;

namespace UnityMCP.Client.Editor.Logging
{
    /// <summary>
    /// Static wrapper for AILogger
    /// </summary>
    public static class AILoggerStatic
    {
        /// <summary>
        /// Log a message
        /// </summary>
        /// <param name="logName">The name of the log</param>
        /// <param name="data">The data to log</param>
        public static void Log(string logName, object data)
        {
            // Log to Unity console
            Debug.Log($"[{logName}] {data}");
            
            // Store the log entry
            UnityMCPEditorExtension.StoreLogEntry(logName, data);
        }
    }
}
