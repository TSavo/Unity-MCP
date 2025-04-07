# MCP STDIO Client

This document explains how to use the MCP STDIO client, which allows Claude to communicate with Unity through the Model Context Protocol (MCP).

## Overview

The MCP STDIO client is a Node.js application that:

1. Communicates with Claude via stdin/stdout using the Model Context Protocol (MCP)
2. Forwards requests to the MCP Server running in Docker
3. Logs to a fully qualified path for easy access

## Logging

The MCP STDIO client logs to a fully qualified path to ensure that logs can be found later regardless of who runs the client or from where.

### Log File Location

By default, logs are written to:

- **Windows**: `C:\Unity-MCP-Logs\mcp-stdio-{timestamp}.log`
- **Linux/macOS**: `/var/log/unity-mcp/mcp-stdio-{timestamp}.log`

If these locations are not writable, the client will fall back to:

- `{user's home directory}/.unity-mcp-logs/mcp-stdio-{timestamp}.log`

### Log File Format

Each log entry includes:

- Timestamp in ISO format
- Log level (INFO, ERROR, DEBUG)
- Process ID
- Message

Example:
```
[2025-04-07T19:30:45.123Z] [INFO] [PID:12345] MCP STDIO Client started
```

### Customizing Log Location

You can customize the log location by setting the `LOG_DIR` environment variable:

```bash
LOG_DIR=/path/to/logs node dist/mcp-stdio-client/index.js
```

## Usage

### Basic Usage

To use the MCP STDIO client, pipe JSON-RPC 2.0 messages to it:

```bash
echo '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{"protocolVersion":"0.1.0","clientInfo":{"name":"test-client","version":"1.0.0"},"capabilities":{}}}' | node dist/mcp-stdio-client/index.js
```

### Using with Docker

When using the MCP STDIO client with the Docker development environment, you need to ensure it connects to the MCP server running in Docker. By default, the client connects to `http://localhost:8080`, which works because the Docker container exposes port 8080 to the host machine.

If you need to specify a different URL, you can use the `WEB_SERVER_URL` environment variable:

```bash
# Connect to a specific URL
WEB_SERVER_URL=http://localhost:8080 echo '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{"protocolVersion":"0.1.0","clientInfo":{"name":"test-client","version":"1.0.0"},"capabilities":{}}}' | node dist/mcp-stdio-client/index.js
```

### Testing the Connection

To test if the MCP STDIO client can connect to the MCP server running in Docker, you can use the `help` tool:

```bash
echo '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"help","arguments":{}}}' | node dist/mcp-stdio-client/index.js
```

If the connection is successful, you should see a JSON response with help information.

## Available Tools

The MCP STDIO client provides the following tools:

1. **execute_code**: Execute C# code in Unity
   ```json
   {
     "jsonrpc": "2.0",
     "id": "2",
     "method": "tools/call",
     "params": {
       "name": "execute_code",
       "arguments": {
         "code": "Debug.Log(\"Hello from Unity!\");",
         "timeout": 5000
       }
     }
   }
   ```

2. **query**: Execute a query in Unity using dot notation
   ```json
   {
     "jsonrpc": "2.0",
     "id": "3",
     "method": "tools/call",
     "params": {
       "name": "query",
       "arguments": {
         "query": "UnityEngine.Application.version",
         "timeout": 5000
       }
     }
   }
   ```

3. **get_logs**: Get logs with pagination
   ```json
   {
     "jsonrpc": "2.0",
     "id": "4",
     "method": "tools/call",
     "params": {
       "name": "get_logs",
       "arguments": {
         "count": 10,
         "offset": 0
       }
     }
   }
   ```

4. **get_log_details**: Get log details by log ID
   ```json
   {
     "jsonrpc": "2.0",
     "id": "5",
     "method": "tools/call",
     "params": {
       "name": "get_log_details",
       "arguments": {
         "logId": "123"
       }
     }
   }
   ```

5. **help**: Get help information
   ```json
   {
     "jsonrpc": "2.0",
     "id": "6",
     "method": "tools/call",
     "params": {
       "name": "help",
       "arguments": {}
     }
   }
   ```

## Troubleshooting

If you encounter issues with the MCP STDIO client, check the log file for error messages. The client will also write critical errors to stderr during startup.

### Common Issues

1. **Permission denied when writing to log directory**: The client will fall back to writing logs to the user's home directory.

2. **Connection refused when connecting to MCP Server**: Make sure the MCP Server is running in Docker on port 8080. You can check if the container is running with:
   ```bash
   docker ps | grep mcp-server-dev
   ```

3. **Timeout when executing code in Unity**: Make sure the Unity Client is running in Docker on port 8081 and is connected to Unity. You can check if the container is running with:
   ```bash
   docker ps | grep unity-client-dev
   ```

### Docker-Specific Issues

1. **Port conflicts**: If another application is using port 8080 or 8081, Docker won't be able to bind to these ports. You can check for port conflicts with:
   ```bash
   # On Windows
   netstat -ano | findstr :8080
   netstat -ano | findstr :8081

   # On Linux/macOS
   lsof -i :8080
   lsof -i :8081
   ```

2. **Docker network issues**: If the MCP STDIO client can't connect to the MCP server, make sure the Docker network is set up correctly. You can check the Docker network with:
   ```bash
   docker network inspect mcp-network
   ```

3. **Container not starting**: If the containers aren't starting properly, check the Docker logs:
   ```bash
   docker logs mcp-server-dev
   docker logs unity-client-dev
   ```

4. **MCP server not connecting to Unity client**: The MCP server needs to connect to the Unity client using the Docker container name instead of localhost. Make sure the `UNITY_HOST` environment variable is set correctly in the Docker Compose file:
   ```yaml
   # docker-compose.dev.yml
   environment:
     - NODE_ENV=development
     - UNITY_HOST=unity-client-dev
   ```

### Verifying the Setup

To verify that the entire setup is working correctly:

1. Make sure the Docker containers are running:
   ```bash
   docker ps
   ```

2. Test the MCP server directly:
   ```bash
   curl http://localhost:8080/help
   ```

3. Test the Unity client directly:
   ```bash
   curl http://localhost:8081/api/CodeExecution/status
   ```

4. Test the MCP STDIO client:
   ```bash
   echo '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"help","arguments":{}}}' | node dist/mcp-stdio-client/index.js
   ```
