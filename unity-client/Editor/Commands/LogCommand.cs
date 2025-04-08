using System;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Command for logging a message
    /// </summary>
    public class LogCommand : CommandBase
    {
        private readonly string _code;
        
        /// <summary>
        /// Create a new LogCommand
        /// </summary>
        /// <param name="code">The code to execute</param>
        public LogCommand(string code)
        {
            _code = code;
        }
        
        /// <summary>
        /// Execute the command and return the result
        /// </summary>
        /// <returns>The result of the command execution</returns>
        public override object Execute()
        {
            // This is a simple implementation that logs a message
            // In a real implementation, you would parse the code to extract the message
            
            // For now, we'll just log a default message
            string message = "Command executed";
            
            // Try to extract the message from the code
            int startIndex = _code.IndexOf("Debug.Log(");
            if (startIndex >= 0)
            {
                startIndex += "Debug.Log(".Length;
                int endIndex = _code.IndexOf(")", startIndex);
                if (endIndex >= 0)
                {
                    message = _code.Substring(startIndex, endIndex - startIndex).Trim();
                    
                    // Remove quotes if present
                    if (message.StartsWith("\"") && message.EndsWith("\""))
                    {
                        message = message.Substring(1, message.Length - 2);
                    }
                }
            }
            
            // Log the message
            Debug.Log($"[Unity MCP] {message}");
            
            // Return the message
            return message;
        }
    }
}
