# MCP Server Installation Guide

This guide provides step-by-step instructions for installing and setting up the MCP server.

## Prerequisites

Before installing the MCP server, ensure you have the following prerequisites:

- Node.js 16.x or later
- npm 7.x or later
- TypeScript 4.x or later
- Unity 2020.3 or later (for Unity integration)

## Installation

### Option 1: From Source

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

### Option 2: From npm (Coming Soon)

```bash
npm install unity-mcp
```

## Configuration

The MCP server can be configured using environment variables or a configuration file.

### Environment Variables

- `MCP_PORT`: The port on which the server listens (default: 8080)
- `MCP_NAME`: The name of the server (default: "unity-mcp")
- `MCP_DESCRIPTION`: A description of the server (default: "Unity-AI Bridge with MCP compatibility")
- `MCP_ADVERTISE`: Whether to advertise the server on the network (default: false)
- `NODE_ENV`: The environment in which the server runs (development, test, production)

### Configuration File

Create a `.env` file in the root directory of the project with the following content:

```
MCP_PORT=8080
MCP_NAME=unity-mcp
MCP_DESCRIPTION=Unity-AI Bridge with MCP compatibility
MCP_ADVERTISE=true
NODE_ENV=development
```

## Running the Server

### Development Mode

To run the server in development mode with automatic reloading:

```bash
npm run dev
```

### Production Mode

To run the server in production mode:

```bash
npm start
```

## Unity Integration

To integrate the MCP server with Unity, follow these steps:

1. Import the Unity-MCP package into your Unity project (coming soon).
2. Add the MCP component to a GameObject in your scene.
3. Configure the component with the MCP server URL.
4. Start the Unity editor or build your game.

## Docker Deployment (Coming Soon)

The MCP server can be deployed using Docker:

```bash
docker run -p 8080:8080 tsavo/unity-mcp
```

## NPX Deployment (Coming Soon)

The MCP server can be run using npx:

```bash
npx unity-mcp
```

## Verifying the Installation

To verify that the MCP server is running correctly, open a web browser and navigate to:

```
http://localhost:8080/manifest
```

You should see the server manifest in JSON format.

## Troubleshooting

### Common Issues

1. **Port already in use**: If the port is already in use, change the port in the configuration.
2. **Connection refused**: Ensure that the server is running and that the port is not blocked by a firewall.
3. **CORS errors**: If you're accessing the server from a different domain, ensure that CORS is properly configured.

### Logs

The MCP server logs are stored in the `logs` directory:

- `logs/all.log`: All logs
- `logs/error.log`: Error logs only

Check these logs for detailed information about any issues.

## Next Steps

After installing the MCP server, you can:

1. Explore the [API Reference](api-reference.md) to learn about the available endpoints.
2. Read the [MCP Server Documentation](mcp-server.md) for detailed information about the server architecture and features.
3. Try the [Examples](../examples) to see how to use the MCP server in practice.
