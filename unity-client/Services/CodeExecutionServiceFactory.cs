using UnityMCP.Client.Services;

namespace UnityMCP.Client.Services
{
    /// <summary>
    /// Factory for creating code execution services
    /// </summary>
    public class CodeExecutionServiceFactory
    {
        private readonly ILogService _logService;
        
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="logService">Log service</param>
        public CodeExecutionServiceFactory(ILogService logService)
        {
            _logService = logService;
        }
        
        /// <summary>
        /// Create a code execution service
        /// </summary>
        /// <param name="type">Type of service to create</param>
        /// <returns>Code execution service</returns>
        public ICodeExecutionService Create(CodeExecutionServiceType type)
        {
            return type switch
            {
                CodeExecutionServiceType.Mock => new MockCodeExecutionService(_logService),
                // Add other implementations here when available
                _ => new MockCodeExecutionService(_logService)
            };
        }
    }
    
    /// <summary>
    /// Types of code execution services
    /// </summary>
    public enum CodeExecutionServiceType
    {
        /// <summary>
        /// Mock implementation for testing
        /// </summary>
        Mock,
        
        /// <summary>
        /// Real implementation using Unity
        /// </summary>
        Unity
    }
}
