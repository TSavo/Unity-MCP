using System;
using UnityEngine;
using UnityMCP.Client.Editor.Logging;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Command for finding a GameObject by name
    /// </summary>
    public class FindGameObjectCommand : CommandBase
    {
        private readonly string _gameObjectName;

        /// <summary>
        /// Create a new FindGameObjectCommand
        /// </summary>
        /// <param name="gameObjectName">The name of the GameObject to find</param>
        /// <param name="resultVariableName">The variable name to store the result in, if any</param>
        public FindGameObjectCommand(string gameObjectName, string resultVariableName = null)
            : base(resultVariableName)
        {
            _gameObjectName = gameObjectName;
        }

        /// <summary>
        /// Execute the command and return the result
        /// </summary>
        /// <param name="context">The command context</param>
        /// <returns>The result of the command execution</returns>
        public override object Execute(CommandContext context)
        {
            // Find the GameObject by name
            GameObject gameObject = GameObject.Find(_gameObjectName);

            // Log the result
            if (gameObject != null)
            {
                Debug.Log($"[Unity MCP] Found GameObject: {gameObject.name}");
                Logging.AILoggerStatic.Log("unity-find-result", new { gameObject = gameObject.name });
            }
            else
            {
                Debug.LogWarning($"[Unity MCP] GameObject '{_gameObjectName}' not found");
                Logging.AILoggerStatic.Log("unity-find-result", new { error = $"GameObject '{_gameObjectName}' not found" });
            }

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
