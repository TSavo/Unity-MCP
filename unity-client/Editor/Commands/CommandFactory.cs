using System;
using System.Collections.Generic;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Factory for creating commands from code
    /// </summary>
    public static class CommandFactory
    {
        /// <summary>
        /// Create a command from code
        /// </summary>
        /// <param name="code">The code to parse into a command</param>
        /// <returns>The command to execute</returns>
        public static ICommand CreateCommand(string code)
        {
            // This is a simple implementation that parses the code into a command
            // In a real implementation, you would use a more robust approach
            // like parsing the code with a proper parser
            
            // For now, we'll just handle a few simple cases
            
            // Trim the code
            code = code.Trim();
            
            // Check if it's a create GameObject command
            if (code.Contains("new GameObject") || code.Contains("GameObject.Create"))
            {
                return new CreateGameObjectCommand(code);
            }
            
            // Check if it's a log command
            if (code.Contains("Debug.Log"))
            {
                return new LogCommand(code);
            }
            
            // For other commands, we'll just return a generic command
            return new GenericCommand(code);
        }
    }
}
