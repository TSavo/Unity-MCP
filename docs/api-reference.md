# MCP Server API Reference

This document provides detailed information about the API endpoints exposed by the MCP server, including request and response formats.

## Endpoints

### GET /manifest

Returns the server manifest, which describes the available tools and resources.

#### Response

```json
{
  "schema_version": "v1",
  "name": "unity-mcp",
  "description": "Unity-AI Bridge with MCP compatibility",
  "tools": [
    {
      "id": "unity_execute_code",
      "description": "Execute C# code in Unity at runtime",
      "parameters": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "description": "C# code to execute"
          },
          "timeout": {
            "type": "number",
            "description": "Maximum time to wait in milliseconds before returning (default: 1000)",
            "default": 1000
          }
        },
        "required": ["code"]
      }
    },
    {
      "id": "unity_query",
      "description": "Execute a query using dot notation to access objects, properties, and methods",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Query string using dot notation (e.g., Scene['Player'].transform.position)"
          },
          "timeout": {
            "type": "number",
            "description": "Maximum time to wait in milliseconds before returning (default: 1000)",
            "default": 1000
          }
        },
        "required": ["query"]
      }
    },
    // Other tools...
  ]
}
```

### POST /tools

Executes a tool with the provided parameters.

#### Request

```json
{
  "tool_id": "unity_execute_code",
  "parameters": {
    "code": "Debug.Log(\"Hello, World!\");"
  }
}
```

#### Response (Success)

```json
{
  "status": "success",
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "message": "Code executed successfully"
  },
  "is_complete": true,
  "message": "Tool unity_execute_code executed successfully."
}
```

#### Response (Error)

```json
{
  "status": "error",
  "error": "Tool not found: invalid_tool"
}
```

#### Response (Timeout)

```json
{
  "status": "timeout",
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "partial_result": {
    "message": "Operation is still running"
  },
  "is_complete": false,
  "message": "Operation timed out, but is still running in the background. Use the log_id to retrieve the result later."
}
```

### GET /results/:logId

Retrieves the result of a previously executed operation.

#### Response (Success)

```json
{
  "status": "success",
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "message": "Code executed successfully"
  },
  "is_complete": true,
  "message": "Tool unity_execute_code executed successfully."
}
```

#### Response (Error)

```json
{
  "status": "error",
  "error": "Result not found for log ID: invalid-log-id"
}
```

### GET /sse

Establishes a Server-Sent Events (SSE) connection for real-time updates.

#### Events

- **connected**: Sent when the connection is established.
- **heartbeat**: Sent every 30 seconds to keep the connection alive.
- **result**: Sent when a tool execution completes.

#### Example Event

```
event: result
data: {"log_id":"550e8400-e29b-41d4-a716-446655440000","status":"success","result":{"message":"Code executed successfully"},"is_complete":true}
```

### GET /help

Returns documentation on the available commands and query syntax.

#### Response

```json
{
  "status": "success",
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
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
      // Other tools...
    ]
  },
  "is_complete": true,
  "message": "Help documentation retrieved successfully."
}
```

## Error Handling

The MCP server returns appropriate HTTP status codes and error messages for different types of errors:

- **400 Bad Request**: Invalid request format, missing required parameters, or invalid parameter types.
- **404 Not Found**: Resource not found (e.g., invalid log ID).
- **429 Too Many Requests**: Rate limit exceeded.
- **500 Internal Server Error**: Server-side error.

### Error Response Format

```json
{
  "status": "error",
  "error": "Detailed error message"
}
```

## Rate Limiting

The MCP server implements rate limiting to prevent abuse. By default, clients are limited to 5 requests per minute. When the rate limit is exceeded, the server returns a 429 status code with an error message.

## Authentication

The MCP server does not currently implement authentication. It is recommended to run the server on a secure network or implement authentication at the network level.
