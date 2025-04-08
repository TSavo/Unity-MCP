using System;
using System.Collections.Generic;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Command that executes multiple commands in sequence
    /// </summary>
    public class CompositeCommand : CommandBase
    {
        private readonly List<ICommand> _commands;
        
        /// <summary>
        /// Create a new CompositeCommand
        /// </summary>
        /// <param name="commands">The commands to execute</param>
        /// <param name="resultVariableName">The variable name to store the result in, if any</param>
        public CompositeCommand(List<ICommand> commands, string resultVariableName = null)
            : base(resultVariableName)
        {
            _commands = commands;
        }
        
        /// <summary>
        /// Execute the command and return the result
        /// </summary>
        /// <param name="context">The command context</param>
        /// <returns>The result of the command execution</returns>
        public override object Execute(CommandContext context)
        {
            // Execute each command in sequence
            object result = null;
            
            foreach (var command in _commands)
            {
                // Execute the command
                result = command.Execute(context);
                
                // Log the result
                Debug.Log($"[Unity MCP] Command executed. Result: {result}");
            }
            
            // Store the result in the context if a variable name was provided
            if (!string.IsNullOrEmpty(ResultVariableName))
            {
                context.SetVariable(ResultVariableName, result);
            }
            
            // Return the result of the last command
            return result;
        }
    }
}
