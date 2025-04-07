# Unity-MCP Architecture

## Overview

The Unity-MCP project uses a four-component architecture to provide a complete solution for AI assistants to interact with Unity. This document provides a detailed description of the architecture and how the components work together.

## Four-Component Architecture

The Unity-MCP architecture consists of four distinct components:

1. **MCP STDIO Client (Command-Line Tool)**
2. **Web Server with Persistence (Long-Running Service)**
3. **Unity Integration (Unity Plugin)**
4. **Unity SDK (C# Library)**

### 1. MCP STDIO Client

The MCP STDIO Client is a command-line tool that implements the Model Context Protocol using the official TypeScript SDK. It serves as the entry point for AI assistants like Claude to interact with Unity.

Key features:
- Implements the MCP protocol using the official TypeScript SDK
- Uses stdio transport to communicate with Claude
- Communicates with the Web Server via HTTP
- Exposes tools for executing code, querying objects, and retrieving results

### 2. Web Server with Persistence

The Web Server is a long-running service that maintains persistent state across sessions, stores logs and results, and manages communication between the MCP STDIO Client and Unity.

Key features:
- Maintains persistent state across sessions
- Stores logs, results, and other data
- Exposes HTTP API endpoints for the MCP STDIO Client
- Manages WebSocket connections to Unity instances
- Handles asynchronous operations and timeouts

### 3. Unity Integration

The Unity Integration is a plugin for Unity that communicates with the Web Server, executes C# code within Unity, and sends results back to the Web Server.

Key features:
- Communicates with the Web Server via WebSockets
- Executes C# code within Unity
- Sends results back to the Web Server
- Provides integration points for the Unity SDK

### 4. Unity SDK

The Unity SDK is a C# library that Unity developers can use in their projects to interact with the system. It provides a clean API for logging information, writing results, and communicating with AI assistants.

Key features:
- Provides a clean API for Unity developers
- Allows writing data that becomes available to the MCP client
- Abstracts away communication details with the Web Server
- Enables bidirectional communication between Unity and AI assistants

## Communication Flow

The communication flow between Claude and Unity is as follows:

```
Claude <-- stdio --> MCP STDIO Client <-- HTTP --> Web Server <-- HTTP/WebSockets --> Unity Integration
                                                       ^
                                                       |
                                                       v
                                                  Unity SDK (used by Unity developers)
```

### AI Assistant to Unity Flow

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

### Unity to AI Assistant Flow

1. Unity developer uses the Unity SDK to log information: `AI.Result("player_stats").Write(playerData);`
2. Unity SDK sends this information to the Web Server via the Unity Integration
3. Web Server stores the information with a Log GUID
4. When Claude needs this information, it can request it through the MCP STDIO Client
5. MCP STDIO Client retrieves the information from the Web Server
6. MCP STDIO Client returns the information to Claude

## Component Interactions

### MCP STDIO Client and Web Server

The MCP STDIO Client communicates with the Web Server using HTTP:

- **POST /api/execute**: Execute C# code in Unity
- **POST /api/query**: Execute a query in Unity
- **GET /api/result/:logId**: Retrieve the result of an operation
- **GET /api/logs**: Retrieve logs from Unity
- **GET /api/log/:logId**: Retrieve detailed information about a log entry

### Web Server and Unity Integration

The Web Server communicates with the Unity Integration using WebSockets:

- **Execute Code**: Send code to be executed in Unity
- **Execute Query**: Send a query to be executed in Unity
- **Result**: Receive the result of an operation from Unity
- **Log**: Receive a log entry from Unity

### Unity Integration and Unity SDK

The Unity Integration provides a bridge for the Unity SDK:

- **Result Writing**: The SDK writes results through the Integration
- **Log Writing**: The SDK writes logs through the Integration
- **Event Handling**: The SDK registers for events through the Integration

## Asynchronous Operations

The Unity-MCP architecture supports asynchronous operations through the use of Log GUIDs:

1. When Claude invokes a tool, the MCP STDIO Client forwards the request to the Web Server
2. The Web Server generates a Log GUID and forwards the request to Unity
3. If the operation completes within the timeout, the result is returned immediately
4. If the operation exceeds the timeout, only the Log GUID is returned
5. Claude can use the `get_result` tool to check for completion and retrieve the result using the Log GUID

This approach allows for long-running operations without blocking the AI assistant.

## Persistence Model

The Web Server implements a persistence model to store logs, results, and other data:

- **Logs**: Store log entries from Unity
- **Results**: Store the results of operations
- **Named Results**: Store named results created by Unity developers
- **Operation Status**: Store the status of operations (pending, completed, failed)

This persistence model ensures that results are available even for long-running operations and across sessions.

## Security Considerations

The Unity-MCP architecture has several security implications:

1. **Code Execution**: The system allows executing arbitrary C# code in Unity, which can be a security risk
2. **Network Communication**: The Web Server communicates with Unity over WebSockets, which may expose your Unity project to network attacks
3. **Access Control**: The system does not currently implement access control to restrict who can execute code in Unity

See the [Security Considerations](11-security-considerations.md) document for more information.

## Deployment Options

The Unity-MCP architecture can be deployed in various ways:

1. **Local Development**: All components run on the same machine
2. **Remote Web Server**: The Web Server runs on a remote machine, while the other components run locally
3. **Containerized Deployment**: The MCP STDIO Client and Web Server run in Docker containers

See the [Installation and Setup](09-installation-setup.md) document for more information.

## Conclusion

The Unity-MCP architecture provides a flexible, modular approach to enabling AI assistants to interact with Unity. By separating concerns into four distinct components, it allows for a clean, maintainable implementation that can be deployed in various configurations.
