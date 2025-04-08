using UnityEngine;
using System;

namespace UnityMCP.Runtime
{
    /// <summary>
    /// Client for communicating with the MCP server
    /// </summary>
    public class MCPClient : MonoBehaviour
    {
        [SerializeField]
        private string serverUrl = "http://localhost:3000";
        
        private static MCPClient instance;
        
        /// <summary>
        /// Singleton instance
        /// </summary>
        public static MCPClient Instance => instance;
        
        /// <summary>
        /// Called when the script instance is being loaded
        /// </summary>
        private void Awake()
        {
            // Singleton pattern
            if (instance != null && instance != this)
            {
                Destroy(gameObject);
                return;
            }
            
            instance = this;
            DontDestroyOnLoad(gameObject);
            
            Debug.Log("[MCP Client] Initialized");
        }
        
        /// <summary>
        /// Send data to the MCP server
        /// </summary>
        /// <param name="logName">Name of the log</param>
        /// <param name="data">Data to send</param>
        public void SendData(string logName, object data)
        {
            Debug.Log($"[MCP Client] Sending data to log: {logName}");
            
            // In a real implementation, you would send the data to the MCP server
            // For now, we'll just log it
            Debug.Log($"[MCP Client] Data: {JsonUtility.ToJson(data)}");
        }
    }
}
