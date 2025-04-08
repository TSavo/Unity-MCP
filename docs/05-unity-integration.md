# Unity Integration

## Overview

The Unity Integration is an Editor extension for Unity that communicates with the MCP STDIO Client, executes C# code within Unity, and sends results back. It serves as the bridge between the MCP STDIO Client and Unity, enabling AI assistants to interact with Unity game environments in both Edit Mode and Play Mode.

## Purpose

The Unity Integration fulfills several critical roles in the Unity-MCP architecture:

1. **Code Execution**: Executes C# code in Unity's context (both Edit Mode and Play Mode).
2. **Query Execution**: Executes queries to access objects and properties.
3. **Result Reporting**: Sends results back to the MCP STDIO Client.
4. **Log Forwarding**: Forwards Unity logs to the MCP STDIO Client.
5. **Editor Integration**: Persists beyond game execution cycles.

## Implementation

The Unity Integration is implemented as a Unity Editor extension that runs independently of game execution, ensuring it remains available whether the game is running or not.

### Key Components

1. **ASP.NET Core Web Server**: Exposes REST API endpoints for code execution and queries.
2. **Code Executor**: Executes C# code in Unity's context (both Edit Mode and Play Mode).
3. **Query Executor**: Executes queries by wrapping them in a `return` statement.
4. **Editor Integration**: Ensures the service persists across domain reloads and editor restarts.
5. **Editor Window**: Provides a user interface for controlling the service.

## Editor Extension Implementation

```csharp
using UnityEditor;
using UnityEngine;

namespace UnityMCP.Editor
{
    [InitializeOnLoad]
    public class UnityMCPEditorIntegration
    {
        private static HttpServer httpServer;
        private static CodeExecutor codeExecutor;
        private static bool isInitialized = false;

        // This constructor is called when Unity loads due to [InitializeOnLoad]
        static UnityMCPEditorIntegration()
        {
            // Initialize when Unity Editor starts
            EditorApplication.delayCall += Initialize;

            // Make sure we clean up when the editor is closing
            EditorApplication.quitting += Shutdown;
        }

        private static void Initialize()
        {
            if (isInitialized) return;

            Debug.Log("Initializing Unity MCP Editor Integration");

            // Create the code executor
            codeExecutor = new CodeExecutor();

            // Start the HTTP server
            httpServer = new HttpServer(8081, codeExecutor);
            httpServer.Start();

            // Register for domain reload
            AssemblyReloadEvents.afterAssemblyReload += OnAfterAssemblyReload;

            isInitialized = true;
        }

        private static void OnAfterAssemblyReload()
        {
            // Reinitialize after domain reload
            if (!isInitialized || httpServer == null || !httpServer.IsRunning)
            {
                Initialize();
            }
        }

        private static void Shutdown()
        {
            Debug.Log("Shutting down Unity MCP Editor Integration");
            httpServer?.Stop();
            isInitialized = false;
        }
    }
}
```

## Editor Window

```csharp
using UnityEditor;
using UnityEngine;

namespace UnityMCP.Editor
{
    public class UnityMCPEditorWindow : EditorWindow
    {
        private static bool isServiceRunning = false;

        [MenuItem("Window/Unity MCP/Control Panel")]
        public static void ShowWindow()
        {
            GetWindow<UnityMCPEditorWindow>("Unity MCP");
        }

        private void OnEnable()
        {
            // Check if service is already running
            isServiceRunning = HttpServer.IsRunning;
        }

        private void OnGUI()
        {
            EditorGUILayout.LabelField("Unity MCP Service", EditorStyles.boldLabel);

            EditorGUILayout.Space();

            if (isServiceRunning)
            {
                EditorGUILayout.HelpBox("Unity MCP Service is running on port 8081", MessageType.Info);

                if (GUILayout.Button("Stop Service"))
                {
                    HttpServer.Stop();
                    isServiceRunning = false;
                }
            }
            else
            {
                EditorGUILayout.HelpBox("Unity MCP Service is not running", MessageType.Warning);

                if (GUILayout.Button("Start Service"))
                {
                    HttpServer.Start();
                    isServiceRunning = true;
                }
            }

            EditorGUILayout.Space();

            bool autoStart = EditorGUILayout.Toggle("Auto-start on Editor launch",
                EditorPrefs.GetBool("UnityMCP_AutoStart", true));

            if (EditorPrefs.GetBool("UnityMCP_AutoStart", true) != autoStart)
            {
                EditorPrefs.SetBool("UnityMCP_AutoStart", autoStart);
            }
        }
    }
}
```

## Code Executor

The Code Executor is responsible for executing C# code in Unity's context, handling both Edit Mode and Play Mode:

```csharp
using UnityEngine;
using UnityEditor;
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
                // Check if we're in Play Mode or Edit Mode
                if (EditorApplication.isPlaying)
                {
                    // Execute in Play Mode
                    return ExecuteInPlayMode(code);
                }
                else
                {
                    // Execute in Edit Mode
                    return ExecuteInEditMode(code);
                }
            }
            finally
            {
                // Remove log handler
                Application.logMessageReceived -= LogHandler;
            }
        }

        private ExecutionResult ExecuteInPlayMode(string code)
        {
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
        }

        private ExecutionResult ExecuteInEditMode(string code)
        {
            try
            {
                // In Edit Mode, we need to use Editor APIs
                // This is a simplified example - in practice, you'd need more sophisticated parsing

                if (code.StartsWith("return GameObject.Find"))
                {
                    // Parse and execute GameObject.Find
                    var match = System.Text.RegularExpressions.Regex.Match(code, @"return GameObject\.Find\(\"([^\"]+)\"\)");
                    if (match.Success)
                    {
                        string objectName = match.Groups[1].Value;
                        var gameObject = GameObject.Find(objectName);
                        return new ExecutionResult
                        {
                            Success = true,
                            Result = gameObject,
                            Logs = logs.ToArray(),
                            Errors = errors.ToArray()
                        };
                    }
                }

                // For more complex queries, you'd use Roslyn or other code evaluation techniques
                // ...

                return new ExecutionResult
                {
                    Success = false,
                    Error = "Unsupported code in Edit Mode",
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
            parameters.ReferencedAssemblies.Add(typeof(UnityEditor.Editor).Assembly.Location); // Add UnityEditor reference

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

## REST API Endpoints

The Unity Integration exposes the following REST API endpoints:

### Execute Code

```http
POST /api/CodeExecution/execute
Content-Type: application/json

{
  "code": "return GameObject.Find(\"Player\").transform.position;",
  "timeout": 5000
}
```

### Execute Query

```http
POST /api/CodeExecution/query
Content-Type: application/json

{
  "query": "Camera.main.transform.position",
  "timeout": 5000
}
```

### Response Format

```json
{
  "success": true,
  "result": {
    "x": 0,
    "y": 1,
    "z": 0
  },
  "error": null,
  "logs": ["Log message 1", "Log message 2"],
  "executionTime": 123
}
```

## Installation

The Unity Integration can be installed in a Unity project in several ways:

1. **Unity Package**: Import the Unity package into your project.
2. **Asset Store**: Download from the Unity Asset Store.
3. **Git Submodule**: Add as a Git submodule to your project.

## Configuration

The Unity Integration can be configured with the following options:

1. **Web Server URL**: The URL of the Web Server to connect to.
2. **Reconnect Interval**: The interval in seconds to attempt reconnection if the connection is lost.
3. **Log Level**: The level of logging to use (Debug, Info, Warning, Error).

## Security Considerations

When using the Unity Integration, consider the following security implications:

1. **Code Execution**: The Unity Integration executes arbitrary C# code, which can be a security risk. Only use it in trusted environments.
2. **Network Communication**: The Unity Integration exposes HTTP endpoints, which may expose your Unity project to network attacks. Consider using HTTPS in production.
3. **Access Control**: Implement access control to restrict who can execute code in your Unity project.

## Advantages Over MonoBehaviour Approach

The Editor extension approach offers several advantages over a MonoBehaviour-based implementation:

1. **Persistence**: The service runs independently of game execution, ensuring it remains available whether the game is running or not.
2. **Edit Mode Support**: Can execute code and queries in both Edit Mode and Play Mode.
3. **Editor Integration**: Provides a user interface for controlling the service.
4. **Domain Reload Resilience**: Automatically restarts after domain reloads.
5. **No Scene Dependency**: Doesn't require a GameObject in the scene.

## Conclusion

The Unity Integration is a critical component of the Unity-MCP architecture, serving as the bridge between the MCP STDIO Client and Unity. By implementing it as an Editor extension rather than a MonoBehaviour, it ensures persistent availability and broader functionality, enabling AI assistants to interact with Unity game environments in both Edit Mode and Play Mode.
