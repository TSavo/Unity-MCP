using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Parser for converting code into commands
    /// </summary>
    public static class CommandParser
    {
        /// <summary>
        /// Parse code into a sequence of commands
        /// </summary>
        /// <param name="code">The code to parse</param>
        /// <returns>A list of commands to execute</returns>
        public static List<ICommand> Parse(string code)
        {
            var commands = new List<ICommand>();

            try
            {
                // Trim the code
                code = code.Trim();

                // Split the code into statements
                string[] statements = code.Split(new[] { ';', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);

                // Parse each statement
                foreach (string statement in statements)
                {
                    string trimmedStatement = statement.Trim();
                    if (string.IsNullOrEmpty(trimmedStatement))
                    {
                        continue;
                    }

                    // Try to parse the statement using the ExpressionParser
                    var parser = new ExpressionParser(trimmedStatement);
                    ICommand command = parser.Parse();
                    if (command != null)
                    {
                        commands.Add(command);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Unity MCP] Error parsing code: {ex.Message}");
                commands.Add(new GenericCommand(code));
            }

            return commands;
        }

        /// <summary>
        /// Parse a single statement into a command
        /// </summary>
        /// <param name="statement">The statement to parse</param>
        /// <returns>The command to execute, or null if the statement couldn't be parsed</returns>
        private static ICommand ParseStatement(string statement)
        {
            // Check if it's a variable assignment
            Match assignmentMatch = Regex.Match(statement, @"^\s*var\s+(\w+)\s*=\s*(.+)$");
            if (assignmentMatch.Success)
            {
                string variableName = assignmentMatch.Groups[1].Value;
                string expression = assignmentMatch.Groups[2].Value;

                // Parse the expression
                return ParseExpression(expression, variableName);
            }

            // Check if it's a property access
            Match propertyMatch = Regex.Match(statement, @"^\s*(\w+)\.(\w+)\s*$");
            if (propertyMatch.Success)
            {
                string objectName = propertyMatch.Groups[1].Value;
                string propertyName = propertyMatch.Groups[2].Value;

                // Create a property command
                return new PropertyCommand(objectName, propertyName);
            }

            // Check if it's a GameObject access
            Match gameObjectMatch = Regex.Match(statement, @"^\s*GameObject\[""([^""]+)""\](.*)$");
            if (gameObjectMatch.Success)
            {
                string gameObjectName = gameObjectMatch.Groups[1].Value;
                string rest = gameObjectMatch.Groups[2].Value;

                // Create a find command
                string resultVariableName = "_temp_" + Guid.NewGuid().ToString("N").Substring(0, 8);
                var findCommand = new FindGameObjectCommand(gameObjectName, resultVariableName);

                // If there's more to the expression, parse it
                if (!string.IsNullOrEmpty(rest))
                {
                    // Check if it's a property access
                    Match restPropertyMatch = Regex.Match(rest, @"^\s*\.(\w+)\s*$");
                    if (restPropertyMatch.Success)
                    {
                        string propertyName = restPropertyMatch.Groups[1].Value;

                        // Create a property command
                        return new PropertyCommand(resultVariableName, propertyName);
                    }
                }

                return findCommand;
            }

            // Check if it's a Debug.Log
            Match logMatch = Regex.Match(statement, @"^\s*Debug\.Log\((.+)\)\s*$");
            if (logMatch.Success)
            {
                string message = logMatch.Groups[1].Value;

                // Create a log command
                return new LogCommand(statement);
            }

            // Check if it's a new GameObject
            Match gameObjectCreateMatch = Regex.Match(statement, @"^\s*new\s+GameObject\((.+)\)\s*$");
            if (gameObjectCreateMatch.Success)
            {
                // Create a create GameObject command
                return new CreateGameObjectCommand(statement);
            }

            // If we couldn't parse the statement, return a generic command
            return new GenericCommand(statement);
        }

        /// <summary>
        /// Parse an expression into a command
        /// </summary>
        /// <param name="expression">The expression to parse</param>
        /// <param name="resultVariableName">The variable name to store the result in, if any</param>
        /// <returns>The command to execute, or null if the expression couldn't be parsed</returns>
        private static ICommand ParseExpression(string expression, string resultVariableName = null)
        {
            // Check if it's a GameObject access
            Match gameObjectMatch = Regex.Match(expression, @"^\s*GameObject\[""([^""]+)""\](.*)$");
            if (gameObjectMatch.Success)
            {
                string gameObjectName = gameObjectMatch.Groups[1].Value;
                string rest = gameObjectMatch.Groups[2].Value;

                // Create a find command
                string tempVariableName = "_temp_" + Guid.NewGuid().ToString("N").Substring(0, 8);
                var findCommand = new FindGameObjectCommand(gameObjectName, string.IsNullOrEmpty(rest) ? resultVariableName : tempVariableName);

                // If there's more to the expression, parse it
                if (!string.IsNullOrEmpty(rest))
                {
                    // Check if it's a property access
                    Match restPropertyMatch = Regex.Match(rest, @"^\s*\.(\w+)\s*$");
                    if (restPropertyMatch.Success)
                    {
                        string propertyName = restPropertyMatch.Groups[1].Value;

                        // Create a property command
                        return new PropertyCommand(tempVariableName, propertyName, resultVariableName);
                    }
                }

                return findCommand;
            }

            // Check if it's a new GameObject
            Match gameObjectCreateMatch = Regex.Match(expression, @"^\s*new\s+GameObject\((.+)\)\s*$");
            if (gameObjectCreateMatch.Success)
            {
                // Create a create GameObject command
                return new CreateGameObjectCommand(expression, resultVariableName);
            }

            // If we couldn't parse the expression, return a generic command
            return new GenericCommand(expression, resultVariableName);
        }
    }
}
