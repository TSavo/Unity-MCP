# Unity-AI Bridge with MCP Compatibility Specification

## 1. Introduction

### 1.1 Purpose

This specification defines the Unity-AI Bridge, a minimal yet powerful tool that enables AI assistants to interact with Unity game development environments through the Model Context Protocol (MCP). It allows AI assistants to execute code, query game objects and components, and run operations within Unity using a simple, consistent interface.

### 1.2 Scope

This document covers:
- The minimal command set of the Unity-AI Bridge (six essential commands)
- Implementation details for MCP compatibility
- Deployment options (Unity component, Docker container, NPX package)
- Query language for accessing Unity objects
- Asynchronous execution model
- Security considerations
- Usage examples

### 1.3 Prerequisites

This specification assumes familiarity with:
- The Model Context Protocol (MCP) as described in the companion document "01-model-context-protocol.md"
- Basic Unity game development concepts
- Basic understanding of client-server architectures

## 2. System Overview

### 2.1 What is the Unity-AI Bridge?

The Unity-AI Bridge is a bidirectional communication system that allows AI assistants to interact with Unity game development environments. It implements the Model Context Protocol (MCP) to provide a standardized interface for AI assistants to:

1. **Execute code** in the Unity runtime environment
2. **Inspect game objects** and their components
3. **Analyze scene hierarchies** and structures
4. **Run tests** and receive results
5. **Invoke methods** on game objects and components
6. **Modify game state** during runtime

### 2.2 Key Benefits

- **AI-Assisted Development**: Enable AI assistants to understand and modify Unity projects
- **Automated Testing**: Run tests from AI assistants and analyze results
- **Runtime Inspection**: Examine the state of a running Unity game
- **Code Execution**: Execute arbitrary C# code in the Unity environment
- **Standardized Interface**: Use the MCP standard for compatibility with various AI assistants
- **Flexible Deployment**: Deploy as a Unity component, Docker container, or NPX package

### 2.3 Use Cases

- **Game Development**: AI-assisted coding, debugging, and testing for Unity games
- **Automated Testing**: Run and analyze tests without manual intervention
- **Scene Analysis**: Inspect and understand complex Unity scenes
- **Runtime Debugging**: Execute code to diagnose issues during runtime
- **Educational Tools**: Create interactive learning experiences for Unity development

## 3. Architecture

### 3.1 High-Level Architecture

The Unity-AI Bridge consists of several components that work together to provide MCP-compatible communication with Unity:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AI Assistant  │     │  MCP Client     │     │  Custom Client  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MCP Protocol Layer                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Unity-AI Bridge Core                         │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Runtime Code    │  │ Scene Analyzer  │  │ Test Runner     │  │
│  │ Executor        │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└────────┬────────────────────────┬────────────────────────┬──────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Unity Component │     │ Docker Container│     │   NPX Package   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 3.2 Core Components

#### 3.2.1 MCP Protocol Layer

Implements the Model Context Protocol to provide a standardized interface for AI assistants. This layer:
- Handles MCP server discovery
- Processes tool execution requests
- Formats responses according to MCP standards
- Manages authentication and authorization

#### 3.2.2 Unity-AI Bridge Core

Contains the core functionality for interacting with Unity:

1. **Runtime Code Executor**: Compiles and executes C# code in the Unity runtime
2. **Scene Analyzer**: Inspects game objects, components, and scene hierarchies
3. **Test Runner**: Runs tests and collects results
4. **Method Invoker**: Invokes methods on game objects and components
5. **State Manager**: Tracks and modifies game state

#### 3.2.3 Deployment Options

The Unity-AI Bridge can be deployed in three ways:

1. **Unity Component**: A MonoBehaviour that can be added to a Unity scene
2. **Docker Container**: A containerized version that communicates with Unity over the network
3. **NPX Package**: A Node.js package that can be installed and run via NPX

### 3.3 Communication Flow

1. The AI assistant sends a request through an MCP client
2. The MCP Protocol Layer receives and validates the request
3. The Unity-AI Bridge Core processes the request
4. The appropriate component (Code Executor, Scene Analyzer, etc.) performs the requested action
5. Results are returned through the MCP Protocol Layer to the AI assistant

## 4. Deployment Options

### 4.1 Unity Component

The Unity Component is a MonoBehaviour that can be added to any Unity scene:

```csharp
using UnityEngine;
using TrolleyGame.AIBridge;
using TrolleyGame.AIBridge.MCP;

public class UnityAIBridgeComponent : MonoBehaviour
{
    [SerializeField] private int port = 8080;
    [SerializeField] private bool startAutomatically = true;
    [SerializeField] private bool enableMCPSupport = true;

    private void Awake()
    {
        if (startAutomatically)
        {
            StartServer();
        }
    }

    public void StartServer()
    {
        // Start the server
    }

    public void StopServer()
    {
        // Stop the server
    }
}
```

#### 4.1.1 Installation

1. Add the `UnityAIBridgeComponent` script to a GameObject in your scene
2. Configure the port and other settings
3. Start the Unity Editor or build

#### 4.1.2 Configuration

- **Port**: The port to listen on for MCP requests
- **Start Automatically**: Whether to start the server automatically on Awake
- **Enable MCP Support**: Whether to enable MCP protocol support

### 4.2 Docker Container

The Docker Container runs the Unity-AI Bridge as a standalone server that communicates with Unity over the network:

```dockerfile
FROM node:18-slim

# Install required dependencies
RUN apt-get update && apt-get install -y \
    curl \
    netcat \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port used by the server
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV UNITY_HOST=host.docker.internal
ENV UNITY_PORT=8081

# Start the server
CMD ["node", "dist/server.js"]
```

#### 4.2.1 Installation

1. Build the Docker image:
   ```bash
   docker build -t unity-ai-bridge .
   ```

2. Run the Docker container:
   ```bash
   docker run -p 8080:8080 unity-ai-bridge
   ```

#### 4.2.2 Configuration

- **PORT**: The port to listen on for MCP requests
- **UNITY_HOST**: The hostname or IP address of the Unity Editor
- **UNITY_PORT**: The port that Unity is listening on

### 4.3 NPX Package

The NPX Package allows the Unity-AI Bridge to be installed and run via NPX:

```json
{
  "name": "unity-ai-bridge",
  "version": "1.0.0",
  "description": "MCP-compatible bridge for Unity and AI assistants",
  "main": "dist/index.js",
  "bin": {
    "unity-ai-bridge": "./bin/cli.js"
  },
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "test": "jest"
  }
}
```

#### 4.3.1 Installation

Install and run the package via NPX:

```bash
npx unity-ai-bridge start
```

#### 4.3.2 Configuration

Configure the package via command-line arguments:

```bash
npx unity-ai-bridge start --port 8080 --unity-host localhost --unity-port 8081
```

## 5. Direct Code Execution and Query Conventions

### 5.1 Direct C# Code Execution

The Unity-AI Bridge allows AI assistants to execute arbitrary C# code directly in Unity. This is sent as a string and executed as-is in the Unity environment:

```csharp
// This code is sent directly to Unity and executed
GameObject.Find("Player").transform.position.x = 10;
```

There is no translation or parsing layer - the code is executed directly in Unity's C# environment.

### 5.2 Query Conventions

While any valid C# code can be executed, the following conventions are recommended for accessing Unity objects:

#### 5.2.1 Finding GameObjects
```csharp
// Find a GameObject by name
GameObject.Find("Player")

// Find a GameObject by tag
GameObject.FindWithTag("Player")

// Find all GameObjects with a tag
GameObject.FindGameObjectsWithTag("Enemy")

// Access a child GameObject
GameObject.Find("Player").transform.Find("Weapon")
```

#### 5.2.2 Accessing Components
```csharp
// Get a component
GameObject.Find("Player").GetComponent<Rigidbody>()

// Get a specific component property
GameObject.Find("Player").GetComponent<Rigidbody>().mass

// Set a component property
GameObject.Find("Player").GetComponent<Rigidbody>().mass = 10

// Call a component method
GameObject.Find("Player").GetComponent<Rigidbody>().AddForce(new Vector3(0, 10, 0))
```

#### 5.2.3 Game-Specific Code
```csharp
// Find a game-specific object (if your game has a static access point)
TrolleyGame.TrolleySetup.Instance

// Access game-specific properties
TrolleyGame.TrolleySetup.Instance.tournament.GetCurrentMatch()

// Modify game state
TrolleyGame.TrolleySetup.Instance.MakeChoice(true)
```

### 5.3 Type Handling

When Unity returns results to the AI assistant, types are converted as follows:

#### 5.3.1 Basic Types
- **Numeric types** (int, float, etc.): Converted to JSON numbers
- **Strings**: Converted to JSON strings
- **Booleans**: Converted to JSON booleans
- **Null**: Converted to JSON null

#### 5.3.2 Unity Types
- **Vector2/3/4**: Converted to JSON objects with x, y, z, w properties
- **Quaternion**: Converted to JSON objects with x, y, z, w properties
- **Color**: Converted to JSON objects with r, g, b, a properties
- **GameObject/Component**: Converted to JSON objects with key properties and references

#### 5.3.3 Collections
- **Arrays**: Converted to JSON arrays
- **Lists**: Converted to JSON arrays
- **Dictionaries**: Converted to JSON objects

### 5.4 Error Handling

Code execution can fail for various reasons:

1. **Compilation Errors**: Invalid C# syntax
2. **Runtime Errors**: Exceptions thrown during execution
3. **Resolution Errors**: Cannot find an object or property
4. **Type Errors**: Type mismatch in method calls or assignments

All errors are returned with:
- Error type
- Error message
- Stack trace (for runtime errors)

## 6. MCP Integration

### 6.1 MCP Server Configuration

To add the Unity-AI Bridge to your MCP server list, add one of the following configurations:

#### 6.1.1 NPX Command

```json
{
  "mcpServers": {
    "unity-ai-bridge": {
      "command": "npx",
      "args": ["unity-ai-bridge", "start"],
      "env": {
        "UNITY_HOST": "localhost",
        "UNITY_PORT": "8081"
      }
    }
  }
}
```

#### 6.1.2 Docker Command

```json
{
  "mcpServers": {
    "unity-ai-bridge": {
      "command": "docker",
      "args": ["run", "--network=host", "unity-ai-bridge"],
      "env": {
        "UNITY_HOST": "localhost",
        "UNITY_PORT": "8081"
      }
    }
  }
}
```

#### 6.1.3 SSE Transport

```json
{
  "mcpServers": {
    "unity-ai-bridge": {
      "url": "http://localhost:8080/sse"
    }
  }
}
```

### 6.2 MCP Tool Definitions

The Unity-AI Bridge exposes exactly six tools through MCP:

#### 6.2.1 Execute Code

```json
{
  "id": "unity_execute_code",
  "description": "Execute C# code directly in Unity at runtime",
  "parameters": {
    "type": "object",
    "properties": {
      "code": {
        "type": "string",
        "description": "C# code to execute - this is sent directly to Unity and executed as-is"
      },
      "timeout": {
        "type": "number",
        "description": "Maximum time to wait in milliseconds before returning (default: 1000). If the operation takes longer, it continues in the background and a log_id is returned.",
        "default": 1000
      }
    },
    "required": ["code"]
  }
}
```

#### 6.2.2 Get Result

```json
{
  "id": "unity_get_result",
  "description": "Retrieve the result of a previously executed operation using its log ID",
  "parameters": {
    "type": "object",
    "properties": {
      "log_id": {
        "type": "string",
        "description": "The log ID returned from a previous operation"
      }
    },
    "required": ["log_id"]
  }
}
```

#### 6.2.3 Get Logs

```json
{
  "id": "unity_get_logs",
  "description": "Retrieve logs from Unity, including errors, messages, and custom logs",
  "parameters": {
    "type": "object",
    "properties": {
      "log_name": {
        "type": "string",
        "description": "Name of the log to retrieve (default: all logs)"
      },
      "limit": {
        "type": "number",
        "description": "Maximum number of log entries to return (default: 10)",
        "default": 10
      },
      "since": {
        "type": "string",
        "description": "Only return logs that occurred after this timestamp (ISO format)"
      },
      "log_type": {
        "type": "string",
        "description": "Type of logs to retrieve (error, warning, info, all)",
        "default": "all"
      }
    }
  }
}
```

#### 6.2.4 Get Log Details

```json
{
  "id": "unity_get_log_details",
  "description": "Retrieve detailed information about a specific log entry",
  "parameters": {
    "type": "object",
    "properties": {
      "log_id": {
        "type": "string",
        "description": "The ID of the log entry to retrieve details for"
      }
    },
    "required": ["log_id"]
  }
}
```

#### 6.2.5 Get Help

```json
{
  "id": "unity_help",
  "description": "Get documentation on the available commands and query syntax",
  "parameters": {
    "type": "object",
    "properties": {}
  }
}
```

## 7. Implementation Details

### 7.1 Runtime Code Executor

The Runtime Code Executor compiles and executes C# code directly in the Unity runtime:

```csharp
public class RuntimeCodeExecutor
{
    public object ExecuteCode(string code)
    {
        // Prepare the code for execution
        string fullCode = PrepareCode(code);

        // Compile the code directly in Unity
        Assembly assembly = CompileCode(fullCode);

        // Execute the code in Unity's context
        return InvokeExecuteMethod(assembly);
    }

    private string PrepareCode(string code)
    {
        // Wrap the code in a class with an Execute method
        // This allows the code to be compiled and executed
        return $@"
            using UnityEngine;
            using System;
            using System.Collections;
            using System.Collections.Generic;
            using System.Linq;

            public class DynamicExecutor
            {{
                public object Execute()
                {{
                    {code}
                }}
            }}
        ";
    }

    private Assembly CompileCode(string code)
    {
        // Compile the code into an assembly using Unity's built-in compiler
        // This executes the code directly in Unity's context
    }

    private object InvokeExecuteMethod(Assembly assembly)
    {
        // Create an instance of the DynamicExecutor class
        // Invoke the Execute method
        // Return the result
    }
}
```

### 7.2 Scene Analyzer

The Scene Analyzer inspects game objects, components, and scene hierarchies:

```csharp
public class SceneAnalyzer
{
    public object GetSceneInfo()
    {
        // Get information about all loaded scenes
    }

    public object GetGameObjectInfo(string gameObjectPath, bool includeChildren, bool includeComponents)
    {
        // Get information about a specific game object
    }

    public object FindGameObjects(string query, string searchType)
    {
        // Find game objects by name, tag, or component type
    }

    private object GetGameObjectInfo(GameObject go, bool includeChildren, bool includeComponents)
    {
        // Get information about a game object
    }

    private object GetComponentInfo(Component component)
    {
        // Get information about a component
    }
}
```

### 7.3 Test Runner

The Test Runner runs tests and collects results:

```csharp
public class TestRunner
{
    public object RunTest(string testName)
    {
        // Run a specific test
    }

    public object RunAllTests()
    {
        // Run all tests
    }

    private void OnTestFinished(ITest test, TestResult result)
    {
        // Called when a test is finished
    }

    private void OnRunFinished(ITestResult result)
    {
        // Called when all tests are finished
    }
}
```

### 7.4 Method Invoker

The Method Invoker invokes methods on game objects and components:

```csharp
public class MethodInvoker
{
    public object InvokeMethod(string gameObjectPath, string componentTypeName, string methodName, string[] parameters)
    {
        // Find the game object
        GameObject go = GameObject.Find(gameObjectPath);

        // Find the component
        Component component = go.GetComponent(Type.GetType(componentTypeName));

        // Find the method
        MethodInfo method = component.GetType().GetMethod(methodName);

        // Convert parameters
        object[] paramValues = ConvertParameters(parameters, method.GetParameters());

        // Invoke the method
        return method.Invoke(component, paramValues);
    }

    private object[] ConvertParameters(string[] parameters, ParameterInfo[] parameterInfos)
    {
        // Convert parameters from strings to the appropriate types
    }
}
```

### 7.5 Logging System

The Logging System provides a way for Unity developers to communicate with the AI assistant by writing to named logs. This enables bidirectional communication, where Unity can send information back to the AI assistant:

```csharp
public static class AI
{
    private static readonly Dictionary<string, List<LogEntry>> _logs = new Dictionary<string, List<LogEntry>>();
    private static readonly object _logLock = new object();

    /// <summary>
    /// Write a message to a named log
    /// </summary>
    public static string Write(string logName, object data, LogType logType = LogType.Info)
    {
        // Generate a unique log ID
        string logId = Guid.NewGuid().ToString();

        // Create log entry
        var entry = new LogEntry
        {
            LogId = logId,
            LogName = logName,
            Data = data,
            LogType = logType,
            Timestamp = DateTime.UtcNow
        };

        // Store the log entry
        lock (_logLock)
        {
            if (!_logs.ContainsKey(logName))
            {
                _logs[logName] = new List<LogEntry>();
            }

            _logs[logName].Add(entry);
        }

        // Write to Unity console based on log type
        switch (logType)
        {
            case LogType.Error:
                Debug.LogError($"[AI.{logName}] {JsonUtility.ToJson(data)}");
                break;
            case LogType.Warning:
                Debug.LogWarning($"[AI.{logName}] {JsonUtility.ToJson(data)}");
                break;
            default:
                Debug.Log($"[AI.{logName}] {JsonUtility.ToJson(data)}");
                break;
        }

        // Write to a file for persistence
        string logDir = Path.Combine(Application.persistentDataPath, "AI_Logs", logName);
        Directory.CreateDirectory(logDir);
        string logPath = Path.Combine(logDir, $"{logId}.json");
        File.WriteAllText(logPath, JsonUtility.ToJson(entry, true));

        return logId;
    }

    /// <summary>
    /// Write an error message to a named log
    /// </summary>
    public static string WriteError(string logName, Exception ex)
    {
        return Write(logName, new {
            Message = ex.Message,
            StackTrace = ex.StackTrace,
            ExceptionType = ex.GetType().FullName,
            InnerException = ex.InnerException?.Message
        }, LogType.Error);
    }

    /// <summary>
    /// Get recent logs from a named log
    /// </summary>
    public static List<LogEntry> GetLogs(string logName = null, int limit = 10, DateTime? since = null, LogType? logType = null)
    {
        lock (_logLock)
        {
            IEnumerable<LogEntry> query;

            if (string.IsNullOrEmpty(logName))
            {
                // Get logs from all log names
                query = _logs.Values.SelectMany(logs => logs);
            }
            else if (_logs.TryGetValue(logName, out var logs))
            {
                // Get logs from the specified log name
                query = logs;
            }
            else
            {
                // No logs found for the specified name
                return new List<LogEntry>();
            }

            // Apply filters
            if (since.HasValue)
            {
                query = query.Where(log => log.Timestamp >= since.Value);
            }

            if (logType.HasValue)
            {
                query = query.Where(log => log.LogType == logType.Value);
            }

            // Sort by timestamp (newest first) and take the specified number of logs
            return query.OrderByDescending(log => log.Timestamp).Take(limit).ToList();
        }
    }

    /// <summary>
    /// Get details for a specific log entry
    /// </summary>
    public static LogEntry GetLogDetails(string logId)
    {
        lock (_logLock)
        {
            // Search for the log entry in all logs
            foreach (var logs in _logs.Values)
            {
                var entry = logs.FirstOrDefault(log => log.LogId == logId);
                if (entry != null)
                {
                    return entry;
                }
            }

            // If not found in memory, try to load from file
            string logDir = Path.Combine(Application.persistentDataPath, "AI_Logs");
            if (Directory.Exists(logDir))
            {
                foreach (var dir in Directory.GetDirectories(logDir))
                {
                    string logPath = Path.Combine(dir, $"{logId}.json");
                    if (File.Exists(logPath))
                    {
                        string json = File.ReadAllText(logPath);
                        return JsonUtility.FromJson<LogEntry>(json);
                    }
                }
            }

            return null;
        }
    }

    /// <summary>
    /// Clean up old logs
    /// </summary>
    public static void CleanupOldLogs(TimeSpan maxAge)
    {
        var cutoffTime = DateTime.UtcNow - maxAge;

        lock (_logLock)
        {
            // Remove old logs from memory
            foreach (var logName in _logs.Keys.ToList())
            {
                _logs[logName] = _logs[logName].Where(log => log.Timestamp >= cutoffTime).ToList();
            }

            // Remove empty log lists
            foreach (var logName in _logs.Keys.ToList())
            {
                if (_logs[logName].Count == 0)
                {
                    _logs.Remove(logName);
                }
            }
        }

        // Remove old log files
        string logDir = Path.Combine(Application.persistentDataPath, "AI_Logs");
        if (Directory.Exists(logDir))
        {
            foreach (var dir in Directory.GetDirectories(logDir))
            {
                foreach (var file in Directory.GetFiles(dir, "*.json"))
                {
                    try
                    {
                        string json = File.ReadAllText(file);
                        var entry = JsonUtility.FromJson<LogEntry>(json);

                        if (entry.Timestamp < cutoffTime)
                        {
                            File.Delete(file);
                        }
                    }
                    catch
                    {
                        // If we can't parse the file, delete it
                        File.Delete(file);
                    }
                }

                // Remove empty directories
                if (Directory.GetFiles(dir).Length == 0)
                {
                    Directory.Delete(dir);
                }
            }
        }
    }
}

public enum LogType
{
    Info,
    Warning,
    Error
}

[Serializable]
public class LogEntry
{
    public string LogId;
    public string LogName;
    public object Data;
    public LogType LogType;
    public DateTime Timestamp;
}

## 8. Security Considerations

### 8.1 Code Execution

The Runtime Code Executor allows arbitrary C# code to be executed in the Unity runtime. This presents several security considerations:

1. **Sandbox Limitations**: Unity does not provide a true sandbox for code execution
2. **Access Control**: The executed code has the same permissions as the Unity Editor
3. **Resource Consumption**: Malicious code could consume excessive resources

#### 7.1.1 Mitigation Strategies

- Only allow trusted AI assistants to execute code
- Implement timeouts for code execution
- Monitor resource usage and terminate excessive consumption
- Consider implementing a whitelist of allowed operations

### 8.2 Network Communication

The Docker Container and NPX Package communicate with Unity over the network, which presents additional security considerations:

1. **Authentication**: Ensure only authorized clients can connect
2. **Encryption**: Protect data in transit
3. **Access Control**: Limit what operations can be performed

#### 7.2.1 Mitigation Strategies

- Implement API keys or other authentication mechanisms
- Use HTTPS for all communications
- Restrict access to specific IP addresses
- Implement rate limiting

## 9. Usage Examples

### 9.1 Execute Code

```python
# Python client example
client = AIBridgeClient()
result = client.execute_code("""
    // Get all fighters in the game
    return FighterDatabase.GetAllFighters().Select(f => f.displayName).ToArray();
""")
print(result)
```

### 9.2 Get Scene Info

```python
# Python client example
client = AIBridgeClient()
scene_info = client.get_scene_info()
print(scene_info)
```

### 9.3 Get Game Object Info

```python
# Python client example
client = AIBridgeClient()
game_object_info = client.get_game_object_info("TrolleySetup")
print(game_object_info)
```

### 9.4 Find Game Objects

```python
# Python client example
client = AIBridgeClient()
fighters = client.find_game_objects("Fighter", "component")
print(fighters)
```

### 9.5 Invoke Method

```python
# Python client example
client = AIBridgeClient()
result = client.invoke_method(
    "TrolleySetup",
    "TrolleyGame.TrolleySetup",
    "MakeChoice",
    ["true"]
)
print(result)
```

### 9.6 Run Tests

```python
# Python client example
client = AIBridgeClient()
test_results = client.run_test("Tests.FighterTests.Constructor_SetsPropertiesCorrectly")
print(test_results)
```

## 10. Integration with AI Assistants

### 10.1 Claude Integration

To use the Unity-AI Bridge with Claude:

1. Add the Unity-AI Bridge to your MCP server list:

```json
{
  "mcpServers": {
    "unity-ai-bridge": {
      "command": "npx",
      "args": ["unity-ai-bridge", "start"],
      "env": {
        "UNITY_HOST": "localhost",
        "UNITY_PORT": "8081"
      }
    }
  }
}
```

2. Start Unity with your project open
3. Ensure the Unity-AI Bridge component is added to your scene
4. Ask Claude to interact with your Unity project:

```
Can you tell me what GameObjects are in my current Unity scene?
```

Claude will:
1. Recognize this requires Unity interaction
2. Find the Unity-AI Bridge in your MCP server list
3. Use the `get_scene_info` tool
4. Analyze the results and report back to you

### 10.2 Other AI Assistants

The Unity-AI Bridge can be used with any AI assistant that supports MCP. The integration process will be similar to the Claude integration, but may vary depending on the specific AI assistant.

## 11. Conclusion

The Unity-AI Bridge with MCP compatibility provides a powerful way to connect AI assistants to Unity game development environments. By implementing the Model Context Protocol, it enables AI assistants to execute code, inspect game objects, analyze scenes, and run tests within Unity.

The flexible deployment options (Unity component, Docker container, NPX package) make it easy to integrate the Unity-AI Bridge into various workflows and environments. The standardized interface ensures compatibility with a wide range of AI assistants and tools.

As the MCP ecosystem grows, the Unity-AI Bridge will become an increasingly valuable tool for AI-assisted game development, enabling more efficient workflows and more powerful AI capabilities.

## 12. References

- [Model Context Protocol Specification](./01-model-context-protocol.md)
- [Unity Documentation](https://docs.unity3d.com/)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)
- [Anthropic Claude Documentation](https://docs.anthropic.com/)
