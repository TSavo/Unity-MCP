using System;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Command for creating a GameObject
    /// </summary>
    public class CreateGameObjectCommand : CommandBase
    {
        private readonly string _code;

        /// <summary>
        /// Create a new CreateGameObjectCommand
        /// </summary>
        /// <param name="code">The code to execute</param>
        /// <param name="resultVariableName">The variable name to store the result in, if any</param>
        public CreateGameObjectCommand(string code, string resultVariableName = null)
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
            // This is a simple implementation that creates a GameObject
            // In a real implementation, you would parse the code to extract parameters

            // For now, we'll just create a GameObject with a default name
            var gameObject = new GameObject("CommandCreatedObject");

            // Log the creation
            Debug.Log($"[Unity MCP] Created GameObject: {gameObject.name}");
            AILogger.Log("unity-create-result", new { gameObject = gameObject.name });

            // Store the result in the context if a variable name was provided
            if (!string.IsNullOrEmpty(ResultVariableName))
            {
                context.SetVariable(ResultVariableName, gameObject);
            }

            // Return the GameObject
            return gameObject;
        }
    }
}
