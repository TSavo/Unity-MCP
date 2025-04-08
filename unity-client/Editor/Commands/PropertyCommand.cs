using System;
using System.Reflection;
using UnityEngine;
using UnityMCP.Client.Editor.Logging;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Command for getting a property of an object
    /// </summary>
    public class PropertyCommand : CommandBase
    {
        private readonly string _objectVariableName;
        private readonly string _propertyName;

        /// <summary>
        /// Create a new PropertyCommand
        /// </summary>
        /// <param name="objectVariableName">The variable name of the object to get the property from</param>
        /// <param name="propertyName">The name of the property to get</param>
        /// <param name="resultVariableName">The variable name to store the result in, if any</param>
        public PropertyCommand(string objectVariableName, string propertyName, string resultVariableName = null)
            : base(resultVariableName)
        {
            _objectVariableName = objectVariableName;
            _propertyName = propertyName;
        }

        /// <summary>
        /// Execute the command and return the result
        /// </summary>
        /// <param name="context">The command context</param>
        /// <returns>The result of the command execution</returns>
        public override object Execute(CommandContext context)
        {
            // Get the object from the context
            object obj = context.GetVariable(_objectVariableName);
            if (obj == null)
            {
                Debug.LogError($"[Unity MCP] Object '{_objectVariableName}' not found in context");
                return null;
            }

            // Get the property value using reflection
            try
            {
                // Get the property info
                PropertyInfo propertyInfo = obj.GetType().GetProperty(_propertyName);
                if (propertyInfo == null)
                {
                    // Try to get it as a field
                    FieldInfo fieldInfo = obj.GetType().GetField(_propertyName);
                    if (fieldInfo == null)
                    {
                        Debug.LogError($"[Unity MCP] Property or field '{_propertyName}' not found on object '{_objectVariableName}'");
                        return null;
                    }

                    // Get the field value
                    object result = fieldInfo.GetValue(obj);

                    // Log the result
                    Debug.Log($"[Unity MCP] Got field '{_propertyName}' from object '{_objectVariableName}': {result}");

                    // Store the result in the context if a variable name was provided
                    if (!string.IsNullOrEmpty(ResultVariableName))
                    {
                        context.SetVariable(ResultVariableName, result);
                    }

                    // Return the result
                    return result;
                }

                // Get the property value
                object propertyValue = propertyInfo.GetValue(obj);

                // Log the result
                Debug.Log($"[Unity MCP] Got property '{_propertyName}' from object '{_objectVariableName}': {propertyValue}");
                Logging.AILoggerStatic.Log("unity-property-result", new { property = _propertyName, value = propertyValue?.ToString() });

                // Store the result in the context if a variable name was provided
                if (!string.IsNullOrEmpty(ResultVariableName))
                {
                    context.SetVariable(ResultVariableName, propertyValue);
                }

                // Return the property value
                return propertyValue;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Unity MCP] Error getting property '{_propertyName}' from object '{_objectVariableName}': {ex.Message}");
                return null;
            }
        }
    }
}
