# AI Assistant Integration

This document provides detailed instructions on how to integrate the Unity-MCP bridge with AI assistants.

## Overview

The Unity-MCP bridge allows AI assistants to interact with Unity game environments through the Model Context Protocol (MCP). This enables AI-assisted game development, automated testing, scene analysis, and runtime debugging.

## Prerequisites

Before integrating with an AI assistant, make sure you have:

1. The TypeScript MCP server running on port 8080
2. The C# Unity client running on port 8081
3. An AI assistant that supports the Model Context Protocol (MCP)

## MCP Configuration

To connect the Unity-MCP bridge to an AI assistant, you need to create an MCP configuration file:

```json
{
  "mcpServers": {
    "unity-ai-bridge": {
      "url": "http://localhost:8080/sse"
    }
  }
}
```

This configuration uses the Server-Sent Events (SSE) transport, which is the most reliable option for our current implementation.

## Configuration Placement

The location of the MCP configuration file depends on the AI assistant you're using:

### Claude Desktop App

For the Claude Desktop app, place the MCP configuration file in the following location:

- Windows: `%APPDATA%\Claude\mcp-config.json`
- macOS: `~/Library/Application Support/Claude/mcp-config.json`
- Linux: `~/.config/Claude/mcp-config.json`

### Other AI Assistants

For other AI assistants, consult their documentation for the appropriate location for MCP configuration files.

## Available Tools

The Unity-MCP bridge provides the following tools:

### 1. unity_execute_code

Execute C# code directly in Unity.

```json
{
  "tool_id": "unity_execute_code",
  "parameters": {
    "code": "GameObject.Find(\"Player\").transform.position = new Vector3(0, 1, 0);",
    "timeout": 1000
  }
}
```

### 2. unity_query

Execute a query using dot notation to access objects, properties, and methods.

```json
{
  "tool_id": "unity_query",
  "parameters": {
    "query": "Scene['Player'].transform.position",
    "timeout": 1000
  }
}
```

### 3. unity_get_result

Retrieve the result of a previously executed operation using its log ID.

```json
{
  "tool_id": "unity_get_result",
  "parameters": {
    "log_id": "12345678-1234-1234-1234-123456789012"
  }
}
```

### 4. unity_get_logs

Retrieve logs from Unity, including errors, messages, and custom logs.

```json
{
  "tool_id": "unity_get_logs",
  "parameters": {
    "log_name": "all",
    "limit": 10,
    "log_type": "all"
  }
}
```

### 5. unity_get_log_details

Retrieve detailed information about a specific log entry.

```json
{
  "tool_id": "unity_get_log_details",
  "parameters": {
    "log_id": "12345678-1234-1234-1234-123456789012"
  }
}
```

### 6. unity_help

Get documentation on the available commands and query syntax.

```json
{
  "tool_id": "unity_help",
  "parameters": {}
}
```

## Example Usage

Once the AI assistant has access to the Unity tool, you can ask it to perform tasks like:

```
Can you execute the following C# code in Unity?

GameObject.Find("Player").transform.position = new Vector3(0, 1, 0);
```

Or:

```
What is the current position of the Player object in my Unity scene?
```

The AI assistant will:
1. Recognize this requires Unity interaction
2. Use the appropriate tool (e.g., `unity_execute_code` or `unity_query`)
3. Send the request to the Unity-MCP server
4. The Unity-MCP server will forward the request to the C# Unity client
5. The C# Unity client will execute the request in Unity
6. The result will be returned to the AI assistant
7. The AI assistant will display the result to you

## Troubleshooting

If the AI assistant is unable to connect to the Unity-MCP bridge, check the following:

1. Make sure both the TypeScript MCP server and C# Unity client are running
2. Verify that the MCP configuration file is in the correct location
3. Check that the URL in the MCP configuration file is correct
4. Look for any error messages in the console output of the TypeScript MCP server and C# Unity client

## Security Considerations

The Unity-MCP bridge allows arbitrary C# code to be executed in Unity. This presents several security considerations:

1. **Sandbox Limitations**: Unity does not provide a true sandbox for code execution
2. **Access Control**: The executed code has the same permissions as the Unity Editor
3. **Resource Consumption**: Malicious code could consume excessive resources

Only allow trusted AI assistants to execute code in Unity.
