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
        /// <returns>The result of the command execution</returns>
        object Execute();
    }
}
