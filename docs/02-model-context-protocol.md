# Model Context Protocol (MCP) in Unity-MCP

## Overview

The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to Large Language Models (LLMs). It creates a universal interface for connecting AI systems with data sources and tools, replacing fragmented integrations with a single, consistent protocol.

This document explains how the Unity-MCP project implements the Model Context Protocol to enable AI assistants like Claude to interact with Unity game environments.

## MCP Specification

The official MCP specification can be found at [spec.modelcontextprotocol.io](https://spec.modelcontextprotocol.io/). The specification defines:

1. **Message Format**: JSON-RPC 2.0 messages for all communication
2. **Transport Mechanisms**: How clients and servers communicate
3. **Capabilities**: What features a server can provide
4. **Tools**: Functions that clients can invoke
5. **Resources**: Data that clients can access

## MCP TypeScript SDK

Unity-MCP uses the official MCP TypeScript SDK from [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) to implement the MCP protocol. The SDK provides:

1. **Server Implementation**: Classes for implementing MCP servers
2. **Transport Implementations**: Classes for implementing transport mechanisms
3. **Tool Definitions**: Utilities for defining tools
4. **Type Definitions**: TypeScript types for MCP messages

## Transport Mechanisms

MCP supports two primary transport mechanisms:

### stdio Transport

- Runs on the **local machine**
- Managed automatically by the MCP host (Claude)
- Communicates directly via `stdin`/`stdout`
- Only accessible locally
- Input: Valid shell command that is run by the host

This is the primary transport mechanism used by Claude and other AI assistants, and the one implemented in Unity-MCP.

### Streamable HTTP Transport

- Can run **locally or remotely**
- Managed and run independently
- Communicates **over the network**
- Can be **shared** across machines

This is an alternative transport mechanism not currently used in Unity-MCP.

## JSON-RPC 2.0

MCP uses JSON-RPC 2.0 for all communication. Here are examples of the message format:

### Request Format

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

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"x\":0,\"y\":1,\"z\":0}"
      }
    ]
  }
}
```

### Error Format

```json
{
  "jsonrpc": "2.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": {
      "details": "Error executing code: NullReferenceException"
    }
  }
}
```

## MCP Server Lifecycle

The lifecycle of an MCP server is as follows:

1. **Initialization**:
   - The client launches the server as a subprocess
   - The client sends an `initialize` request to the server
   - The server responds with its capabilities

2. **Operation**:
   - The client sends requests to the server
   - The server processes the requests and sends responses

3. **Termination**:
   - The client sends a `shutdown` request to the server
   - The server cleans up resources and exits

## Unity-MCP Implementation

Unity-MCP implements the MCP protocol using the official TypeScript SDK:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "Unity-MCP",
  version: "1.0.0"
});

// Add tools
server.tool("execute_code",
  { 
    code: z.string().describe("C# code to execute in Unity"), 
    timeout: z.number().optional().describe("Timeout in milliseconds (default: 1000)")
  },
  async ({ code, timeout = 1000 }) => {
    // Implementation...
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
```

## MCP Tools in Unity-MCP

Unity-MCP exposes the following tools to Claude:

1. **execute_code**: Executes C# code in Unity at runtime
2. **query**: Executes a query using dot notation to access objects and properties
3. **get_result**: Retrieves the result of a previously executed operation
4. **get_logs**: Retrieves logs from Unity
5. **get_log_details**: Retrieves detailed information about a specific log entry
6. **help**: Returns documentation on the available commands and query syntax

## Communication Flow

The communication flow between Claude and Unity using MCP is as follows:

1. Claude launches the MCP STDIO Client as a subprocess
2. Claude sends a JSON-RPC request to the client's stdin
3. MCP STDIO Client processes the request and forwards it to the Web Server via HTTP
4. Web Server generates a Log GUID and forwards the request to Unity Integration via WebSocket
5. Unity Integration executes the code in Unity
6. Unity Integration sends the result back to the Web Server
7. Web Server stores the result with the Log GUID
8. Web Server returns the result (or just the Log GUID for long-running operations) to the MCP STDIO Client
9. MCP STDIO Client formats the response as a JSON-RPC message and writes it to stdout
10. Claude receives and processes the response

## Asynchronous Operations

MCP supports asynchronous operations through the use of Log GUIDs:

1. When Claude invokes a tool, the MCP STDIO Client forwards the request to the Web Server
2. The Web Server generates a Log GUID and forwards the request to Unity
3. If the operation completes within the timeout, the result is returned immediately
4. If the operation exceeds the timeout, only the Log GUID is returned
5. Claude can use the `get_result` tool to check for completion and retrieve the result using the Log GUID

## References

- [Official MCP Documentation](https://modelcontextprotocol.io/)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)
