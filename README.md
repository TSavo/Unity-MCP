# Unity-MCP

A bridge between Unity and AI assistants using the Model Context Protocol (MCP).

## Overview

Unity-MCP is an open-source implementation of the Model Context Protocol for Unity game development. It enables AI assistants to interact with Unity game environments through a standardized interface, allowing for AI-assisted game development, automated testing, scene analysis, and runtime debugging.

### Architecture

The architecture has been simplified to use AILogger for persistence, removing the need for a separate server component:

```
AI Assistant <-> Unity-MCP STDIO Client <-> Unity Client <-> AILogger
```

- **AI Assistant**: Communicates with the Unity-MCP STDIO Client using the MCP protocol
- **Unity-MCP STDIO Client**: Forwards commands to the Unity Client and stores results in AILogger
- **Unity Client**: Executes commands in Unity and returns results
- **AILogger**: Stores logs and results for later retrieval

The Unity-MCP STDIO Client communicates directly with the Unity Client, which provides endpoints for both code execution and queries. The query tool transforms queries into code execution by wrapping them in a `return` statement.

## Features

- Execute C# code in the Unity runtime environment
- Inspect game objects and their components
- Analyze scene hierarchies and structures
- Run tests and receive results
- Invoke methods on game objects and components
- Modify game state during runtime

## Deployment Options

- Unity Editor Extension: An Editor extension that persists beyond game execution cycles
- Docker Container: A containerized version that communicates with Unity over the network
- NPX Package: A Node.js package that can be installed and run via NPX

## Documentation

- [MCP Architecture](docs/mcp-architecture.md): Overview of the MCP architecture and namespaces
- [MCP STDIO Client](docs/mcp-stdio-client.md): Information about the MCP STDIO client and its logging capabilities
- [Query Tool](docs/query-tool.md): Detailed information about the query tool and how it works
- [AILogger Integration](docs/ai-logger-sdk.md): Detailed information about the AILogger integration
- [API Reference](docs/api-reference.md): Detailed information about the API endpoints
- [Installation Guide](docs/installation.md): Step-by-step instructions for installing and setting up Unity-MCP
- [Development Guide](docs/development.md): Information about the development environment and workflow
- [Hot Reloading Guide](docs/hot-reloading.md): Detailed information about hot reloading in the development environment
- [Hot Reloading Quick Reference](docs/hot-reloading-quick-reference.md): Quick reference guide for hot reloading commands and tips
- [Contributing Guide](docs/contributing-guide.md): Guidelines for contributing to the project

## Getting Started

To get started with Unity-MCP, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/TSavo/Unity-MCP.git
   cd Unity-MCP
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the MCP STDIO client:
   ```bash
   npm start
   ```

   This will start the MCP STDIO client that communicates with Unity and uses AILogger for persistence.

   Note: Make sure AILogger is running on http://localhost:3030 or set the AI_LOGGER_URL environment variable to point to your AILogger instance.

5. Run tests:
   ```bash
   # Run all tests
   npm test

   # Run only unit tests
   npm run test:unit

   # Run only e2e tests
   npm run test:e2e

   # Run tests with a specific pattern
   npm test -- --testNamePattern="should return the server manifest"
   npm run test:unit -- --testNamePattern="should return the server manifest"
   npm run test:e2e -- --testNamePattern="should discover the test server"
   ```

For more detailed instructions, see the [Installation Guide](docs/installation.md).

## Connecting to AI Assistants

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

Place this file in the appropriate location for your AI assistant. For Claude, this would typically be in the Claude Desktop app's configuration directory.

### Available Tools

The Unity-MCP bridge provides the following tools:

1. **execute_code**: Execute C# code directly in Unity.
2. **query**: Execute a query using dot notation to access objects, properties, and methods.
3. **get_logs**: Retrieve logs from AILogger.
4. **get_log_by_name**: Retrieve a specific log from AILogger.

## Usage Examples

### Executing Code in Unity

You can execute C# code in Unity using the `execute_code` tool. The code will be executed in the Unity runtime environment, and the result will be stored in AILogger for later retrieval.

#### JSON-RPC Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "execute_code",
    "arguments": {
      "code": "Debug.Log(\"Hello from Unity!\"); return GameObject.FindObjectsOfType<GameObject>().Length;",
      "timeout": 5000
    }
  }
}
```

#### JSON-RPC Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"success\",\"logName\":\"unity-execute-1712534400000\",\"result\":{\"success\":true,\"result\":42,\"logs\":[\"Hello from Unity!\"],\"executionTime\":123}}"
      }
    ]
  }
}
```

### Querying Unity Objects

You can query Unity objects using the `query` tool. This allows you to access objects, properties, and methods using dot notation.

#### JSON-RPC Request

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "query",
    "arguments": {
      "query": "Camera.main.transform.position",
      "timeout": 5000
    }
  }
}
```

#### JSON-RPC Response

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"success\",\"logName\":\"unity-query-1712534400000\",\"result\":{\"success\":true,\"result\":{\"x\":0,\"y\":1,\"z\":-10},\"executionTime\":45}}"
      }
    ]
  }
}
```

### Retrieving Results from AILogger

You can retrieve the results of previous operations from AILogger using the `get_log_by_name` tool.

#### JSON-RPC Request

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_log_by_name",
    "arguments": {
      "log_name": "unity-execute-1712534400000",
      "limit": 1
    }
  }
}
```

#### JSON-RPC Response

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"success\",\"name\":\"unity-execute-1712534400000\",\"entries\":[{\"id\":\"123e4567-e89b-12d3-a456-426614174000\",\"name\":\"unity-execute-1712534400000\",\"data\":{\"result\":{\"success\":true,\"result\":42,\"logs\":[\"Hello from Unity!\"],\"executionTime\":123},\"timestamp\":\"2025-04-08T00:00:00.000Z\"},\"timestamp\":\"2025-04-08T00:00:00.000Z\"}]}"
      }
    ]
  }
}
```

### Example Usage

Once the AI assistant has access to the Unity tool, you can ask it to perform tasks like:

```
Can you execute the following C# code in Unity?

GameObject.Find("Player").transform.position = new Vector3(0, 1, 0);
```

## License

MIT

## Author

T Savo ([@TSavo](https://github.com/TSavo))
