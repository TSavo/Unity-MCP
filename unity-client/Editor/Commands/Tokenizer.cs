using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;

namespace UnityMCP.Client.Editor.Commands
{
    /// <summary>
    /// Token types for the tokenizer
    /// </summary>
    public enum TokenType
    {
        Identifier,
        String,
        Number,
        Operator,
        Punctuation,
        Keyword,
        EndOfStatement,
        EndOfFile
    }
    
    /// <summary>
    /// Token for the tokenizer
    /// </summary>
    public class Token
    {
        /// <summary>
        /// The token type
        /// </summary>
        public TokenType Type { get; }
        
        /// <summary>
        /// The token value
        /// </summary>
        public string Value { get; }
        
        /// <summary>
        /// Create a new Token
        /// </summary>
        /// <param name="type">The token type</param>
        /// <param name="value">The token value</param>
        public Token(TokenType type, string value)
        {
            Type = type;
            Value = value;
        }
        
        /// <summary>
        /// Convert the token to a string
        /// </summary>
        /// <returns>A string representation of the token</returns>
        public override string ToString()
        {
            return $"{Type}: {Value}";
        }
    }
    
    /// <summary>
    /// Tokenizer for parsing code
    /// </summary>
    public class Tokenizer
    {
        private readonly string _code;
        private int _position;
        private readonly List<Token> _tokens = new List<Token>();
        
        // Keywords
        private static readonly HashSet<string> Keywords = new HashSet<string>
        {
            "var", "new", "true", "false", "null", "if", "else", "for", "while", "return"
        };
        
        /// <summary>
        /// Create a new Tokenizer
        /// </summary>
        /// <param name="code">The code to tokenize</param>
        public Tokenizer(string code)
        {
            _code = code;
            _position = 0;
        }
        
        /// <summary>
        /// Tokenize the code
        /// </summary>
        /// <returns>A list of tokens</returns>
        public List<Token> Tokenize()
        {
            _tokens.Clear();
            _position = 0;
            
            while (_position < _code.Length)
            {
                char c = _code[_position];
                
                // Skip whitespace
                if (char.IsWhiteSpace(c))
                {
                    _position++;
                    continue;
                }
                
                // Identifiers and keywords
                if (char.IsLetter(c) || c == '_')
                {
                    TokenizeIdentifierOrKeyword();
                    continue;
                }
                
                // Numbers
                if (char.IsDigit(c))
                {
                    TokenizeNumber();
                    continue;
                }
                
                // Strings
                if (c == '\"')
                {
                    TokenizeString();
                    continue;
                }
                
                // Comments
                if (c == '/' && _position + 1 < _code.Length)
                {
                    if (_code[_position + 1] == '/')
                    {
                        // Single-line comment
                        _position += 2;
                        while (_position < _code.Length && _code[_position] != '\\n')
                        {
                            _position++;
                        }
                        continue;
                    }
                    else if (_code[_position + 1] == '*')
                    {
                        // Multi-line comment
                        _position += 2;
                        while (_position + 1 < _code.Length && !(_code[_position] == '*' && _code[_position + 1] == '/'))
                        {
                            _position++;
                        }
                        _position += 2;
                        continue;
                    }
                }
                
                // Operators
                if (IsOperator(c))
                {
                    TokenizeOperator();
                    continue;
                }
                
                // Punctuation
                if (IsPunctuation(c))
                {
                    TokenizePunctuation();
                    continue;
                }
                
                // End of statement
                if (c == ';')
                {
                    _tokens.Add(new Token(TokenType.EndOfStatement, ";"));
                    _position++;
                    continue;
                }
                
                // Unknown character
                Debug.LogWarning($"[Unity MCP] Unknown character: {c}");
                _position++;
            }
            
            // Add end of file token
            _tokens.Add(new Token(TokenType.EndOfFile, ""));
            
            return _tokens;
        }
        
        /// <summary>
        /// Tokenize an identifier or keyword
        /// </summary>
        private void TokenizeIdentifierOrKeyword()
        {
            int start = _position;
            
            while (_position < _code.Length && (char.IsLetterOrDigit(_code[_position]) || _code[_position] == '_'))
            {
                _position++;
            }
            
            string value = _code.Substring(start, _position - start);
            
            if (Keywords.Contains(value))
            {
                _tokens.Add(new Token(TokenType.Keyword, value));
            }
            else
            {
                _tokens.Add(new Token(TokenType.Identifier, value));
            }
        }
        
        /// <summary>
        /// Tokenize a number
        /// </summary>
        private void TokenizeNumber()
        {
            int start = _position;
            
            while (_position < _code.Length && (char.IsDigit(_code[_position]) || _code[_position] == '.'))
            {
                _position++;
            }
            
            string value = _code.Substring(start, _position - start);
            
            _tokens.Add(new Token(TokenType.Number, value));
        }
        
        /// <summary>
        /// Tokenize a string
        /// </summary>
        private void TokenizeString()
        {
            int start = _position;
            
            // Skip the opening quote
            _position++;
            
            while (_position < _code.Length && _code[_position] != '\"')
            {
                // Handle escape sequences
                if (_code[_position] == '\\' && _position + 1 < _code.Length)
                {
                    _position += 2;
                }
                else
                {
                    _position++;
                }
            }
            
            // Skip the closing quote
            if (_position < _code.Length)
            {
                _position++;
            }
            
            string value = _code.Substring(start, _position - start);
            
            _tokens.Add(new Token(TokenType.String, value));
        }
        
        /// <summary>
        /// Tokenize an operator
        /// </summary>
        private void TokenizeOperator()
        {
            int start = _position;
            
            while (_position < _code.Length && IsOperator(_code[_position]))
            {
                _position++;
            }
            
            string value = _code.Substring(start, _position - start);
            
            _tokens.Add(new Token(TokenType.Operator, value));
        }
        
        /// <summary>
        /// Tokenize punctuation
        /// </summary>
        private void TokenizePunctuation()
        {
            char c = _code[_position];
            
            _tokens.Add(new Token(TokenType.Punctuation, c.ToString()));
            _position++;
        }
        
        /// <summary>
        /// Check if a character is an operator
        /// </summary>
        /// <param name="c">The character to check</param>
        /// <returns>True if the character is an operator, false otherwise</returns>
        private bool IsOperator(char c)
        {
            return c == '+' || c == '-' || c == '*' || c == '/' || c == '%' || c == '=' || c == '!' || c == '<' || c == '>' || c == '&' || c == '|' || c == '^' || c == '~';
        }
        
        /// <summary>
        /// Check if a character is punctuation
        /// </summary>
        /// <param name="c">The character to check</param>
        /// <returns>True if the character is punctuation, false otherwise</returns>
        private bool IsPunctuation(char c)
        {
            return c == '(' || c == ')' || c == '[' || c == ']' || c == '{' || c == '}' || c == '.' || c == ',' || c == ':' || c == '?';
        }
    }
}
