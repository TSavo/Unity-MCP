using System;
using System.Collections.Generic;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Parser for converting tokens into commands
    /// </summary>
    public class Parser
    {
        private readonly List<Token> _tokens;
        private int _position;
        
        /// <summary>
        /// Create a new Parser
        /// </summary>
        /// <param name="tokens">The tokens to parse</param>
        public Parser(List<Token> tokens)
        {
            _tokens = tokens;
            _position = 0;
        }
        
        /// <summary>
        /// Parse the tokens into a list of commands
        /// </summary>
        /// <returns>A list of commands</returns>
        public List<ICommand> Parse()
        {
            var commands = new List<ICommand>();
            
            while (_position < _tokens.Count && _tokens[_position].Type != TokenType.EndOfFile)
            {
                ICommand command = ParseStatement();
                if (command != null)
                {
                    commands.Add(command);
                }
                
                // Skip end of statement tokens
                if (_position < _tokens.Count && _tokens[_position].Type == TokenType.EndOfStatement)
                {
                    _position++;
                }
            }
            
            return commands;
        }
        
        /// <summary>
        /// Parse a statement
        /// </summary>
        /// <returns>A command</returns>
        private ICommand ParseStatement()
        {
            // Check if it's a variable declaration
            if (_position < _tokens.Count && _tokens[_position].Type == TokenType.Keyword && _tokens[_position].Value == "var")
            {
                return ParseVariableDeclaration();
            }
            
            // Otherwise, it's an expression
            return ParseExpression();
        }
        
        /// <summary>
        /// Parse a variable declaration
        /// </summary>
        /// <returns>A command</returns>
        private ICommand ParseVariableDeclaration()
        {
            // Skip the 'var' keyword
            _position++;
            
            // Get the variable name
            if (_position >= _tokens.Count || _tokens[_position].Type != TokenType.Identifier)
            {
                Debug.LogError("[Unity MCP] Expected identifier after 'var'");
                return null;
            }
            
            string variableName = _tokens[_position].Value;
            _position++;
            
            // Skip the '=' operator
            if (_position >= _tokens.Count || _tokens[_position].Type != TokenType.Operator || _tokens[_position].Value != "=")
            {
                Debug.LogError("[Unity MCP] Expected '=' after variable name");
                return null;
            }
            
            _position++;
            
            // Parse the expression
            ICommand expressionCommand = ParseExpression();
            if (expressionCommand == null)
            {
                return null;
            }
            
            // Set the result variable name
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
        
        /// <summary>
        /// Parse an expression
        /// </summary>
        /// <returns>A command</returns>
        private ICommand ParseExpression()
        {
            // Check if it's a GameObject access
            if (_position + 2 < _tokens.Count &&
                _tokens[_position].Type == TokenType.Identifier && _tokens[_position].Value == "GameObject" &&
                _tokens[_position + 1].Type == TokenType.Punctuation && _tokens[_position + 1].Value == "[")
            {
                return ParseGameObjectAccess();
            }
            
            // Check if it's a Debug.Log
            if (_position + 2 < _tokens.Count &&
                _tokens[_position].Type == TokenType.Identifier && _tokens[_position].Value == "Debug" &&
                _tokens[_position + 1].Type == TokenType.Punctuation && _tokens[_position + 1].Value == "." &&
                _tokens[_position + 2].Type == TokenType.Identifier && _tokens[_position + 2].Value == "Log")
            {
                return ParseDebugLog();
            }
            
            // Check if it's a new GameObject
            if (_position + 2 < _tokens.Count &&
                _tokens[_position].Type == TokenType.Keyword && _tokens[_position].Value == "new" &&
                _tokens[_position + 1].Type == TokenType.Identifier && _tokens[_position + 1].Value == "GameObject")
            {
                return ParseNewGameObject();
            }
            
            // If we couldn't parse the expression, return a generic command
            string expression = "";
            while (_position < _tokens.Count && _tokens[_position].Type != TokenType.EndOfStatement && _tokens[_position].Type != TokenType.EndOfFile)
            {
                expression += _tokens[_position].Value;
                _position++;
            }
            
            return new GenericCommand(expression);
        }
        
        /// <summary>
        /// Parse a GameObject access
        /// </summary>
        /// <returns>A command</returns>
        private ICommand ParseGameObjectAccess()
        {
            // Skip 'GameObject'
            _position++;
            
            // Skip '['
            _position++;
            
            // Get the GameObject name
            if (_position >= _tokens.Count || _tokens[_position].Type != TokenType.String)
            {
                Debug.LogError("[Unity MCP] Expected string literal for GameObject name");
                return null;
            }
            
            string gameObjectName = _tokens[_position].Value;
            
            // Remove the quotes
            gameObjectName = gameObjectName.Substring(1, gameObjectName.Length - 2);
            
            _position++;
            
            // Skip ']'
            if (_position >= _tokens.Count || _tokens[_position].Type != TokenType.Punctuation || _tokens[_position].Value != "]")
            {
                Debug.LogError("[Unity MCP] Expected ']' after GameObject name");
                return null;
            }
            
            _position++;
            
            // Create a temporary variable name for the GameObject
            string tempVariableName = "_temp_" + Guid.NewGuid().ToString("N").Substring(0, 8);
            
            // Create a find command
            var findCommand = new FindGameObjectCommand(gameObjectName, tempVariableName);
            
            // Check if there's a property access
            if (_position < _tokens.Count && _tokens[_position].Type == TokenType.Punctuation && _tokens[_position].Value == ".")
            {
                // Skip '.'
                _position++;
                
                // Get the property name
                if (_position >= _tokens.Count || _tokens[_position].Type != TokenType.Identifier)
                {
                    Debug.LogError("[Unity MCP] Expected identifier for property name");
                    return null;
                }
                
                string propertyName = _tokens[_position].Value;
                _position++;
                
                // Create a property command
                return new PropertyCommand(tempVariableName, propertyName);
            }
            
            return findCommand;
        }
        
        /// <summary>
        /// Parse a Debug.Log
        /// </summary>
        /// <returns>A command</returns>
        private ICommand ParseDebugLog()
        {
            // Skip 'Debug'
            _position++;
            
            // Skip '.'
            _position++;
            
            // Skip 'Log'
            _position++;
            
            // Skip '('
            if (_position >= _tokens.Count || _tokens[_position].Type != TokenType.Punctuation || _tokens[_position].Value != "(")
            {
                Debug.LogError("[Unity MCP] Expected '(' after Debug.Log");
                return null;
            }
            
            _position++;
            
            // Get the message
            string message = "";
            while (_position < _tokens.Count && (_tokens[_position].Type != TokenType.Punctuation || _tokens[_position].Value != ")"))
            {
                message += _tokens[_position].Value;
                _position++;
            }
            
            // Skip ')'
            if (_position >= _tokens.Count || _tokens[_position].Type != TokenType.Punctuation || _tokens[_position].Value != ")")
            {
                Debug.LogError("[Unity MCP] Expected ')' after Debug.Log message");
                return null;
            }
            
            _position++;
            
            // Create a log command
            return new LogCommand($"Debug.Log({message})");
        }
        
        /// <summary>
        /// Parse a new GameObject
        /// </summary>
        /// <returns>A command</returns>
        private ICommand ParseNewGameObject()
        {
            // Skip 'new'
            _position++;
            
            // Skip 'GameObject'
            _position++;
            
            // Skip '('
            if (_position >= _tokens.Count || _tokens[_position].Type != TokenType.Punctuation || _tokens[_position].Value != "(")
            {
                Debug.LogError("[Unity MCP] Expected '(' after new GameObject");
                return null;
            }
            
            _position++;
            
            // Get the parameters
            string parameters = "";
            while (_position < _tokens.Count && (_tokens[_position].Type != TokenType.Punctuation || _tokens[_position].Value != ")"))
            {
                parameters += _tokens[_position].Value;
                _position++;
            }
            
            // Skip ')'
            if (_position >= _tokens.Count || _tokens[_position].Type != TokenType.Punctuation || _tokens[_position].Value != ")")
            {
                Debug.LogError("[Unity MCP] Expected ')' after new GameObject parameters");
                return null;
            }
            
            _position++;
            
            // Create a create GameObject command
            return new CreateGameObjectCommand($"new GameObject({parameters})");
        }
    }
}
