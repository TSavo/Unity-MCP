using System.Net;
using Newtonsoft.Json;
using UnityMCP.Client.Services;

namespace UnityMCP.Client.Middleware
{
    /// <summary>
    /// Middleware for handling exceptions
    /// </summary>
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogService _logService;
        
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="next">Next middleware in the pipeline</param>
        /// <param name="logService">Log service</param>
        public ExceptionHandlingMiddleware(RequestDelegate next, ILogService logService)
        {
            _next = next;
            _logService = logService;
        }
        
        /// <summary>
        /// Invoke the middleware
        /// </summary>
        /// <param name="context">HTTP context</param>
        /// <returns>Task</returns>
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logService.LogError("An unhandled exception occurred", ex);
                await HandleExceptionAsync(context, ex);
            }
        }
        
        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            
            var response = new
            {
                error = "An error occurred while processing your request",
                message = exception.Message,
                stackTrace = exception.StackTrace
            };
            
            return context.Response.WriteAsync(JsonConvert.SerializeObject(response));
        }
    }
}
