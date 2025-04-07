using Microsoft.AspNetCore.Mvc;
using UnityMCP.Client.Models;
using UnityMCP.Client.Services;

namespace UnityMCP.Client.Controllers
{
    /// <summary>
    /// Controller for executing code
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class CodeExecutionController : ControllerBase
    {
        private readonly ICodeExecutionService _codeExecutionService;
        private readonly ILogService _logService;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="codeExecutionService">Code execution service</param>
        /// <param name="logService">Log service</param>
        public CodeExecutionController(ICodeExecutionService codeExecutionService, ILogService logService)
        {
            _codeExecutionService = codeExecutionService;
            _logService = logService;
        }

        /// <summary>
        /// Execute code
        /// </summary>
        /// <param name="request">The code execution request</param>
        /// <returns>The execution result</returns>
        [HttpPost("execute")]
        [ProducesResponseType(typeof(CodeExecutionResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ExecuteCode([FromBody] ExecuteCodeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                _logService.Log("Code is required", LogSeverity.Warning);
                return BadRequest("Code is required");
            }

            _logService.Log($"Executing code with timeout {request.Timeout}ms", LogSeverity.Info);

            var result = await _codeExecutionService.ExecuteCodeAsync(request.Code, request.Timeout);

            return Ok(result);
        }

        /// <summary>
        /// Get environment information
        /// </summary>
        /// <returns>Environment information</returns>
        [HttpGet("info")]
        [ProducesResponseType(typeof(EnvironmentInfo), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetEnvironmentInfo()
        {
            _logService.Log("Getting environment info", LogSeverity.Info);

            var info = await _codeExecutionService.GetEnvironmentInfoAsync();

            return Ok(info);
        }
    }
}
