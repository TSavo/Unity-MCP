using Microsoft.AspNetCore.Mvc;
using UnityMCP.Client.Models;
using UnityMCP.Client.Services;
using UnityMCP.Client.Editor;

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

            var result = await _codeExecutionService.ExecuteCodeAsync(request.Code, request.Timeout);

            return Ok(result);
        }

        /// <summary>
        /// Execute a query
        /// </summary>
        /// <param name="request">The query request</param>
        /// <returns>The execution result</returns>
        [HttpPost("query")]
        [ProducesResponseType(typeof(CodeExecutionResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ExecuteQuery([FromBody] QueryRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                _logService.Log("Query is required", LogSeverity.Warning);
                return BadRequest("Query is required");
            }

            var result = await _codeExecutionService.QueryAsync(request.Query, request.Timeout);

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
            // Logging is now handled by the decorator

            var info = await _codeExecutionService.GetEnvironmentInfoAsync();

            return Ok(info);
        }

        /// <summary>
        /// Get status of the code execution service
        /// </summary>
        /// <returns>Status information</returns>
        [HttpGet("status")]
        [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public IActionResult GetStatus()
        {
            _logService.Log("Status endpoint called", LogSeverity.Info);

            return Ok("Code execution service is running with hot reload enabled!");
        }

        /// <summary>
        /// Get the current game state
        /// </summary>
        /// <returns>The current game state</returns>
        [HttpGet("game-state")]
        [ProducesResponseType(typeof(GameState), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetGameState()
        {
            _logService.Log("Get game state endpoint called", LogSeverity.Info);

            try
            {
                var gameState = await _codeExecutionService.GetGameStateAsync();
                return Ok(gameState);
            }
            catch (Exception ex)
            {
                _logService.LogError($"Error getting game state: {ex.Message}", ex);
                return StatusCode(500, $"Error getting game state: {ex.Message}");
            }
        }

        /// <summary>
        /// Start the game (enter play mode)
        /// </summary>
        /// <returns>Success or failure result</returns>
        [HttpPost("start-game")]
        [ProducesResponseType(typeof(CodeExecutionResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> StartGame()
        {
            _logService.Log("Start game endpoint called", LogSeverity.Info);

            try
            {
                var result = await _codeExecutionService.StartGameAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logService.LogError($"Error starting game: {ex.Message}", ex);
                return StatusCode(500, $"Error starting game: {ex.Message}");
            }
        }

        /// <summary>
        /// Stop the game (exit play mode)
        /// </summary>
        /// <returns>Success or failure result</returns>
        [HttpPost("stop-game")]
        [ProducesResponseType(typeof(CodeExecutionResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> StopGame()
        {
            _logService.Log("Stop game endpoint called", LogSeverity.Info);

            try
            {
                var result = await _codeExecutionService.StopGameAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logService.LogError($"Error stopping game: {ex.Message}", ex);
                return StatusCode(500, $"Error stopping game: {ex.Message}");
            }
        }
    }
}
