using UnityMCP.Client.Models;

namespace UnityMCP.Client.Services
{
    /// <summary>
    /// Mock implementation of the code execution service
    /// </summary>
    public class MockCodeExecutionService : ICodeExecutionService
    {
        private readonly ILogService _logService;
        private readonly Random _random = new Random();

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="logService">Log service</param>
        public MockCodeExecutionService(ILogService logService)
        {
            _logService = logService;
        }

        /// <summary>
        /// Execute C# code (mock implementation)
        /// </summary>
        /// <param name="code">The C# code to execute</param>
        /// <param name="timeout">Optional timeout in milliseconds</param>
        /// <returns>The execution result</returns>
        public async Task<CodeExecutionResult> ExecuteCodeAsync(string code, int timeout = 1000)
        {
            // Logging is now handled by the decorator

            // Simulate execution delay
            int executionTime = _random.Next(10, 200);
            await Task.Delay(executionTime);

            try
            {
                // Try to parse and evaluate the code (very limited mock implementation)
                var result = MockEvaluateCode(code);

                // Logging is now handled by the decorator

                return new CodeExecutionResult
                {
                    Success = true,
                    Result = result,
                    Logs = new List<string> { "[MOCK] Code executed successfully" },
                    ExecutionTime = executionTime
                };
            }
            catch (Exception ex)
            {
                _logService.LogError("Error executing code", ex);

                return new CodeExecutionResult
                {
                    Success = false,
                    Error = $"Error executing code: {ex.Message}",
                    Logs = new List<string> { $"[MOCK] Error: {ex.Message}" },
                    ExecutionTime = executionTime
                };
            }
        }

        /// <summary>
        /// Check if the code execution service is available
        /// </summary>
        /// <returns>True if the service is available, false otherwise</returns>
        public Task<bool> IsAvailableAsync()
        {
            return Task.FromResult(true);
        }

        /// <summary>
        /// Get information about the execution environment
        /// </summary>
        /// <returns>Environment information</returns>
        public Task<EnvironmentInfo> GetEnvironmentInfoAsync()
        {
            return Task.FromResult(new EnvironmentInfo
            {
                UnityVersion = "2022.3.16f1",
                Platform = "Windows",
                IsEditor = true,
                SceneObjects = new List<string> { "Main Camera", "Directional Light", "Player" }
            });
        }

        /// <summary>
        /// Mock code evaluation (very limited)
        /// This only handles simple expressions and is for testing purposes only
        /// </summary>
        /// <param name="code">Code to evaluate</param>
        /// <returns>Evaluation result</returns>
        private object MockEvaluateCode(string code)
        {
            // Extract return statement if present
            var returnMatch = System.Text.RegularExpressions.Regex.Match(code, @"return\s+(.*?);");
            if (returnMatch.Success)
            {
                code = returnMatch.Groups[1].Value;
            }

            // Handle some common Unity patterns with mock responses
            if (code.Contains("GameObject.Find"))
            {
                return new { name = "MockGameObject", transform = new { position = new { x = 0, y = 0, z = 0 } } };
            }

            if (code.Contains("transform.position"))
            {
                return new { x = 0, y = 0, z = 0 };
            }

            if (code.Contains("GetComponent"))
            {
                return new { enabled = true };
            }

            // For simple expressions, try to evaluate them
            // WARNING: This is extremely unsafe and only for testing!
            // In a real environment, never eval user input
            try
            {
                // Only allow simple expressions for testing
                if (System.Text.RegularExpressions.Regex.IsMatch(code, @"^[0-9+\-*/. ()]+$"))
                {
                    // This is a very simple mock - in reality we would use a proper expression evaluator
                    return new { result = 42 };
                }

                // For other code, return a mock object with updated information
                return new { mockResult = true, code, message = "This is a custom mock response added during hot reloading test!", timestamp = DateTime.Now.ToString(), version = "2.0.0" };
            }
            catch (Exception ex)
            {
                throw new Exception($"Cannot evaluate code: {ex.Message}", ex);
            }
        }
    }
}
