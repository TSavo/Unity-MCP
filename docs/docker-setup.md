# Dockerized Unity-MCP Setup

This document explains how to run the Unity-MCP integration using Docker containers.

> **Note**: For development with incremental builds and live code updates, see [Development Mode](./development.md).

## Prerequisites

- Docker
- Docker Compose

## Components

The Dockerized setup consists of two containers:

1. **MCP Server (TypeScript)**: Runs on port 8080 and implements the Model Context Protocol (MCP) to communicate with Claude.
2. **Unity Client (C#)**: Runs on port 8081 and communicates with Unity.

Note: The MCP STDIO client is not included in Docker Compose because Claude needs to run it directly, not through Docker.

## Running the Dockerized Setup

### Using the Script

On Linux/macOS:
```bash
chmod +x docker-start.sh
./docker-start.sh
```

On Windows:
```powershell
.\docker-start.ps1
```

### Manual Setup

1. Build and start the containers:
```bash
docker-compose up --build -d
```

2. View the logs:
```bash
docker-compose logs -f
```

3. Stop the containers:
```bash
docker-compose down
```

## Connecting to the Dockerized Setup

### From Claude

Claude connects to the MCP Server by running the MCP STDIO client directly:

```bash
echo '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{"protocolVersion":"0.1.0","clientInfo":{"name":"test-client","version":"1.0.0"},"capabilities":{}}}' | node dist/mcp-stdio-client/index.js
```

The MCP STDIO client communicates with the MCP Server running in Docker on port 8080.

For more information about the MCP STDIO client, including logging to fully qualified paths, see [MCP STDIO Client](./mcp-stdio-client.md).

### From Unity

Unity can connect to the Unity Client on port 8081 using the Unity plugin.

## Persistent Data

The Dockerized setup uses a Docker volume for persistent data:

**mcp-data**: Used by the MCP Server to store operation data. This ensures that data persists even when the containers are stopped and restarted.

## Networking

The containers communicate with each other over a Docker network named `mcp-network`. This network is isolated from the host network, but the ports 8080 and 8081 are exposed to the host to allow external connections.

## Troubleshooting

If you encounter issues with the Dockerized setup, try the following:

1. Check the logs:
```bash
docker-compose logs -f
```

2. Restart the containers:
```bash
docker-compose restart
```

3. Rebuild the containers:
```bash
docker-compose up --build -d
```

4. Check if the ports are in use:
```bash
netstat -ano | findstr :8080
netstat -ano | findstr :8081
```

5. Check if the containers are running:
```bash
docker ps
```
