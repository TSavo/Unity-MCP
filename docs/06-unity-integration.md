# Unity Integration

## Overview

The Unity Integration is a plugin for Unity that communicates with the Web Server, executes C# code within Unity, and sends results back to the Web Server. It serves as the bridge between the Web Server and Unity, enabling AI assistants to interact with Unity game environments.

## Purpose

The Unity Integration fulfills several critical roles in the Unity-MCP architecture:

1. **Code Execution**: Executes C# code in Unity's context
2. **Query Execution**: Executes queries to access objects and properties
3. **Result Reporting**: Sends results back to the Web Server
4. **Log Forwarding**: Forwards Unity logs to the Web Server
5. **SDK Integration**: Provides integration points for the Unity SDK

## Implementation

The Unity Integration is implemented as a C# plugin that establishes WebSocket connections with the Web Server and provides a bridge to the Unity SDK.

### Key Components

1. **WebSocket Client**: Manages communication with the Web Server
2. **Code Executor**: Executes C# code in Unity's context
3. **Query Executor**: Executes queries to access objects and properties
4. **Log Forwarder**: Forwards Unity logs to the Web Server
5. **SDK Bridge**: Provides integration points for the Unity SDK

## Code Example

```csharp
using UnityEngine;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebSocketSharp;

namespace UnityMCP
{
    public class UnityMCPIntegration : MonoBehaviour
    {
        [SerializeField]
        private string webServerUrl = "ws://localhost:8080";
        
        private WebSocket webSocket;
        private CodeExecutor codeExecutor;
        private bool isConnected = false;
        
        private void Awake()
        {
            // Create the code executor
            codeExecutor = new CodeExecutor();
            
            // Register with the SDK
            UnityMCPSDK.RegisterIntegration(this);
            
            // Don't destroy on load
            DontDestroyOnLoad(gameObject);
        }
        
        private void Start()
        {
            // Connect to the Web Server
            ConnectToWebServer();
        }
        
        private void ConnectToWebServer()
        {
            try
            {
                // Create WebSocket connection
                webSocket = new WebSocket(webServerUrl);
                
                // Set up event handlers
                webSocket.OnOpen += OnWebSocketOpen;
                webSocket.OnMessage += OnWebSocketMessage;
                webSocket.OnError += OnWebSocketError;
                webSocket.OnClose += OnWebSocketClose;
                
                // Connect to the Web Server
                webSocket.Connect();
                
                Debug.Log("[Unity MCP] Connecting to Web Server...");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Unity MCP] Error connecting to Web Server: {ex.Message}");
            }
        }
        
        private void OnWebSocketOpen(object sender, EventArgs e)
        {
            isConnected = true;
            Debug.Log("[Unity MCP] Connected to Web Server");
        }
        
        private void OnWebSocketMessage(object sender, MessageEventArgs e)
        {
            try
            {
                // Parse the message
                var message = JsonUtility.FromJson<WebSocketMessage>(e.Data);
                
                // Handle the message based on its type
                switch (message.type)
                {
                    case "execute":
                        HandleExecuteMessage(message);
                        break;
                    case "query":
                        HandleQueryMessage(message);
                        break;
                    default:
                        Debug.LogWarning($"[Unity MCP] Unknown message type: {message.type}");
                        break;
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Unity MCP] Error handling message: {ex.Message}");
            }
        }
        
        private void HandleExecuteMessage(WebSocketMessage message)
        {
            // Execute the code
            var result = codeExecutor.Execute(message.code);
            
            // Send the result back to the Web Server
            SendResult(message.logId, result);
        }
        
        private void HandleQueryMessage(WebSocketMessage message)
        {
            // Execute the query
            var result = codeExecutor.ExecuteQuery(message.query);
            
            // Send the result back to the Web Server
            SendResult(message.logId, result);
        }
        
        private void SendResult(string logId, ExecutionResult result)
        {
            // Create the response message
            var response = new WebSocketResponse
            {
                type = "result",
                logId = logId,
                success = result.Success,
                result = result.Result,
                error = result.Error
            };
            
            // Send the response to the Web Server
            webSocket.Send(JsonUtility.ToJson(response));
        }
        
        private void OnWebSocketError(object sender, ErrorEventArgs e)
        {
            isConnected = false;
            Debug.LogError($"[Unity MCP] WebSocket error: {e.Message}");
        }
        
        private void OnWebSocketClose(object sender, CloseEventArgs e)
        {
            isConnected = false;
            Debug.Log($"[Unity MCP] WebSocket closed: {e.Reason}");
            
            // Attempt to reconnect after a delay
            Invoke("ConnectToWebServer", 5f);
        }
        
        private void OnDestroy()
        {
            // Close the WebSocket connection
            if (webSocket != null && webSocket.ReadyState == WebSocketState.Open)
            {
                webSocket.Close();
            }
        }
        
        // Method for the SDK to send data to the Web Server
        public void SendData(string resultName, object data)
        {
            if (!isConnected)
            {
                Debug.LogWarning("[Unity MCP] Cannot send data: Not connected to Web Server");
                return;
            }
            
            // Create the data message
            var message = new WebSocketDataMessage
            {
                type = "data",
                resultName = resultName,
                data = data
            };
            
            // Send the message to the Web Server
            webSocket.Send(JsonUtility.ToJson(message));
        }
    }
    
    [Serializable]
    public class WebSocketMessage
    {
        public string type;
        public string logId;
        public string code;
        public string query;
    }
    
    [Serializable]
    public class WebSocketResponse
    {
        public string type;
        public string logId;
        public bool success;
        public object result;
        public string error;
    }
    
    [Serializable]
    public class WebSocketDataMessage
    {
        public string type;
        public string resultName;
        public object data;
    }
}
```

## Code Executor

The Code Executor is responsible for executing C# code in Unity's context:

```csharp
using UnityEngine;
using System;
using System.Reflection;
using System.CodeDom.Compiler;
using Microsoft.CSharp;
using System.Collections.Generic;

namespace UnityMCP
{
    public class CodeExecutor
    {
        private List<string> logs = new List<string>();
        private List<string> errors = new List<string>();
        
        public ExecutionResult Execute(string code)
        {
            // Clear logs and errors
            logs.Clear();
            errors.Clear();
            
            // Add log handler to capture output during execution
            Application.logMessageReceived += LogHandler;
            
            try
            {
                // Wrap the code in a class
                string wrappedCode = $@"
                using UnityEngine;
                using System;
                using System.Collections;
                using System.Collections.Generic;
                using System.Linq;
                
                public class McpScript
                {{
                    public static object Execute()
                    {{
                        {code}
                    }}
                }}";
                
                // Compile the code
                var provider = new CSharpCodeProvider();
                var parameters = new CompilerParameters
                {
                    GenerateInMemory = true,
                    GenerateExecutable = false
                };
                
                // Add references to Unity assemblies
                AddUnityReferences(parameters);
                
                // Compile the code
                var results = provider.CompileAssemblyFromSource(parameters, wrappedCode);
                
                // Check for compilation errors
                if (results.Errors.HasErrors)
                {
                    string errorMessage = "Compilation errors:";
                    foreach (CompilerError error in results.Errors)
                    {
                        errorMessage += $"\n{error.Line}: {error.ErrorText}";
                    }
                    
                    return new ExecutionResult
                    {
                        Success = false,
                        Error = errorMessage,
                        Logs = logs.ToArray(),
                        Errors = errors.ToArray()
                    };
                }
                
                // Get the compiled assembly and execute the code
                var assembly = results.CompiledAssembly;
                var type = assembly.GetType("McpScript");
                var method = type.GetMethod("Execute");
                
                // Execute the code
                var result = method.Invoke(null, null);
                
                return new ExecutionResult
                {
                    Success = true,
                    Result = result,
                    Logs = logs.ToArray(),
                    Errors = errors.ToArray()
                };
            }
            catch (Exception ex)
            {
                return new ExecutionResult
                {
                    Success = false,
                    Error = ex.Message,
                    Logs = logs.ToArray(),
                    Errors = errors.ToArray()
                };
            }
            finally
            {
                // Remove log handler
                Application.logMessageReceived -= LogHandler;
            }
        }
        
        public ExecutionResult ExecuteQuery(string query)
        {
            // For a query, we just wrap it in a return statement
            return Execute($"return {query};");
        }
        
        private void LogHandler(string message, string stackTrace, LogType type)
        {
            switch (type)
            {
                case LogType.Log:
                    logs.Add(message);
                    break;
                case LogType.Warning:
                    logs.Add($"[Warning] {message}");
                    break;
                case LogType.Error:
                case LogType.Exception:
                case LogType.Assert:
                    errors.Add($"{message}\n{stackTrace}");
                    break;
            }
        }
        
        private void AddUnityReferences(CompilerParameters parameters)
        {
            // Add references to Unity assemblies
            parameters.ReferencedAssemblies.Add(typeof(UnityEngine.Object).Assembly.Location);
            parameters.ReferencedAssemblies.Add(typeof(System.Object).Assembly.Location);
            parameters.ReferencedAssemblies.Add(typeof(System.Linq.Enumerable).Assembly.Location);
            
            // Add more references as needed
        }
    }
    
    [Serializable]
    public class ExecutionResult
    {
        public bool Success;
        public object Result;
        public string Error;
        public string[] Logs;
        public string[] Errors;
    }
}
```

## WebSocket Protocol

The Unity Integration communicates with the Web Server using a WebSocket protocol:

### Messages from Web Server to Unity

- **Execute Code**
  ```json
  {
    "type": "execute",
    "logId": "550e8400-e29b-41d4-a716-446655440000",
    "code": "return GameObject.Find(\"Player\").transform.position;"
  }
  ```

- **Execute Query**
  ```json
  {
    "type": "query",
    "logId": "550e8400-e29b-41d4-a716-446655440000",
    "query": "GameObject.Find(\"Player\").transform.position"
  }
  ```

### Messages from Unity to Web Server

- **Result**
  ```json
  {
    "type": "result",
    "logId": "550e8400-e29b-41d4-a716-446655440000",
    "success": true,
    "result": {
      "x": 0,
      "y": 1,
      "z": 0
    }
  }
  ```

- **Data**
  ```json
  {
    "type": "data",
    "resultName": "player_stats",
    "data": {
      "health": 100,
      "position": {
        "x": 0,
        "y": 1,
        "z": 0
      }
    }
  }
  ```

## Installation

The Unity Integration can be installed in a Unity project in several ways:

1. **Unity Package**: Import the Unity package into your project
2. **Asset Store**: Download from the Unity Asset Store
3. **Git Submodule**: Add as a Git submodule to your project

## Configuration

The Unity Integration can be configured with the following options:

1. **Web Server URL**: The URL of the Web Server to connect to
2. **Reconnect Interval**: The interval in seconds to attempt reconnection if the connection is lost
3. **Log Level**: The level of logging to use (Debug, Info, Warning, Error)

## Security Considerations

When using the Unity Integration, consider the following security implications:

1. **Code Execution**: The Unity Integration executes arbitrary C# code, which can be a security risk. Only use it in trusted environments.
2. **Network Communication**: The Unity Integration communicates with the Web Server over WebSockets, which may expose your Unity project to network attacks. Use secure WebSocket connections (wss://) in production.
3. **Access Control**: Implement access control to restrict who can execute code in your Unity project.

## Conclusion

The Unity Integration is a critical component of the Unity-MCP architecture, serving as the bridge between the Web Server and Unity. It enables AI assistants to interact with Unity game environments by executing code, querying objects, and receiving results.
