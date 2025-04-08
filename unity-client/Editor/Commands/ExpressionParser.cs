using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Parser for expressions like find("objectName").propertyName
    /// </summary>
    public class ExpressionParser
    {
        private readonly string _expression;
        private int _position;
        
        /// <summary>
        /// Create a new ExpressionParser
        /// </summary>
        /// <param name="expression">The expression to parse</param>
        public ExpressionParser(string expression)
        {
            _expression = expression;
            _position = 0;
        }
        
        /// <summary>
        /// Parse the expression into a command
        /// </summary>
        /// <returns>The command to execute</returns>
        public ICommand Parse()
        {
            try
            {
                // Parse the primary expression
                ICommand command = ParsePrimary();
                
                // Parse any property accesses
                while (_position < _expression.Length && _expression[_position] == '.')
                {
                    // Skip the '.'
                    _position++;
                    
                    // Parse the property name
                    string propertyName = ParseIdentifier();
                    
                    // Create a temporary variable name for the result of the previous command
                    string tempVariableName = "_temp_" + Guid.NewGuid().ToString("N").Substring(0, 8);
                    
                    // Set the result variable name for the previous command
                    if (command is CommandBase commandBase)
                    {
                        // We can't set the ResultVariableName property directly because it's read-only
                        // Instead, we'll create a new property command that references the result
                        command = new PropertyCommand(tempVariableName, propertyName);
                    }
                }
                
                return command;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Unity MCP] Error parsing expression: {ex.Message}");
                return new GenericCommand(_expression);
            }
        }
        
        /// <summary>
        /// Parse a primary expression
        /// </summary>
        /// <returns>The command to execute</returns>
        private ICommand ParsePrimary()
        {
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position >= _expression.Length)
            {
                throw new Exception("Unexpected end of expression");
            }
            
            // Check if it's a find expression
            if (_position + 4 < _expression.Length && _expression.Substring(_position, 4) == "find")
            {
                return ParseFind();
            }
            
            // Check if it's a new GameObject expression
            if (_position + 3 < _expression.Length && _expression.Substring(_position, 3) == "new")
            {
                return ParseNewGameObject();
            }
            
            // Check if it's a Debug.Log expression
            if (_position + 9 < _expression.Length && _expression.Substring(_position, 9) == "Debug.Log")
            {
                return ParseDebugLog();
            }
            
            // If we couldn't parse the primary expression, return a generic command
            return new GenericCommand(_expression);
        }
        
        /// <summary>
        /// Parse a find expression
        /// </summary>
        /// <returns>The command to execute</returns>
        private ICommand ParseFind()
        {
            // Skip 'find'
            _position += 4;
            
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position >= _expression.Length || _expression[_position] != '(')
            {
                throw new Exception("Expected '(' after 'find'");
            }
            
            // Skip '('
            _position++;
            
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position >= _expression.Length || _expression[_position] != '\"')
            {
                throw new Exception("Expected string literal for GameObject name");
            }
            
            // Parse the string literal
            string gameObjectName = ParseStringLiteral();
            
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position >= _expression.Length || _expression[_position] != ')')
            {
                throw new Exception("Expected ')' after GameObject name");
            }
            
            // Skip ')'
            _position++;
            
            // Create a find command
            return new FindGameObjectCommand(gameObjectName);
        }
        
        /// <summary>
        /// Parse a new GameObject expression
        /// </summary>
        /// <returns>The command to execute</returns>
        private ICommand ParseNewGameObject()
        {
            // Skip 'new'
            _position += 3;
            
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position + 10 >= _expression.Length || _expression.Substring(_position, 10) != "GameObject")
            {
                throw new Exception("Expected 'GameObject' after 'new'");
            }
            
            // Skip 'GameObject'
            _position += 10;
            
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position >= _expression.Length || _expression[_position] != '(')
            {
                throw new Exception("Expected '(' after 'GameObject'");
            }
            
            // Skip '('
            _position++;
            
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position >= _expression.Length)
            {
                throw new Exception("Unexpected end of expression");
            }
            
            // Parse the parameters
            string parameters = "";
            if (_expression[_position] == '\"')
            {
                // Parse the string literal
                parameters = ParseStringLiteral();
            }
            else
            {
                // Parse until ')'
                int start = _position;
                while (_position < _expression.Length && _expression[_position] != ')')
                {
                    _position++;
                }
                parameters = _expression.Substring(start, _position - start);
            }
            
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position >= _expression.Length || _expression[_position] != ')')
            {
                throw new Exception("Expected ')' after GameObject parameters");
            }
            
            // Skip ')'
            _position++;
            
            // Create a create GameObject command
            return new CreateGameObjectCommand($"new GameObject({parameters})");
        }
        
        /// <summary>
        /// Parse a Debug.Log expression
        /// </summary>
        /// <returns>The command to execute</returns>
        private ICommand ParseDebugLog()
        {
            // Skip 'Debug.Log'
            _position += 9;
            
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position >= _expression.Length || _expression[_position] != '(')
            {
                throw new Exception("Expected '(' after 'Debug.Log'");
            }
            
            // Skip '('
            _position++;
            
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position >= _expression.Length)
            {
                throw new Exception("Unexpected end of expression");
            }
            
            // Parse the message
            string message = "";
            if (_expression[_position] == '\"')
            {
                // Parse the string literal
                message = ParseStringLiteral();
            }
            else
            {
                // Parse until ')'
                int start = _position;
                while (_position < _expression.Length && _expression[_position] != ')')
                {
                    _position++;
                }
                message = _expression.Substring(start, _position - start);
            }
            
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position >= _expression.Length || _expression[_position] != ')')
            {
                throw new Exception("Expected ')' after Debug.Log message");
            }
            
            // Skip ')'
            _position++;
            
            // Create a log command
            return new LogCommand($"Debug.Log({message})");
        }
        
        /// <summary>
        /// Parse a string literal
        /// </summary>
        /// <returns>The string literal</returns>
        private string ParseStringLiteral()
        {
            // Skip the opening quote
            _position++;
            
            // Parse until the closing quote
            int start = _position;
            while (_position < _expression.Length && _expression[_position] != '\"')
            {
                // Handle escape sequences
                if (_expression[_position] == '\\' && _position + 1 < _expression.Length)
                {
                    _position += 2;
                }
                else
                {
                    _position++;
                }
            }
            
            // Get the string literal
            string stringLiteral = _expression.Substring(start, _position - start);
            
            // Skip the closing quote
            if (_position < _expression.Length)
            {
                _position++;
            }
            
            return stringLiteral;
        }
        
        /// <summary>
        /// Parse an identifier
        /// </summary>
        /// <returns>The identifier</returns>
        private string ParseIdentifier()
        {
            // Skip whitespace
            SkipWhitespace();
            
            // Check if we're at the end of the expression
            if (_position >= _expression.Length)
            {
                throw new Exception("Unexpected end of expression");
            }
            
            // Check if it's a valid identifier start
            if (!char.IsLetter(_expression[_position]) && _expression[_position] != '_')
            {
                throw new Exception($"Expected identifier, got '{_expression[_position]}'");
            }
            
            // Parse the identifier
            int start = _position;
            while (_position < _expression.Length && (char.IsLetterOrDigit(_expression[_position]) || _expression[_position] == '_'))
            {
                _position++;
            }
            
            return _expression.Substring(start, _position - start);
        }
        
        /// <summary>
        /// Skip whitespace
        /// </summary>
        private void SkipWhitespace()
        {
            while (_position < _expression.Length && char.IsWhiteSpace(_expression[_position]))
            {
                _position++;
            }
        }
    }
}
