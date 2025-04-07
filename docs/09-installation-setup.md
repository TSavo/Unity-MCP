# Installation and Setup

## Overview

This document provides step-by-step instructions for installing and setting up the Unity-MCP system. It covers all four components of the architecture: MCP STDIO Client, Web Server, Unity Integration, and Unity SDK.

## Prerequisites

Before installing Unity-MCP, ensure you have the following prerequisites:

1. **Node.js**: Version 14.0.0 or higher
2. **npm**: Version 6.0.0 or higher
3. **Unity**: Version 2020.3 or higher
4. **Git**: For cloning the repository

## Installation Steps

### 1. Clone the Repository

First, clone the Unity-MCP repository:

```bash
git clone https://github.com/TSavo/Unity-MCP.git
cd Unity-MCP
```

### 2. Install Dependencies

Install the Node.js dependencies for the MCP STDIO Client and Web Server:

```bash
npm install
```

This will install all the required dependencies, including the official MCP TypeScript SDK.

### 3. Build the Project

Build the TypeScript code:

```bash
npm run build
```

This will compile the TypeScript code into JavaScript in the `build` directory.

### 4. Import the Unity Package

1. Open your Unity project
2. Go to `Assets > Import Package > Custom Package...`
3. Navigate to the `unity-package` directory in the Unity-MCP repository
4. Select the `UnityMCP.unitypackage` file
5. Click `Import`

This will import the Unity Integration and SDK into your Unity project.

## Configuration

### MCP STDIO Client Configuration

The MCP STDIO Client can be configured by editing the `config.json` file in the root directory:

```json
{
  "webServerUrl": "http://localhost:8080",
  "logLevel": "info"
}
```

- **webServerUrl**: The URL of the Web Server
- **logLevel**: The log level (debug, info, warn, error)

### Web Server Configuration

The Web Server can be configured by editing the `server-config.json` file in the root directory:

```json
{
  "port": 8080,
  "logLevel": "info",
  "database": {
    "type": "nedb",
    "path": "./data"
  }
}
```

- **port**: The port to listen on
- **logLevel**: The log level (debug, info, warn, error)
- **database**: Configuration for the database
  - **type**: The database type (nedb, mongodb)
  - **path**: The path to the database files (for nedb)

### Unity Integration Configuration

The Unity Integration can be configured in the Unity Editor:

1. Find the `UnityMCPIntegration` prefab in the `Assets/UnityMCP/Prefabs` directory
2. Drag it into your scene
3. Select the `UnityMCPIntegration` GameObject in the scene
4. Configure the following properties in the Inspector:
   - **Web Server URL**: The URL of the Web Server (default: `ws://localhost:8080`)
   - **Start Automatically**: Whether to start the connection automatically (default: `true`)
   - **Reconnect Interval**: The interval in seconds to attempt reconnection if the connection is lost (default: `5`)
   - **Log Level**: The log level (Debug, Info, Warning, Error)

## Running the System

### 1. Start the Web Server

Start the Web Server:

```bash
npm run start-server
```

This will start the Web Server on the configured port (default: 8080).

### 2. Start Unity

Open your Unity project and ensure the `UnityMCPIntegration` GameObject is in your scene. The Unity Integration will automatically connect to the Web Server when the scene starts.

### 3. Configure Claude to Use the MCP STDIO Client

To configure Claude to use the MCP STDIO Client, add the following to your MCP server list:

```json
{
  "mcpServers": {
    "unity-mcp": {
      "command": "node",
      "args": ["path/to/Unity-MCP/build/index.js"],
      "env": {
        "CONFIG_PATH": "path/to/Unity-MCP/config.json"
      }
    }
  }
}
```

Replace `path/to/Unity-MCP` with the actual path to your Unity-MCP directory.

## Verifying the Installation

To verify that the installation is working correctly:

### 1. Check the Web Server Logs

The Web Server should log that it's running and listening on the configured port:

```
Web Server running on port 8080
```

### 2. Check the Unity Integration Logs

In the Unity Console, you should see logs from the Unity Integration:

```
[Unity MCP] Connecting to Web Server...
[Unity MCP] Connected to Web Server
```

### 3. Test with Claude

Ask Claude to execute a simple code snippet in Unity:

```
Can you execute the following code in Unity and tell me the result?

return GameObject.Find("Main Camera").transform.position;
```

Claude should be able to execute the code and return the position of the Main Camera.

## Deployment Options

### Local Development

For local development, all components can run on the same machine:

1. The MCP STDIO Client is launched by Claude as a subprocess
2. The Web Server runs as a Node.js process
3. Unity runs on the same machine

### Remote Web Server

For a more distributed setup, the Web Server can run on a remote machine:

1. Deploy the Web Server to a remote machine
2. Configure the MCP STDIO Client to connect to the remote Web Server
3. Configure the Unity Integration to connect to the remote Web Server

### Containerized Deployment

For a containerized deployment:

1. Build a Docker image for the Web Server:
   ```bash
   docker build -t unity-mcp-server -f server.Dockerfile .
   ```

2. Run the Web Server in a Docker container:
   ```bash
   docker run -p 8080:8080 unity-mcp-server
   ```

3. Configure the MCP STDIO Client and Unity Integration to connect to the Docker container

## Troubleshooting

### MCP STDIO Client Issues

- **Error: Cannot connect to Web Server**: Ensure the Web Server is running and the URL in `config.json` is correct
- **Error: Module not found**: Run `npm install` to install dependencies
- **Error: TypeScript compilation errors**: Run `npm run build` to compile the TypeScript code

### Web Server Issues

- **Error: Address already in use**: Another process is using the configured port. Change the port in `server-config.json`
- **Error: Cannot connect to database**: Ensure the database configuration is correct
- **Error: Cannot start server**: Check the logs for more details

### Unity Integration Issues

- **Error: Cannot connect to Web Server**: Ensure the Web Server is running and the URL in the Unity Integration configuration is correct
- **Error: WebSocket connection failed**: Check firewall settings and ensure the Web Server is accessible
- **Error: Code execution failed**: Check the Unity Console for more details

### Unity SDK Issues

- **Error: Integration not registered**: Ensure the Unity Integration is in your scene and started
- **Error: Cannot send data**: Ensure the Unity Integration is connected to the Web Server
- **Error: Serialization error**: Ensure the data you're sending can be serialized to JSON

## Next Steps

After installing and setting up Unity-MCP, you can:

1. Explore the [Tools and Capabilities](08-tools-capabilities.md) document to learn about the available tools
2. Check the [Usage Examples](10-usage-examples.md) document for examples of using Unity-MCP
3. Review the [Security Considerations](11-security-considerations.md) document for security best practices

## Conclusion

You have now successfully installed and set up the Unity-MCP system. The four components (MCP STDIO Client, Web Server, Unity Integration, and Unity SDK) are now working together to enable AI assistants to interact with your Unity project.
