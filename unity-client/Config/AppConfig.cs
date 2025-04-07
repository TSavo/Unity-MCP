namespace UnityMCP.Client.Config
{
    /// <summary>
    /// Application configuration
    /// </summary>
    public class AppConfig
    {
        /// <summary>
        /// Type of code execution service to use
        /// </summary>
        public string CodeExecutionServiceType { get; set; } = "Mock";
        
        /// <summary>
        /// MCP server URL
        /// </summary>
        public string MCPServerUrl { get; set; } = "http://localhost:3000";
        
        /// <summary>
        /// Maximum number of logs to keep in memory
        /// </summary>
        public int MaxLogCount { get; set; } = 1000;
    }
}
