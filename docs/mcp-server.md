# MCP Server Documentation

## Overview

The Model Context Protocol (MCP) server is a key component of the Unity-MCP bridge. It provides a standardized interface for AI assistants to interact with Unity game environments. The server implements the MCP specification, which defines a set of tools and resources that AI assistants can use to execute code, query objects, and retrieve results.

## Architecture

The MCP server is built using a modular architecture with the following components:

### Core Components

1. **Server**: The main Express server that handles HTTP requests and responses.
2. **Routes**: Defines the API endpoints for the MCP server.
3. **Controllers**: Implements the business logic for each endpoint.
4. **Middleware**: Provides cross-cutting concerns like error handling, validation, and rate limiting.
5. **Discovery**: Handles server discovery and registration on the network.
6. **Logger**: Provides structured logging for the server.

### API Endpoints

The MCP server exposes the following endpoints:

- `GET /manifest`: Returns the server manifest, which describes the available tools and resources.
- `POST /tools`: Executes a tool with the provided parameters.
- `GET /results/:logId`: Retrieves the result of a previously executed operation.
- `GET /sse`: Establishes a Server-Sent Events (SSE) connection for real-time updates.
- `GET /help`: Returns documentation on the available commands and query syntax.

### Tools

The MCP server provides the following tools:

1. **unity_execute_code**: Executes C# code in Unity at runtime.
2. **unity_query**: Executes a query using dot notation to access objects, properties, and methods.
3. **unity_get_result**: Retrieves the result of a previously executed operation.
4. **unity_get_logs**: Retrieves logs from Unity.
5. **unity_get_log_details**: Retrieves detailed information about a specific log entry.
6. **unity_help**: Returns documentation on the available commands and query syntax.

## Error Handling

The MCP server implements comprehensive error handling to ensure that errors are properly reported to clients and logged for debugging. The error handling middleware handles the following types of errors:

1. **JSON Parsing Errors**: Occurs when the request body contains invalid JSON.
2. **Missing Required Parameters**: Occurs when a required parameter is missing from the request.
3. **Invalid Parameter Types**: Occurs when a parameter has an incorrect type.
4. **Tool Not Found**: Occurs when the requested tool does not exist.
5. **Rate Limiting**: Occurs when a client exceeds the rate limit.

## Server Discovery

The MCP server includes a discovery mechanism that allows AI assistants to discover and connect to MCP servers on the network. The discovery service provides the following features:

1. **Server Registration**: Registers a server with the discovery service.
2. **Server Discovery**: Discovers MCP servers on the network.
3. **Server Advertising**: Advertises an MCP server on the network.

## Logging

The MCP server uses Winston for structured logging. Logs are written to both the console and log files. The logging system provides the following features:

1. **Log Levels**: Different log levels (error, warn, info, http, debug) for different types of messages.
2. **Structured Logging**: Logs include timestamps, log levels, and structured data.
3. **Log Files**: Logs are written to files for persistent storage.

## Configuration

The MCP server can be configured with the following options:

1. **Name**: The name of the server.
2. **Description**: A description of the server.
3. **Port**: The port on which the server listens.
4. **Advertise**: Whether to advertise the server on the network.

## Usage

To use the MCP server, follow these steps:

1. Create a new instance of the MCPServer class:

```typescript
const server = new MCPServer({
  name: 'unity-mcp',
  description: 'Unity-AI Bridge with MCP compatibility',
  port: 8080,
  advertise: true
});
```

2. Start the server:

```typescript
server.start();
```

3. To stop the server:

```typescript
server.stop();
```

## Example

Here's an example of how to use the MCP server:

```typescript
import { MCPServer } from './mcp/server';

// Create and start the MCP server
const server = new MCPServer({
  name: 'unity-mcp',
  description: 'Unity-AI Bridge with MCP compatibility',
  port: 8080,
  advertise: true
});

server.start();

// Handle process termination
process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});
```

## Testing

The MCP server includes a comprehensive test suite that verifies its functionality. The tests cover the following areas:

1. **Server Manifest**: Tests that the server returns the correct manifest.
2. **Tool Execution**: Tests that tools can be executed and return the expected results.
3. **Error Handling**: Tests that errors are properly handled and reported.
4. **Rate Limiting**: Tests that rate limiting works as expected.
5. **Server Discovery**: Tests that servers can be discovered on the network.

To run the tests, use the following command:

```bash
npm test
```
