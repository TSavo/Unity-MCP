using UnityMCP.Client.Models;

namespace UnityMCP.Client.Services
{
    /// <summary>
    /// Decorator for ICodeExecutionService that adds logging
    /// </summary>
    public class LoggingCodeExecutionDecorator : ICodeExecutionService
    {
        private readonly ICodeExecutionService _decorated;
        private readonly ILogService _logService;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="decorated">The decorated code execution service</param>
        /// <param name="logService">Log service</param>
        public LoggingCodeExecutionDecorator(ICodeExecutionService decorated, ILogService logService)
        {
            _decorated = decorated;
            _logService = logService;
        }

        /// <summary>
        /// Execute code with logging
        /// </summary>
        public async Task<CodeExecutionResult> ExecuteCodeAsync(string code, int timeout = 1000)
        {
            _logService.Log($"Executing code with timeout {timeout}ms: {code.Substring(0, Math.Min(100, code.Length))}{(code.Length > 100 ? "..." : "")}", LogSeverity.Debug);

            var startTime = DateTime.UtcNow;
            var result = await _decorated.ExecuteCodeAsync(code, timeout);
            var elapsed = DateTime.UtcNow - startTime;

            if (result.Success)
            {
                _logService.Log($"Code execution successful in {elapsed.TotalMilliseconds}ms", LogSeverity.Info);
            }
            else
            {
                _logService.LogError($"Code execution failed in {elapsed.TotalMilliseconds}ms: {result.Error}");
            }

            return result;
        }

        /// <summary>
        /// Execute a query with logging
        /// </summary>
        public async Task<CodeExecutionResult> QueryAsync(string query, int timeout = 1000)
        {
            _logService.Log($"Executing query with timeout {timeout}ms: {query.Substring(0, Math.Min(100, query.Length))}{(query.Length > 100 ? "..." : "")}", LogSeverity.Debug);

            var startTime = DateTime.UtcNow;
            var result = await _decorated.QueryAsync(query, timeout);
            var elapsed = DateTime.UtcNow - startTime;

            if (result.Success)
            {
                _logService.Log($"Query execution successful in {elapsed.TotalMilliseconds}ms", LogSeverity.Info);
            }
            else
            {
                _logService.LogError($"Query execution failed in {elapsed.TotalMilliseconds}ms: {result.Error}");
            }

            return result;
        }

        /// <summary>
        /// Check if the service is available
        /// </summary>
        public async Task<bool> IsAvailableAsync()
        {
            _logService.Log("Checking if code execution service is available", LogSeverity.Debug);

            var startTime = DateTime.UtcNow;
            var result = await _decorated.IsAvailableAsync();
            var elapsed = DateTime.UtcNow - startTime;

            _logService.Log($"Code execution service availability check completed in {elapsed.TotalMilliseconds}ms: {(result ? "available" : "unavailable")}", LogSeverity.Debug);

            return result;
        }

        /// <summary>
        /// Get environment info with logging
        /// </summary>
        public async Task<EnvironmentInfo> GetEnvironmentInfoAsync()
        {
            _logService.Log("Getting environment info", LogSeverity.Debug);

            var startTime = DateTime.UtcNow;
            var result = await _decorated.GetEnvironmentInfoAsync();
            var elapsed = DateTime.UtcNow - startTime;

            _logService.Log($"Got environment info in {elapsed.TotalMilliseconds}ms: Unity {result.UnityVersion} on {result.Platform}", LogSeverity.Debug);

            return result;
        }
    }

    /// <summary>
    /// Decorator for ICodeExecutionService that adds caching
    /// </summary>
    public class CachingCodeExecutionDecorator : ICodeExecutionService
    {
        private readonly ICodeExecutionService _decorated;
        private readonly ILogger<CachingCodeExecutionDecorator> _logger;
        private readonly Dictionary<string, CachedResult> _cache = new Dictionary<string, CachedResult>();
        private readonly object _lock = new object();
        private readonly TimeSpan _cacheDuration;

        private class CachedResult
        {
            public CodeExecutionResult Result { get; set; } = null!;
            public DateTime Expiration { get; set; }
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="decorated">The decorated code execution service</param>
        /// <param name="logger">Logger</param>
        /// <param name="cacheDurationSeconds">Cache duration in seconds</param>
        public CachingCodeExecutionDecorator(
            ICodeExecutionService decorated,
            ILogger<CachingCodeExecutionDecorator> logger,
            int cacheDurationSeconds = 60)
        {
            _decorated = decorated;
            _logger = logger;
            _cacheDuration = TimeSpan.FromSeconds(cacheDurationSeconds);
        }

        /// <summary>
        /// Execute code with caching
        /// </summary>
        public async Task<CodeExecutionResult> ExecuteCodeAsync(string code, int timeout = 1000)
        {
            // Create a cache key from the code and timeout
            var cacheKey = $"{code}_{timeout}";

            // Check if we have a cached result
            lock (_lock)
            {
                if (_cache.TryGetValue(cacheKey, out var cachedResult) && cachedResult.Expiration > DateTime.UtcNow)
                {
                    _logger.LogDebug($"Cache hit for code execution: {code.Substring(0, Math.Min(50, code.Length))}...");
                    return cachedResult.Result;
                }
            }

            // If not cached or expired, execute the code
            _logger.LogDebug($"Cache miss for code execution: {code.Substring(0, Math.Min(50, code.Length))}...");
            var result = await _decorated.ExecuteCodeAsync(code, timeout);

            // Only cache successful results
            if (result.Success)
            {
                lock (_lock)
                {
                    _cache[cacheKey] = new CachedResult
                    {
                        Result = result,
                        Expiration = DateTime.UtcNow.Add(_cacheDuration)
                    };
                }
            }

            return result;
        }

        /// <summary>
        /// Execute a query with caching
        /// </summary>
        public async Task<CodeExecutionResult> QueryAsync(string query, int timeout = 1000)
        {
            // Create a cache key from the query and timeout
            var cacheKey = $"query_{query}_{timeout}";

            // Check if we have a cached result
            lock (_lock)
            {
                if (_cache.TryGetValue(cacheKey, out var cachedResult) && cachedResult.Expiration > DateTime.UtcNow)
                {
                    _logger.LogDebug($"Cache hit for query execution: {query.Substring(0, Math.Min(50, query.Length))}...");
                    return cachedResult.Result;
                }
            }

            // If not cached or expired, execute the query
            _logger.LogDebug($"Cache miss for query execution: {query.Substring(0, Math.Min(50, query.Length))}...");
            var result = await _decorated.QueryAsync(query, timeout);

            // Only cache successful results
            if (result.Success)
            {
                lock (_lock)
                {
                    _cache[cacheKey] = new CachedResult
                    {
                        Result = result,
                        Expiration = DateTime.UtcNow.Add(_cacheDuration)
                    };
                }
            }

            return result;
        }

        /// <summary>
        /// Check if the service is available
        /// </summary>
        public Task<bool> IsAvailableAsync()
        {
            // Don't cache availability checks
            return _decorated.IsAvailableAsync();
        }

        /// <summary>
        /// Get environment info with caching
        /// </summary>
        public async Task<EnvironmentInfo> GetEnvironmentInfoAsync()
        {
            const string cacheKey = "environment_info";

            // Check if we have a cached result
            lock (_lock)
            {
                if (_cache.TryGetValue(cacheKey, out var cachedResult) && cachedResult.Expiration > DateTime.UtcNow)
                {
                    _logger.LogDebug("Cache hit for environment info");
                    return (EnvironmentInfo)cachedResult.Result.Result!;
                }
            }

            // If not cached or expired, get the environment info
            _logger.LogDebug("Cache miss for environment info");
            var environmentInfo = await _decorated.GetEnvironmentInfoAsync();

            // Cache the result
            lock (_lock)
            {
                _cache[cacheKey] = new CachedResult
                {
                    Result = new CodeExecutionResult
                    {
                        Success = true,
                        Result = environmentInfo,
                        ExecutionTime = 0
                    },
                    Expiration = DateTime.UtcNow.Add(_cacheDuration)
                };
            }

            return environmentInfo;
        }
    }

    /// <summary>
    /// Decorator for ICodeExecutionService that adds security checks
    /// </summary>
    public class SecurityCodeExecutionDecorator : ICodeExecutionService
    {
        private readonly ICodeExecutionService _decorated;
        private readonly ILogger<SecurityCodeExecutionDecorator> _logger;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="decorated">The decorated code execution service</param>
        /// <param name="logger">Logger</param>
        public SecurityCodeExecutionDecorator(ICodeExecutionService decorated, ILogger<SecurityCodeExecutionDecorator> logger)
        {
            _decorated = decorated;
            _logger = logger;
        }

        /// <summary>
        /// Execute code with security checks
        /// </summary>
        public async Task<CodeExecutionResult> ExecuteCodeAsync(string code, int timeout = 1000)
        {
            // Check for potentially dangerous code
            if (ContainsDangerousCode(code))
            {
                _logger.LogWarning($"Potentially dangerous code detected: {code.Substring(0, Math.Min(100, code.Length))}...");

                // In a real application, you might want to block execution or sanitize the code
                // For this example, we'll just log a warning and proceed
            }

            return await _decorated.ExecuteCodeAsync(code, timeout);
        }

        /// <summary>
        /// Execute a query with security checks
        /// </summary>
        public async Task<CodeExecutionResult> QueryAsync(string query, int timeout = 1000)
        {
            // Check for potentially dangerous query
            if (ContainsDangerousCode(query))
            {
                _logger.LogWarning($"Potentially dangerous query detected: {query.Substring(0, Math.Min(100, query.Length))}...");

                // In a real application, you might want to block execution or sanitize the query
                // For this example, we'll just log a warning and proceed
            }

            return await _decorated.QueryAsync(query, timeout);
        }

        /// <summary>
        /// Check if the service is available
        /// </summary>
        public Task<bool> IsAvailableAsync()
        {
            return _decorated.IsAvailableAsync();
        }

        /// <summary>
        /// Get environment info
        /// </summary>
        public Task<EnvironmentInfo> GetEnvironmentInfoAsync()
        {
            return _decorated.GetEnvironmentInfoAsync();
        }

        private bool ContainsDangerousCode(string code)
        {
            // This is a very simple check - in a real application, you would use more sophisticated analysis
            return code.Contains("System.IO.File.Delete", StringComparison.OrdinalIgnoreCase) ||
                   code.Contains("System.Diagnostics.Process.Start", StringComparison.OrdinalIgnoreCase) ||
                   code.Contains("System.Net.WebClient", StringComparison.OrdinalIgnoreCase) ||
                   code.Contains("System.Reflection.Assembly.Load", StringComparison.OrdinalIgnoreCase);
        }
    }
}
