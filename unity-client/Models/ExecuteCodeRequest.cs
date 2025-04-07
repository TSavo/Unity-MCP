using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace UnityMCP.Client.Models
{
    /// <summary>
    /// Request to execute code
    /// </summary>
    public class ExecuteCodeRequest
    {
        /// <summary>
        /// The C# code to execute
        /// </summary>
        [Required]
        [JsonProperty("code")]
        public string Code { get; set; } = string.Empty;
        
        /// <summary>
        /// Optional timeout in milliseconds
        /// </summary>
        [JsonProperty("timeout")]
        public int Timeout { get; set; } = 1000;
    }
}
