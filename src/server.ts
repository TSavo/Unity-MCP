import { MCPServer } from './mcp/server';

// Create and start the MCP server
const server = new MCPServer({
  name: 'unity-mcp',
  description: 'Unity-AI Bridge with MCP compatibility',
  port: 8080
});

server.start();
