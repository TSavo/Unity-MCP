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

4. Start the server:
   ```bash
   npm start
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

## License

MIT

## Author

T Savo ([@TSavo](https://github.com/TSavo))
