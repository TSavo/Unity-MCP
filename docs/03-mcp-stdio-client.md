# MCP STDIO Client

## Overview

The MCP STDIO Client is a command-line tool that implements the Model Context Protocol (MCP) using the official TypeScript SDK. It serves as the entry point for AI assistants like Claude to interact with Unity.

## Implementation

The MCP STDIO Client is built using the official MCP TypeScript SDK from [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk). It uses the `StdioServerTransport` to communicate with Claude via stdin/stdout and forwards requests to the Web Server.

### Key Components

1. **MCP Server**: Implements the MCP protocol using the `McpServer` class from the SDK.
2. **STDIO Transport**: Uses the `StdioServerTransport` class to communicate with Claude.
3. **HTTP Client**: Communicates with the Web Server via HTTP.
4. **Tool Definitions**: Defines the tools that Claude can use to interact with Unity.

## Code Example

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

// Configuration
const WEB_SERVER_URL = "http://localhost:8080";

// Create an MCP server
const server = new McpServer({
  name: "Unity-MCP",
  version: "1.0.0"
});

// Add tools that communicate with the Web Server
server.tool("execute_code",
  { 
    code: z.string().describe("C# code to execute in Unity"), 
    timeout: z.number().optional().describe("Timeout in milliseconds (default: 1000)")
  },
  async ({ code, timeout = 1000 }) => {
    try {
      // Forward to Web Server
      const response = await axios.post(`${WEB_SERVER_URL}/api/execute`, {
        code,
        timeout
      });
      
      const result = response.data;
      
      // Return result to Claude
      return {
        content: [{ 
          type: "text", 
          text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
        }]
      };
    } catch (error) {
      // Handle errors
      return {
        content: [{ 
          type: "text", 
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Add more tools...
server.tool("query",
  { 
    query: z.string().describe("Query using dot notation to access objects and properties"),
    timeout: z.number().optional().describe("Timeout in milliseconds (default: 1000)")
  },
  async ({ query, timeout = 1000 }) => {
    // Implementation...
  }
);

server.tool("get_result",
  { 
    logId: z.string().describe("Log ID of the result to retrieve")
  },
  async ({ logId }) => {
    // Implementation...
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("MCP STDIO Client started and ready to receive messages");
```

## Tools

The MCP STDIO Client exposes the following tools to Claude:

1. **execute_code**: Executes C# code in Unity at runtime.
   - Parameters:
     - `code` (string, required): C# code to execute
     - `timeout` (number, optional): Timeout in milliseconds (default: 1000)
   - Returns: The result of the code execution

2. **query**: Executes a query using dot notation to access objects, properties, and methods.
   - Parameters:
     - `query` (string, required): Query using dot notation
     - `timeout` (number, optional): Timeout in milliseconds (default: 1000)
   - Returns: The result of the query

3. **get_result**: Retrieves the result of a previously executed operation.
   - Parameters:
     - `logId` (string, required): Log ID of the result to retrieve
   - Returns: The result associated with the Log ID

4. **get_logs**: Retrieves logs from Unity.
   - Parameters:
     - `count` (number, optional): Number of logs to retrieve (default: 10)
     - `offset` (number, optional): Offset for pagination (default: 0)
   - Returns: Array of logs

5. **get_log_details**: Retrieves detailed information about a specific log entry.
   - Parameters:
     - `logId` (string, required): Log ID of the log entry
   - Returns: Detailed information about the log entry

6. **help**: Returns documentation on the available commands and query syntax.
   - Parameters: None
   - Returns: Documentation on the available commands and query syntax

## Usage

Claude launches the MCP STDIO Client as a subprocess and communicates with it using JSON-RPC messages over stdin/stdout:

```bash
node build/index.js
```

## Communication Flow

1. Claude launches the MCP STDIO Client as a subprocess.
2. Claude sends a JSON-RPC request to the client's stdin.
3. MCP STDIO Client processes the request and forwards it to the Web Server via HTTP.
4. Web Server processes the request (possibly communicating with Unity).
5. Web Server returns the result to the MCP STDIO Client.
6. MCP STDIO Client formats the response as a JSON-RPC message and writes it to stdout.
7. Claude receives and processes the response.

## Error Handling

The MCP STDIO Client implements comprehensive error handling:

1. **Network Errors**: Handles errors when communicating with the Web Server.
2. **Timeout Errors**: Handles timeouts when waiting for responses from the Web Server.
3. **JSON-RPC Errors**: Handles errors in the JSON-RPC protocol.
4. **Tool Execution Errors**: Handles errors when executing tools.

## Testing

The MCP STDIO Client includes a comprehensive test suite that verifies its functionality:

```bash
npm test
```

## Deployment

The MCP STDIO Client can be deployed in various ways:

1. **NPM Package**: Install globally via npm.
2. **Docker Container**: Run in a Docker container.
3. **Standalone Executable**: Package as a standalone executable using tools like pkg.

## Conclusion

The MCP STDIO Client is a critical component of the Unity-MCP architecture, serving as the bridge between Claude and the rest of the system. By implementing the Model Context Protocol using the official TypeScript SDK, it ensures compatibility with Claude and other AI assistants.
