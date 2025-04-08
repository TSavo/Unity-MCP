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
            // Parse the code into a command using the CommandParser
            var commands = CommandParser.Parse(code);

            // If we got multiple commands, create a composite command
            if (commands.Count > 1)
            {
                return new CompositeCommand(commands);
            }

            // If we got a single command, return it
            if (commands.Count == 1)
            {
                return commands[0];
            }

            // If we couldn't parse the code, return a generic command
            return new GenericCommand(code);
        }
    }
}
