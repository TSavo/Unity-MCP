using UnityMCP.Client.Models;

namespace UnityMCP.Client.Services
{
    /// <summary>
    /// Decorator for ILogService that adds performance metrics
    /// </summary>
    public class PerformanceLoggingDecorator : ILogService
    {
        private readonly ILogService _decorated;
        private readonly ILogger<PerformanceLoggingDecorator> _logger;
        
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="decorated">The decorated log service</param>
        /// <param name="logger">Logger</param>
        public PerformanceLoggingDecorator(ILogService decorated, ILogger<PerformanceLoggingDecorator> logger)
        {
            _decorated = decorated;
            _logger = logger;
        }
        
        /// <summary>
        /// Log a message with performance tracking
        /// </summary>
        public void Log(string message, LogSeverity logLevel = LogSeverity.Info)
        {
            var startTime = DateTime.UtcNow;
            _decorated.Log(message, logLevel);
            var elapsed = DateTime.UtcNow - startTime;
            
            if (elapsed.TotalMilliseconds > 5) // Only log slow operations
            {
                _logger.LogWarning($"Slow logging operation: {elapsed.TotalMilliseconds}ms for message: {message}");
            }
        }
        
        /// <summary>
        /// Log an error with performance tracking
        /// </summary>
        public void LogError(string error, Exception? exception = null)
        {
            var startTime = DateTime.UtcNow;
            _decorated.LogError(error, exception);
            var elapsed = DateTime.UtcNow - startTime;
            
            if (elapsed.TotalMilliseconds > 10) // Only log slow operations
            {
                _logger.LogWarning($"Slow error logging operation: {elapsed.TotalMilliseconds}ms for error: {error}");
            }
        }
        
        /// <summary>
        /// Get recent logs
        /// </summary>
        public IEnumerable<LogEntry> GetRecentLogs(int count = 100)
        {
            var startTime = DateTime.UtcNow;
            var result = _decorated.GetRecentLogs(count);
            var elapsed = DateTime.UtcNow - startTime;
            
            if (elapsed.TotalMilliseconds > 20) // Only log slow operations
            {
                _logger.LogWarning($"Slow GetRecentLogs operation: {elapsed.TotalMilliseconds}ms for count: {count}");
            }
            
            return result;
        }
        
        /// <summary>
        /// Get logs for a specific operation
        /// </summary>
        public IEnumerable<LogEntry> GetLogsForOperation(string operationId)
        {
            var startTime = DateTime.UtcNow;
            var result = _decorated.GetLogsForOperation(operationId);
            var elapsed = DateTime.UtcNow - startTime;
            
            if (elapsed.TotalMilliseconds > 20) // Only log slow operations
            {
                _logger.LogWarning($"Slow GetLogsForOperation operation: {elapsed.TotalMilliseconds}ms for operationId: {operationId}");
            }
            
            return result;
        }
    }
    
    /// <summary>
    /// Decorator for ILogService that adds security logging
    /// </summary>
    public class SecurityLoggingDecorator : ILogService
    {
        private readonly ILogService _decorated;
        private readonly ILogger<SecurityLoggingDecorator> _logger;
        
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="decorated">The decorated log service</param>
        /// <param name="logger">Logger</param>
        public SecurityLoggingDecorator(ILogService decorated, ILogger<SecurityLoggingDecorator> logger)
        {
            _decorated = decorated;
            _logger = logger;
        }
        
        /// <summary>
        /// Log a message with security checks
        /// </summary>
        public void Log(string message, LogSeverity logLevel = LogSeverity.Info)
        {
            // Check for sensitive information in logs
            if (ContainsSensitiveInformation(message))
            {
                _logger.LogWarning("Attempted to log sensitive information");
                message = RedactSensitiveInformation(message);
            }
            
            _decorated.Log(message, logLevel);
        }
        
        /// <summary>
        /// Log an error with security checks
        /// </summary>
        public void LogError(string error, Exception? exception = null)
        {
            // Check for sensitive information in logs
            if (ContainsSensitiveInformation(error))
            {
                _logger.LogWarning("Attempted to log sensitive information in error");
                error = RedactSensitiveInformation(error);
            }
            
            // Check for sensitive information in exception
            if (exception != null && ContainsSensitiveInformation(exception.ToString()))
            {
                _logger.LogWarning("Exception contains sensitive information");
                // We can't modify the exception, but we can log a warning
            }
            
            _decorated.LogError(error, exception);
        }
        
        /// <summary>
        /// Get recent logs
        /// </summary>
        public IEnumerable<LogEntry> GetRecentLogs(int count = 100)
        {
            // Limit the number of logs that can be retrieved at once
            if (count > 1000)
            {
                _logger.LogWarning($"Attempted to retrieve too many logs: {count}");
                count = 1000;
            }
            
            return _decorated.GetRecentLogs(count);
        }
        
        /// <summary>
        /// Get logs for a specific operation
        /// </summary>
        public IEnumerable<LogEntry> GetLogsForOperation(string operationId)
        {
            // Log access to operation logs
            _logger.LogInformation($"Accessing logs for operation: {operationId}");
            
            return _decorated.GetLogsForOperation(operationId);
        }
        
        private bool ContainsSensitiveInformation(string text)
        {
            // Check for common patterns of sensitive information
            // This is a simple example - in a real application, you would use more sophisticated checks
            return text.Contains("password", StringComparison.OrdinalIgnoreCase) ||
                   text.Contains("secret", StringComparison.OrdinalIgnoreCase) ||
                   text.Contains("token", StringComparison.OrdinalIgnoreCase) ||
                   text.Contains("api key", StringComparison.OrdinalIgnoreCase);
        }
        
        private string RedactSensitiveInformation(string text)
        {
            // Redact common patterns of sensitive information
            // This is a simple example - in a real application, you would use more sophisticated redaction
            text = System.Text.RegularExpressions.Regex.Replace(text, 
                @"password[=:]\s*[""']?[^""'\s]+[""']?", 
                "password=*****", 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            
            text = System.Text.RegularExpressions.Regex.Replace(text, 
                @"secret[=:]\s*[""']?[^""'\s]+[""']?", 
                "secret=*****", 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            
            text = System.Text.RegularExpressions.Regex.Replace(text, 
                @"token[=:]\s*[""']?[^""'\s]+[""']?", 
                "token=*****", 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            
            text = System.Text.RegularExpressions.Regex.Replace(text, 
                @"api key[=:]\s*[""']?[^""'\s]+[""']?", 
                "api key=*****", 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            
            return text;
        }
    }
}
