# Tools and Capabilities

## Overview

Unity-MCP provides a set of tools and capabilities that enable AI assistants to interact with Unity game environments. This document describes the tools and capabilities provided by Unity-MCP and how they can be used.

## MCP Tools

Unity-MCP exposes the following tools to Claude and other AI assistants through the MCP protocol:

### 1. execute_code

Executes C# code in Unity at runtime.

**Parameters:**
- `code` (string, required): C# code to execute
- `timeout` (number, optional): Timeout in milliseconds (default: 1000)

**Returns:**
- The result of the code execution

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "invoke",
  "params": {
    "name": "execute_code",
    "parameters": {
      "code": "return GameObject.Find(\"Player\").transform.position;",
      "timeout": 1000
    }
  }
}
```

**Use Cases:**
- Execute arbitrary C# code in Unity
- Modify game objects and components
- Create new game objects
- Run game logic
- Access Unity APIs

### 2. query

Executes a query using dot notation to access objects, properties, and methods.

**Parameters:**
- `query` (string, required): Query using dot notation
- `timeout` (number, optional): Timeout in milliseconds (default: 1000)

**Returns:**
- The result of the query

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "invoke",
  "params": {
    "name": "query",
    "parameters": {
      "query": "GameObject.Find(\"Player\").transform.position",
      "timeout": 1000
    }
  }
}
```

**Use Cases:**
- Access properties of game objects and components
- Get the position, rotation, or scale of objects
- Check the state of game objects
- Retrieve component values

### 3. get_result

Retrieves the result of a previously executed operation.

**Parameters:**
- `logId` (string, required): Log ID of the result to retrieve

**Returns:**
- The result associated with the Log ID

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "invoke",
  "params": {
    "name": "get_result",
    "parameters": {
      "logId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Use Cases:**
- Retrieve the result of a long-running operation
- Check if an operation has completed
- Get the result of an operation that exceeded the timeout

### 4. get_logs

Retrieves logs from Unity.

**Parameters:**
- `count` (number, optional): Number of logs to retrieve (default: 10)
- `offset` (number, optional): Offset for pagination (default: 0)

**Returns:**
- Array of logs

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "invoke",
  "params": {
    "name": "get_logs",
    "parameters": {
      "count": 10,
      "offset": 0
    }
  }
}
```

**Use Cases:**
- Retrieve logs from Unity
- Monitor game events
- Debug issues
- Track player actions

### 5. get_log_details

Retrieves detailed information about a specific log entry.

**Parameters:**
- `logId` (string, required): Log ID of the log entry

**Returns:**
- Detailed information about the log entry

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "invoke",
  "params": {
    "name": "get_log_details",
    "parameters": {
      "logId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Use Cases:**
- Get detailed information about a specific log entry
- Analyze errors
- Debug issues
- Track specific events

### 6. help

Returns documentation on the available commands and query syntax.

**Parameters:**
- None

**Returns:**
- Documentation on the available commands and query syntax

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "invoke",
  "params": {
    "name": "help",
    "parameters": {}
  }
}
```

**Use Cases:**
- Get help on available commands
- Learn about query syntax
- Discover available tools
- Understand how to use the system

## Direct Code Execution

Unity-MCP allows executing arbitrary C# code directly in Unity. This is a powerful capability that enables AI assistants to interact with Unity in a flexible way.

### Code Execution Examples

#### Finding Game Objects

```csharp
// Find a GameObject by name
GameObject player = GameObject.Find("Player");

// Find a GameObject by tag
GameObject player = GameObject.FindWithTag("Player");

// Find all GameObjects with a tag
GameObject[] enemies = GameObject.FindGameObjectsWithTag("Enemy");

// Access a child GameObject
Transform weapon = GameObject.Find("Player").transform.Find("Weapon");
```

#### Accessing Components

```csharp
// Get a component
Rigidbody rb = GameObject.Find("Player").GetComponent<Rigidbody>();

// Get a specific component property
float mass = GameObject.Find("Player").GetComponent<Rigidbody>().mass;

// Set a component property
GameObject.Find("Player").GetComponent<Rigidbody>().mass = 10;

// Call a component method
GameObject.Find("Player").GetComponent<Rigidbody>().AddForce(new Vector3(0, 10, 0));
```

#### Creating Game Objects

```csharp
// Create a new GameObject
GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);

// Set its position
cube.transform.position = new Vector3(0, 1, 0);

// Add a component
cube.AddComponent<Rigidbody>();
```

#### Modifying Game State

```csharp
// Get a reference to a game manager
GameManager gameManager = GameObject.Find("GameManager").GetComponent<GameManager>();

// Call a method on the game manager
gameManager.StartGame();

// Set a property on the game manager
gameManager.score = 100;
```

### Query Syntax

While any valid C# code can be executed, Unity-MCP provides a query syntax that makes it easier to access objects and properties:

```csharp
// Access a property
GameObject.Find("Player").transform.position

// Call a method
GameObject.Find("Player").GetComponent<Rigidbody>().AddForce(new Vector3(0, 10, 0))

// Access a static property
Time.deltaTime

// Access a static method
Mathf.Sin(Time.time)
```

## Asynchronous Operations

Unity-MCP supports asynchronous operations through the use of Log GUIDs:

1. When Claude invokes a tool, the MCP STDIO Client forwards the request to the Web Server
2. The Web Server generates a Log GUID and forwards the request to Unity
3. If the operation completes within the timeout, the result is returned immediately
4. If the operation exceeds the timeout, only the Log GUID is returned
5. Claude can use the `get_result` tool to check for completion and retrieve the result using the Log GUID

### Example of Asynchronous Operation

```json
// Initial request
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "invoke",
  "params": {
    "name": "execute_code",
    "parameters": {
      "code": "// Long-running operation\nSystem.Threading.Thread.Sleep(2000);\nreturn \"Operation completed\";"
    }
  }
}

// Response (operation still running)
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"result\":null,\"logId\":\"550e8400-e29b-41d4-a716-446655440000\",\"complete\":false,\"message\":\"Operation is still running. Use get_result to check for completion.\"}"
      }
    ]
  }
}

// Check for completion
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "method": "invoke",
  "params": {
    "name": "get_result",
    "parameters": {
      "logId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}

// Response (operation completed)
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"result\":\"Operation completed\",\"logId\":\"550e8400-e29b-41d4-a716-446655440000\",\"complete\":true}"
      }
    ]
  }
}
```

## Unity SDK Capabilities

The Unity SDK provides a clean API for Unity developers to interact with the system:

```csharp
// Write data to a named result
AI.Result("player_stats").Write(playerData);

// Append to a log
AI.Result("game_log").Append(logEntry);

// Clear a result
AI.Result("temp_data").Clear();

// Log a message
AI.Log("Player reached checkpoint");

// Log an error
AI.LogError("Failed to load level");

// Log a warning
AI.LogWarning("Low memory");
```

This API makes it easy for Unity developers to provide information to AI assistants without having to understand the underlying communication details.

## Type Handling

When Unity returns results to the AI assistant, types are converted as follows:

### Basic Types
- **Numeric types** (int, float, etc.): Converted to JSON numbers
- **Strings**: Converted to JSON strings
- **Booleans**: Converted to JSON booleans
- **Null**: Converted to JSON null

### Unity Types
- **Vector2/3/4**: Converted to JSON objects with x, y, z, w properties
- **Quaternion**: Converted to JSON objects with x, y, z, w properties
- **Color**: Converted to JSON objects with r, g, b, a properties
- **GameObject/Component**: Converted to JSON objects with key properties and references

### Collections
- **Arrays**: Converted to JSON arrays
- **Lists**: Converted to JSON arrays
- **Dictionaries**: Converted to JSON objects

## Error Handling

Unity-MCP provides comprehensive error handling for code execution:

### Compilation Errors

If the code fails to compile, the error message will include the compilation errors:

```json
{
  "success": false,
  "error": "Compilation errors:\n1: The name 'GameObjec' does not exist in the current context",
  "logs": [],
  "errors": []
}
```

### Runtime Errors

If the code throws an exception during execution, the error message will include the exception details:

```json
{
  "success": false,
  "error": "NullReferenceException: Object reference not set to an instance of an object",
  "logs": [],
  "errors": ["NullReferenceException: Object reference not set to an instance of an object\n  at McpScript.Execute () [0x00000] in <filename unknown>:0"]
}
```

### Connection Errors

If Unity is not connected to the Web Server, the error message will indicate this:

```json
{
  "success": false,
  "error": "Unity is not connected",
  "logId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Conclusion

Unity-MCP provides a powerful set of tools and capabilities that enable AI assistants to interact with Unity game environments. By combining direct code execution, query syntax, asynchronous operations, and a clean SDK API, it offers a flexible and comprehensive solution for AI-assisted game development.
