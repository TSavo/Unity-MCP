using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace UnityClient.Tests
{
    [ApiController]
    [Route("api/[controller]")]
    public class AILoggerTestController : ControllerBase
    {
        private readonly ILogger<AILoggerTestController> _logger;
        private readonly HttpClient _httpClient;

        public AILoggerTestController(ILogger<AILoggerTestController> logger)
        {
            _logger = logger;
            _httpClient = new HttpClient();
        }

        [HttpGet("test")]
        public async Task<IActionResult> TestAILogger()
        {
            _logger.LogInformation("Starting AI Logger test");

            try
            {
                // Create a log name (GUID)
                string logName = "test-log-" + Guid.NewGuid().ToString();

                // Log some data with different levels
                await LogData(logName, "debug", "This is a debug message", new { detail = "Debug details" });
                await Task.Delay(1000); // Add delay to avoid rate limiting

                await LogData(logName, "info", "This is an info message", new { detail = "Info details" });
                await Task.Delay(1000);

                await LogData(logName, "warning", "This is a warning message", new { detail = "Warning details" });
                await Task.Delay(1000);

                await LogData(logName, "error", "This is an error message", new { detail = "Error details" });
                await Task.Delay(1000);

                await LogData(logName, "critical", "This is a critical message", new { detail = "Critical details" });
                await Task.Delay(1000);

                // Log with tags
                await LogData(logName, "info", "Tagged message", new { tag = "value", tags = new[] { "test", "demo" } });
                await Task.Delay(1000);

                // Log with context
                await LogData(logName, "info", "Contextualized message", new { context = new { key = "context-key", value = "context-value" } });
                await Task.Delay(1000);

                // Log structured data
                await LogData(logName, "info", "Structured data", new
                {
                    number = 42,
                    text = "Hello, world!",
                    date = DateTime.Now,
                    nested = new
                    {
                        a = 1,
                        b = 2
                    }
                });
                await Task.Delay(1000);

                // Log an exception
                try
                {
                    throw new Exception("Test exception");
                }
                catch (Exception ex)
                {
                    await LogData(logName, "error", "Exception caught", new
                    {
                        message = ex.Message,
                        stackTrace = ex.StackTrace
                    });
                    await Task.Delay(1000);
                }

                // Wait a bit to ensure logs are flushed
                Thread.Sleep(1000);

                // Get the logs
                var logs = await GetLogs(logName);

                _logger.LogInformation("AI Logger test completed successfully");
                return Ok(new
                {
                    success = true,
                    message = "AI Logger test completed successfully",
                    logName,
                    logs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AI Logger test");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private async Task LogData(string logName, string level, string message, object data)
        {
            var logEntry = new
            {
                level,
                message,
                data,
                timestamp = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(logEntry);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"http://mcp-server-dev:8080/logs/{logName}/append", content);
            response.EnsureSuccessStatusCode();

            _logger.LogInformation($"Logged data to {logName}: {json}");
        }

        private async Task<object> GetLogs(string logName)
        {
            var response = await _httpClient.GetAsync($"http://mcp-server-dev:8080/logs/{logName}");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            _logger.LogInformation($"Retrieved logs for {logName}: {json}");

            return JsonSerializer.Deserialize<object>(json);
        }
    }
}
