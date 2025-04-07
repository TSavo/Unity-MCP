"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./mcp/server");
// Create and start the MCP server
const server = new server_1.MCPServer({
    name: 'unity-mcp',
    description: 'Unity-AI Bridge with MCP compatibility',
    port: 8080
});
server.start();
