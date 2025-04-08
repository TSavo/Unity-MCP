# Query Tool

This document explains how the query tool works in the Unity-MCP project.

## Overview

The query tool allows Claude to query Unity objects using dot notation. It provides a simple way to access properties, methods, and fields of Unity objects without having to write full C# code.

## Implementation

The query tool is implemented as follows:

1. Claude sends a query request to the MCP STDIO Client
2. The MCP STDIO Client forwards the request to the Unity Client's `/api/CodeExecution/query` endpoint
3. The Unity Client (running as an Editor extension) wraps the query in a `return` statement (e.g., `return GameObject.Find("Player").transform.position;`)
4. The Unity Client executes the wrapped query as C# code in either Edit Mode or Play Mode
5. The Unity Client returns the result to the MCP STDIO Client
6. The MCP STDIO Client stores the result in AILogger
7. The MCP STDIO Client returns the result to Claude

This approach allows for a simple, intuitive syntax for querying Unity objects while leveraging the existing code execution infrastructure. Because the Unity Client is implemented as an Editor extension rather than a MonoBehaviour, it can execute queries whether the game is running or not.

## Example Usage

### Basic Property Access

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "query",
    "arguments": {
      "query": "Camera.main.transform.position",
      "timeout": 1000
    }
  }
}
```

This query returns the position of the main camera.

### Method Calls

```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "tools/call",
  "params": {
    "name": "query",
    "arguments": {
      "query": "GameObject.Find(\"Player\").GetComponent<Renderer>().material.color",
      "timeout": 1000
    }
  }
}
```

This query finds the Player game object, gets its Renderer component, and returns the color of its material.

### Static Methods

```json
{
  "jsonrpc": "2.0",
  "id": "3",
  "method": "tools/call",
  "params": {
    "name": "query",
    "arguments": {
      "query": "UnityEngine.Physics.gravity",
      "timeout": 1000
    }
  }
}
```

This query returns the current gravity vector.

## Limitations

- The query must be a valid C# expression that can be evaluated
- The query cannot contain statements (e.g., variable declarations, loops, etc.)
- The query must return a value
- The query cannot modify the state of the Unity scene (use the execute_code tool for that)
- In Edit Mode, only a subset of queries are supported (primarily scene object access)

## Best Practices

- Use the query tool for reading state, not modifying it
- Keep queries simple and focused
- Use the execute_code tool for more complex operations
- Use appropriate timeouts for queries that might take a long time to execute
- Be aware of the differences between Edit Mode and Play Mode when querying Unity objects
