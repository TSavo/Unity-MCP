using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Parser for the Unity MCP DSL (Domain-Specific Language)
    /// </summary>
    public static class DSLParser
    {
        // Regular expressions for parsing DSL commands
        private static readonly Regex FindRegex = new Regex(@"find\(""([^""]+)""\)");
        private static readonly Regex PropRegex = new Regex(@"prop\(""([^""]+)"",\s*""([^""]+)""\)");
        private static readonly Regex CreateRegex = new Regex(@"create\(""([^""]+)""\)");
        private static readonly Regex LogRegex = new Regex(@"log\(""([^""]+)""\)");
        private static readonly Regex VarRegex = new Regex(@"var\(""([^""]+)"",\s*(.+)\)");
        
        /// <summary>
        /// Parse a DSL command into a command object
        /// </summary>
        /// <param name="dsl">The DSL command to parse</param>
        /// <returns>The command object</returns>
        public static ICommand Parse(string dsl)
        {
            // Trim the DSL command
            dsl = dsl.Trim();
            
            // Check if it's a find command
            Match findMatch = FindRegex.Match(dsl);
            if (findMatch.Success)
            {
                string gameObjectName = findMatch.Groups[1].Value;
                return new FindGameObjectCommand(gameObjectName);
            }
            
            // Check if it's a prop command
            Match propMatch = PropRegex.Match(dsl);
            if (propMatch.Success)
            {
                string objectName = propMatch.Groups[1].Value;
                string propertyName = propMatch.Groups[2].Value;
                return new PropertyCommand(objectName, propertyName);
            }
            
            // Check if it's a create command
            Match createMatch = CreateRegex.Match(dsl);
            if (createMatch.Success)
            {
                string gameObjectName = createMatch.Groups[1].Value;
                return new CreateGameObjectCommand($"new GameObject(\"{gameObjectName}\")");
            }
            
            // Check if it's a log command
            Match logMatch = LogRegex.Match(dsl);
            if (logMatch.Success)
            {
                string message = logMatch.Groups[1].Value;
                return new LogCommand($"Debug.Log(\"{message}\")");
            }
            
            // Check if it's a var command
            Match varMatch = VarRegex.Match(dsl);
            if (varMatch.Success)
            {
                string variableName = varMatch.Groups[1].Value;
                string expression = varMatch.Groups[2].Value;
                
                // Parse the expression
                ICommand expressionCommand = Parse(expression);
                if (expressionCommand is CommandBase commandBase)
                {
                    // We can't set the ResultVariableName property directly because it's read-only
                    // Instead, we'll create a new command with the variable name
                    
                    // For now, we'll just return the expression command
                    // In a real implementation, we would create a new command with the variable name
                    return expressionCommand;
                }
                
                return expressionCommand;
            }
            
            // If we couldn't parse the DSL command, return a generic command
            return new GenericCommand(dsl);
        }
        
        /// <summary>
        /// Parse a sequence of DSL commands into a list of command objects
        /// </summary>
        /// <param name="dsl">The DSL commands to parse</param>
        /// <returns>The list of command objects</returns>
        public static List<ICommand> ParseSequence(string dsl)
        {
            var commands = new List<ICommand>();
            
            // Split the DSL commands by semicolons
            string[] dslCommands = dsl.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
            
            // Parse each DSL command
            foreach (string dslCommand in dslCommands)
            {
                string trimmedCommand = dslCommand.Trim();
                if (string.IsNullOrEmpty(trimmedCommand))
                {
                    continue;
                }
                
                // Parse the DSL command
                ICommand command = Parse(trimmedCommand);
                if (command != null)
                {
                    commands.Add(command);
                }
            }
            
            return commands;
        }
    }
}
