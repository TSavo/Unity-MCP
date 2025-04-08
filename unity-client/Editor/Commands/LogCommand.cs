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
        /// <param name="resultVariableName">The variable name to store the result in, if any</param>
        public LogCommand(string code, string resultVariableName = null)
            : base(resultVariableName)
        {
            _code = code;
        }

        /// <summary>
        /// Execute the command and return the result
        /// </summary>
        /// <param name="context">The command context</param>
        /// <returns>The result of the command execution</returns>
        public override object Execute(CommandContext context)
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

            // Store the result in the context if a variable name was provided
            if (!string.IsNullOrEmpty(ResultVariableName))
            {
                context.SetVariable(ResultVariableName, message);
            }

            // Return the message
            return message;
        }
    }
}
