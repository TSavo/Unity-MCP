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
        public CreateGameObjectCommand(string code)
        {
            _code = code;
        }
        
        /// <summary>
        /// Execute the command and return the result
        /// </summary>
        /// <returns>The result of the command execution</returns>
        public override object Execute()
        {
            // This is a simple implementation that creates a GameObject
            // In a real implementation, you would parse the code to extract parameters
            
            // For now, we'll just create a GameObject with a default name
            var gameObject = new GameObject("CommandCreatedObject");
            
            // Log the creation
            Debug.Log($"[Unity MCP] Created GameObject: {gameObject.name}");
            
            // Return the GameObject name
            return gameObject.name;
        }
    }
}
