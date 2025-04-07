using Microsoft.AspNetCore.Mvc;
using UnityMCP.Client.Models;
using UnityMCP.Client.Services;

namespace UnityMCP.Client.Controllers
{
    /// <summary>
    /// Controller for logs
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class LogsController : ControllerBase
    {
        private readonly ILogService _logService;
        
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="logService">Log service</param>
        public LogsController(ILogService logService)
        {
            _logService = logService;
        }
        
        /// <summary>
        /// Get recent logs
        /// </summary>
        /// <param name="count">Maximum number of logs to return</param>
        /// <returns>Recent logs</returns>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<LogEntry>), StatusCodes.Status200OK)]
        public IActionResult GetRecentLogs([FromQuery] int count = 100)
        {
            var logs = _logService.GetRecentLogs(count);
            return Ok(logs);
        }
        
        /// <summary>
        /// Get logs for a specific operation
        /// </summary>
        /// <param name="operationId">The operation ID</param>
        /// <returns>Logs for the operation</returns>
        [HttpGet("{operationId}")]
        [ProducesResponseType(typeof(IEnumerable<LogEntry>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetLogsForOperation(string operationId)
        {
            var logs = _logService.GetLogsForOperation(operationId);
            
            if (!logs.Any())
            {
                return NotFound($"No logs found for operation {operationId}");
            }
            
            return Ok(logs);
        }
    }
}
