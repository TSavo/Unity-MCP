# MCP Server Tools

This document provides detailed information about the tools available in the MCP server, including their parameters, return values, and examples of how to use them.

## Overview

The MCP server provides a set of tools that can be used to interact with Unity at runtime. These tools are exposed through the MCP STDIO client, which allows Claude to execute them and receive the results.

## Available Tools

### unity_execute_code

Executes C# code in Unity at runtime.

#### Parameters

- `code` (string, required): C# code to execute
- `timeout` (number, optional): Maximum time to wait in milliseconds before returning (default: 1000)

#### Return Value

```json
{
  "status": "success",
  "log_id": "bfc24c7f-351f-4429-9f6d-6f92c682e4da",
  "result": {
    "result": {
      "mockResult": true,
      "code": "System.Environment.MachineName",
      "message": "This is a custom mock response added during hot reloading test!",
      "timestamp": "04/07/2025 20:51:44",
      "version": "2.0.0"
    },
    "logs": [
      "[MOCK] Code executed successfully"
    ],
    "executionTime": 165
  },
  "is_complete": true,
  "message": "Operation completed successfully"
}
```

#### Example

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "execute_code",
    "arguments": {
      "code": "return System.Environment.MachineName;",
      "timeout": 5000
    }
  }
}
```

### unity_query

Executes a query using dot notation to access objects, properties, and methods.

#### Parameters

- `query` (string, required): Query string using dot notation (e.g., Scene['Player'].transform.position)
- `timeout` (number, optional): Maximum time to wait in milliseconds before returning (default: 1000)

#### Return Value

```json
{
  "status": "success",
  "log_id": "507d6cef-bf21-4811-911e-0f5f8b9e75a5",
  "result": {
    "result": {
      "mockResult": true,
      "query": "UnityEngine.Application.version",
      "message": "This is a custom mock response added during hot reloading test!",
      "timestamp": "04/07/2025 20:52:15",
      "version": "2.0.0"
    },
    "logs": [
      "[MOCK] Query executed successfully"
    ],
    "executionTime": 176
  },
  "is_complete": true,
  "message": "Operation completed successfully"
}
```

#### Example

```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "tools/call",
  "params": {
    "name": "query",
    "arguments": {
      "query": "UnityEngine.Application.version",
      "timeout": 5000
    }
  }
}
```

### unity_get_result

Retrieves the result of a previously executed operation using its log ID.

#### Parameters

- `log_id` (string, required): The log ID returned from a previous operation

#### Return Value

```json
{
  "status": "success",
  "log_id": "03c6281c-f6db-42b3-ae59-b0d04df536c1",
  "result": {
    "status": "success",
    "logId": "bfc24c7f-351f-4429-9f6d-6f92c682e4da",
    "result": {
      "result": {
        "mockResult": true,
        "code": "System.Environment.MachineName",
        "message": "This is a custom mock response added during hot reloading test!",
        "timestamp": "04/07/2025 20:51:44",
        "version": "2.0.0"
      },
      "logs": [
        "[MOCK] Code executed successfully"
      ],
      "executionTime": 165
    },
    "isComplete": true,
    "startTime": 1744059104633,
    "endTime": 1744059104818,
    "message": "Operation completed successfully",
    "_id": "D0HjCOD6zcriOo1a"
  },
  "is_complete": true,
  "message": "Operation completed successfully"
}
```

#### Example

```json
{
  "jsonrpc": "2.0",
  "id": "3",
  "method": "tools/call",
  "params": {
    "name": "get_result",
    "arguments": {
      "logId": "bfc24c7f-351f-4429-9f6d-6f92c682e4da"
    }
  }
}
```

### unity_get_logs

Retrieves logs from Unity, including errors, messages, and custom logs.

#### Parameters

- `count` (number, optional): Maximum number of log entries to return (default: 10)
- `offset` (number, optional): Offset for pagination (default: 0)

#### Return Value

```json
{
  "status": "success",
  "operations": [
    {
      "logId": "7d541a08-d482-4949-97e8-943df1c73b0c",
      "status": "error",
      "isComplete": true,
      "startTime": 1744058995054,
      "endTime": 1744058995055,
      "operationType": "undefined"
    },
    {
      "logId": "bca53fea-b10d-4755-be23-8f50bb794b83",
      "status": "success",
      "isComplete": true,
      "startTime": 1744057150825,
      "endTime": 1744057151007,
      "operationType": "object"
    },
    // ... more logs
  ]
}
```

#### Example

```json
{
  "jsonrpc": "2.0",
  "id": "4",
  "method": "tools/call",
  "params": {
    "name": "get_logs",
    "arguments": {
      "count": 5
    }
  }
}
```

### unity_get_log_details

Retrieves detailed information about a specific log entry.

#### Parameters

- `log_id` (string, required): The log ID to retrieve details for

#### Return Value

```json
{
  "status": "success",
  "log_id": "853ba79c-9e7f-495c-98f7-3d82835c7773",
  "result": {
    "id": "bfc24c7f-351f-4429-9f6d-6f92c682e4da",
    "message": "Detailed log message",
    "timestamp": "2025-04-07T20:52:05.007Z",
    "type": "info",
    "stackTrace": "Stack trace...",
    "context": {
      "scene": "Main"
    }
  },
  "is_complete": true,
  "message": "Operation completed successfully"
}
```

#### Example

```json
{
  "jsonrpc": "2.0",
  "id": "5",
  "method": "tools/call",
  "params": {
    "name": "get_log_details",
    "arguments": {
      "logId": "bfc24c7f-351f-4429-9f6d-6f92c682e4da"
    }
  }
}
```

### unity_help

Retrieves help documentation for all available tools.

#### Parameters

None

#### Return Value

```json
{
  "status": "success",
  "log_id": "c7d2fc2e-09e1-4dc5-b0d8-9952e3779f3c",
  "result": {
    "documentation": "Unity-AI Bridge Help Documentation",
    "tools": [
      {
        "id": "unity_execute_code",
        "description": "Execute C# code in Unity at runtime"
      },
      {
        "id": "unity_query",
        "description": "Execute a query using dot notation to access objects, properties, and methods"
      },
      {
        "id": "unity_get_result",
        "description": "Retrieve the result of a previously executed operation using its log ID"
      },
      {
        "id": "unity_get_logs",
        "description": "Retrieve logs from Unity, including errors, messages, and custom logs"
      },
      {
        "id": "unity_get_log_details",
        "description": "Retrieve detailed information about a specific log entry"
      },
      {
        "id": "unity_help",
        "description": "Retrieve help documentation for all available tools"
      }
    ]
  },
  "is_complete": true,
  "message": "Operation completed successfully"
}
```

#### Example

```json
{
  "jsonrpc": "2.0",
  "id": "6",
  "method": "tools/call",
  "params": {
    "name": "help",
    "arguments": {}
  }
}
```

## Using the Tools with the MCP STDIO Client

The MCP STDIO client provides a convenient way to execute these tools from the command line. Here's an example of how to execute the unity_execute_code tool:

```bash
echo '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"execute_code","arguments":{"code":"return System.Environment.MachineName;","timeout":5000}}}' | node dist/mcp-stdio-client/index.js
```

The MCP STDIO client will send the request to the MCP server, which will execute the tool and return the result.

## Error Handling

If an error occurs while executing a tool, the MCP server will return an error response with a status code of 400 or 500, depending on the type of error. Here's an example of an error response:

```json
{
  "status": "error",
  "log_id": "7d541a08-d482-4949-97e8-943df1c73b0c",
  "error": "Unsupported tool: unity_get_result",
  "is_complete": true
}
```

## Asynchronous Operations

Some tools, such as unity_execute_code and unity_query, can take a long time to complete. In these cases, the MCP server will return a response with a log ID that can be used to retrieve the result later using the unity_get_result tool.

Here's an example of how to execute a long-running operation and retrieve the result:

1. Execute the operation:

```bash
echo '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"execute_code","arguments":{"code":"System.Threading.Thread.Sleep(5000); return \"Done\";","timeout":1000}}}' | node dist/mcp-stdio-client/index.js
```

2. Retrieve the result using the log ID from the previous response:

```bash
echo '{"jsonrpc":"2.0","id":"2","method":"tools/call","params":{"name":"get_result","arguments":{"logId":"bfc24c7f-351f-4429-9f6d-6f92c682e4da"}}}' | node dist/mcp-stdio-client/index.js
```

## Best Practices

1. **Use Timeouts**: When executing long-running operations, use an appropriate timeout value to avoid blocking the MCP server.

2. **Handle Errors**: Always check the status of the response to ensure that the operation completed successfully.

3. **Use Log IDs**: When executing long-running operations, use the log ID to retrieve the result later.

4. **Check Completion Status**: When retrieving results, check the is_complete field to ensure that the operation has completed.

5. **Use the Help Tool**: If you're not sure which tools are available or how to use them, use the unity_help tool to retrieve help documentation.

6. **Use the Get Logs Tool**: If you're not sure which operations have been executed, use the unity_get_logs tool to retrieve a list of all operations.

7. **Use the Get Log Details Tool**: If you need more information about a specific operation, use the unity_get_log_details tool to retrieve detailed information about the operation.
