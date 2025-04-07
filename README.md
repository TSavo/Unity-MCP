# Unity-MCP

A bridge between Unity and AI assistants using the Model Context Protocol (MCP).

## Overview

Unity-MCP is an open-source implementation of the Model Context Protocol for Unity game development. It enables AI assistants to interact with Unity game environments through a standardized interface, allowing for AI-assisted game development, automated testing, scene analysis, and runtime debugging.

## Features

- Execute C# code in the Unity runtime environment
- Inspect game objects and their components
- Analyze scene hierarchies and structures
- Run tests and receive results
- Invoke methods on game objects and components
- Modify game state during runtime

## Deployment Options

- Unity Component: A MonoBehaviour that can be added to a Unity scene
- Docker Container: A containerized version that communicates with Unity over the network
- NPX Package: A Node.js package that can be installed and run via NPX

## Documentation

- [MCP Server Documentation](docs/mcp-server.md): Detailed information about the MCP server architecture and features
- [API Reference](docs/api-reference.md): Detailed information about the API endpoints
- [Installation Guide](docs/installation.md): Step-by-step instructions for installing and setting up the MCP server
- [Development Guide](docs/development.md): Information about the development environment and workflow
- [Hot Reloading Guide](docs/hot-reloading.md): Detailed information about hot reloading in the development environment
- [Hot Reloading Quick Reference](docs/hot-reloading-quick-reference.md): Quick reference guide for hot reloading commands and tips
- [MCP STDIO Client](docs/mcp-stdio-client.md): Information about the MCP STDIO client and its logging capabilities
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

4. Start the development environment (recommended for development):
   ```bash
   # On Linux/macOS
   ./run-dev.sh

   # On Windows
   .\run-dev.ps1
   ```

   This will start the TypeScript compiler in watch mode, build and start the Docker containers, and watch for changes in both TypeScript and C# code. For more information, see the [Development Guide](docs/development.md).

   Alternatively, you can start the services manually:

   ```bash
   # Start the TypeScript MCP server
   npm start

   # In a separate terminal, start the C# Unity client
   cd unity-client
   dotnet run
   ```

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

1. **unity_execute_code**: Execute C# code directly in Unity.
2. **unity_query**: Execute a query using dot notation to access objects, properties, and methods.
3. **unity_get_result**: Retrieve the result of a previously executed operation.
4. **unity_get_logs**: Retrieve logs from Unity.
5. **unity_get_log_details**: Retrieve detailed information about a specific log entry.
6. **unity_help**: Get documentation on the available commands and query syntax.

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
