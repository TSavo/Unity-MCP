using System;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Generic command for executing code that doesn't match any specific command
    /// </summary>
    public class GenericCommand : CommandBase
    {
        private readonly string _code;

        /// <summary>
        /// Create a new GenericCommand
        /// </summary>
        /// <param name="code">The code to execute</param>
        /// <param name="resultVariableName">The variable name to store the result in, if any</param>
        public GenericCommand(string code, string resultVariableName = null)
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
            // This is a simple implementation that just returns the code
            // In a real implementation, you would parse the code and execute it safely

            // Log the code
            Debug.Log($"[Unity MCP] Executing generic command: {_code}");

            // Store the result in the context if a variable name was provided
            if (!string.IsNullOrEmpty(ResultVariableName))
            {
                context.SetVariable(ResultVariableName, _code);
            }

            // Return the code itself
            return _code;
        }
    }
}
