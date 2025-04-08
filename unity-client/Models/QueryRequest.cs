using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace UnityMCP.Client.Models
{
    /// <summary>
    /// Request to execute a query
    /// </summary>
    public class QueryRequest
    {
        /// <summary>
        /// The query to execute
        /// </summary>
        [Required]
        [JsonProperty("query")]
        public string Query { get; set; } = string.Empty;
        
        /// <summary>
        /// Optional timeout in milliseconds
        /// </summary>
        [JsonProperty("timeout")]
        public int Timeout { get; set; } = 1000;
    }
}
