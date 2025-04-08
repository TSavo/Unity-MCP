using System;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Interface for all commands that can be executed in the Unity Editor
    /// </summary>
    public interface ICommand
    {
        /// <summary>
        /// Execute the command and return the result
        /// </summary>
        /// <param name="context">The command context</param>
        /// <returns>The result of the command execution</returns>
        object Execute(CommandContext context);

        /// <summary>
        /// Get the variable name to store the result in, if any
        /// </summary>
        string ResultVariableName { get; }
    }
}
