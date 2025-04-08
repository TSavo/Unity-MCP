using System;
using System.Collections.Generic;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Context for executing commands, storing results from previous commands
    /// </summary>
    public class CommandContext
    {
        private readonly Dictionary<string, object> _variables = new Dictionary<string, object>();
        
        /// <summary>
        /// Set a variable in the context
        /// </summary>
        /// <param name="name">The variable name</param>
        /// <param name="value">The variable value</param>
        public void SetVariable(string name, object value)
        {
            _variables[name] = value;
            Debug.Log($"[Unity MCP] Set variable '{name}' to '{value}'");
        }
        
        /// <summary>
        /// Get a variable from the context
        /// </summary>
        /// <param name="name">The variable name</param>
        /// <returns>The variable value, or null if not found</returns>
        public object GetVariable(string name)
        {
            if (_variables.TryGetValue(name, out object value))
            {
                return value;
            }
            
            Debug.LogWarning($"[Unity MCP] Variable '{name}' not found in context");
            return null;
        }
        
        /// <summary>
        /// Check if a variable exists in the context
        /// </summary>
        /// <param name="name">The variable name</param>
        /// <returns>True if the variable exists, false otherwise</returns>
        public bool HasVariable(string name)
        {
            return _variables.ContainsKey(name);
        }
        
        /// <summary>
        /// Clear all variables from the context
        /// </summary>
        public void Clear()
        {
            _variables.Clear();
            Debug.Log("[Unity MCP] Cleared command context");
        }
    }
}
