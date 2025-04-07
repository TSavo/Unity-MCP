using Newtonsoft.Json;

namespace UnityMCP.Client.Models
{
    /// <summary>
    /// Information about the execution environment
    /// </summary>
    public class EnvironmentInfo
    {
        /// <summary>
        /// Unity version
        /// </summary>
        [JsonProperty("unityVersion")]
        public string UnityVersion { get; set; } = string.Empty;
        
        /// <summary>
        /// Platform (Windows, macOS, Linux, etc.)
        /// </summary>
        [JsonProperty("platform")]
        public string Platform { get; set; } = string.Empty;
        
        /// <summary>
        /// Whether running in editor or standalone
        /// </summary>
        [JsonProperty("isEditor")]
        public bool IsEditor { get; set; }
        
        /// <summary>
        /// Available game objects in the scene (optional)
        /// </summary>
        [JsonProperty("sceneObjects")]
        public List<string>? SceneObjects { get; set; }
    }
}
