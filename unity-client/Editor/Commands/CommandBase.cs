using System;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Base class for all commands
    /// </summary>
    public abstract class CommandBase : ICommand
    {
        private readonly string _resultVariableName;

        /// <summary>
        /// Create a new CommandBase
        /// </summary>
        /// <param name="resultVariableName">The variable name to store the result in, if any</param>
        protected CommandBase(string resultVariableName = null)
        {
            _resultVariableName = resultVariableName;
        }

        /// <summary>
        /// Get the variable name to store the result in, if any
        /// </summary>
        public string ResultVariableName => _resultVariableName;

        /// <summary>
        /// Execute the command and return the result
        /// </summary>
        /// <param name="context">The command context</param>
        /// <returns>The result of the command execution</returns>
        public abstract object Execute(CommandContext context);

        /// <summary>
        /// Convert the result to a string representation
        /// </summary>
        /// <param name="result">The result to convert</param>
        /// <returns>A string representation of the result</returns>
        protected string ResultToString(object result)
        {
            if (result == null)
            {
                return "null";
            }

            return result.ToString();
        }

        /// <summary>
        /// Store the result in the context if a variable name was provided
        /// </summary>
        /// <param name="context">The command context</param>
        /// <param name="result">The result to store</param>
        protected void StoreResult(CommandContext context, object result)
        {
            if (!string.IsNullOrEmpty(_resultVariableName))
            {
                context.SetVariable(_resultVariableName, result);
            }
        }
    }
}
