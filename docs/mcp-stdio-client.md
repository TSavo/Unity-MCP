# MCP STDIO Client

This document explains how to use the MCP STDIO client, which allows Claude to communicate with Unity through the Model Context Protocol (MCP).

## Overview

The MCP STDIO client is a Node.js application that:

1. Communicates with Claude via stdin/stdout using the Model Context Protocol (MCP)
2. Forwards requests directly to the Unity Client
3. Stores results in AILogger for later retrieval
4. Logs to a fully qualified path for easy access

The MCP STDIO client communicates directly with the Unity Client, which provides endpoints for both code execution and queries. For queries, the Unity Client wraps the query in a `return` statement before execution.

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

### Using with AILogger

The MCP STDIO client now uses AILogger for persistence. By default, it connects to AILogger running on `http://localhost:3030`.

If you need to specify a different URL, you can use the `AI_LOGGER_URL` environment variable:

```bash
# Connect to a specific AILogger URL
AI_LOGGER_URL=http://localhost:3030 echo '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{"protocolVersion":"0.1.0","clientInfo":{"name":"test-client","version":"1.0.0"},"capabilities":{}}}' | node dist/mcp-stdio-client.js
```

### Using with Docker

When using the MCP STDIO client with Docker, you need to ensure it can connect to both Unity and AILogger.

1. Start the AILogger Docker container:
   ```bash
   cd AILogger
   docker-compose up -d
   ```

2. Start the MCP STDIO client:
   ```bash
   cd Unity-MCP
   npm start
   ```

### Testing the Connection

To test if the MCP STDIO client can connect to Unity and AILogger, you can use the `execute_code` tool:

```bash
echo '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"execute_code","arguments":{"code":"return \"Hello from Unity!\";"}}}}' | node dist/mcp-stdio-client.js
```

If the connection is successful, you should see a JSON response with a log name. You can then retrieve the log from AILogger:

```bash
echo '{"jsonrpc":"2.0","id":"2","method":"tools/call","params":{"name":"get_log_by_name","arguments":{"log_name":"unity-execute-1712534400000"}}}' | node dist/mcp-stdio-client.js
```

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

3. **get_logs**: Get logs from AILogger with pagination
   ```json
   {
     "jsonrpc": "2.0",
     "id": "4",
     "method": "tools/call",
     "params": {
       "name": "get_logs",
       "arguments": {
         "limit": 10
       }
     }
   }
   ```

4. **get_log_by_name**: Get a specific log from AILogger by name
   ```json
   {
     "jsonrpc": "2.0",
     "id": "5",
     "method": "tools/call",
     "params": {
       "name": "get_log_by_name",
       "arguments": {
         "log_name": "unity-execute-1712534400000",
         "limit": 10
       }
     }
   }
   ```

5. **get_state**: Get the current game state
   ```json
   {
     "jsonrpc": "2.0",
     "id": "6",
     "method": "tools/call",
     "params": {
       "name": "get_state",
       "arguments": {}
     }
   }
   ```

6. **start_game**: Start the game (enter play mode)
   ```json
   {
     "jsonrpc": "2.0",
     "id": "7",
     "method": "tools/call",
     "params": {
       "name": "start_game",
       "arguments": {}
     }
   }
   ```

7. **stop_game**: Stop the game (exit play mode)
   ```json
   {
     "jsonrpc": "2.0",
     "id": "8",
     "method": "tools/call",
     "params": {
       "name": "stop_game",
       "arguments": {}
     }
   }
   ```

## Troubleshooting

If you encounter issues with the MCP STDIO client, check the log file for error messages. The client will also write critical errors to stderr during startup.

### Common Issues

1. **Permission denied when writing to log directory**: The client will fall back to writing logs to the user's home directory.

2. **Connection refused when connecting to AILogger**: Make sure the AILogger server is running on port 3030. You can check if the container is running with:
   ```bash
   docker ps | grep ailogger
   ```

3. **Timeout when executing code in Unity**: Make sure Unity is running and accessible. Check the Unity logs for any errors.

### Docker-Specific Issues

1. **Port conflicts**: If another application is using port 3030, Docker won't be able to bind to this port. You can check for port conflicts with:
   ```bash
   # On Windows
   netstat -ano | findstr :3030

   # On Linux/macOS
   lsof -i :3030
   ```

2. **Docker network issues**: If the MCP STDIO client can't connect to AILogger, make sure the Docker network is set up correctly. You can check the Docker network with:
   ```bash
   docker network inspect ailogger_default
   ```

3. **Container not starting**: If the AILogger container isn't starting properly, check the Docker logs:
   ```bash
   docker logs ailogger-ailogger-1
   ```

4. **AILogger not accessible**: Make sure the AILogger server is exposing port 3030 correctly. You can check the port mapping with:
   ```bash
   docker ps | grep ailogger
   ```

### Verifying the Setup

To verify that the entire setup is working correctly:

1. Make sure the AILogger Docker container is running:
   ```bash
   docker ps | grep ailogger
   ```

2. Test the AILogger server directly:
   ```bash
   curl http://localhost:3030/logs
   ```

3. Test Unity connectivity (if you have a Unity API endpoint):
   ```bash
   curl http://localhost:8081/api/CodeExecution/status
   ```

4. Test the MCP STDIO client:
   ```bash
   echo '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"execute_code","arguments":{"code":"return \"Hello from Unity!\";"}}}}' | node dist/mcp-stdio-client.js
   ```

5. Test retrieving logs from AILogger:
   ```bash
   curl http://localhost:3030/logs/unity-execute-1712534400000
   ```
