using System;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Base class for all commands
    /// </summary>
    public abstract class CommandBase : ICommand
    {
        /// <summary>
        /// Execute the command and return the result
        /// </summary>
        /// <returns>The result of the command execution</returns>
        public abstract object Execute();
        
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
    }
}
