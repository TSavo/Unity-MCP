import { MCPDiscovery } from './discovery';
import http from 'http';
import { AddressInfo } from 'net';

// Set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

describe('MCP Discovery', () => {
  let discovery: MCPDiscovery;
  let mockServer: http.Server;
  let serverPort: number;

  beforeAll((done) => {
    // Create a mock MCP server
    mockServer = http.createServer((req, res) => {
      if (req.url === '/manifest') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          schema_version: 'v1',
          name: 'mock-mcp-server',
          description: 'Mock MCP Server for testing discovery',
          tools: []
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    mockServer.listen(0, () => {
      const address = mockServer.address() as AddressInfo;
      serverPort = address.port;
      done();
    });
  });

  afterAll((done) => {
    mockServer.close(done);
  });

  beforeEach(() => {
    discovery = new MCPDiscovery();
  });

  describe('discoverServers', () => {
    it('should discover MCP servers on the network', async () => {
      // Add our mock server to the discovery service
      discovery.addServer(`http://localhost:${serverPort}`);
      
      // Discover servers
      const servers = await discovery.discoverServers();
      
      expect(servers).toHaveLength(1);
      expect(servers[0]).toHaveProperty('url', `http://localhost:${serverPort}`);
      expect(servers[0]).toHaveProperty('name', 'mock-mcp-server');
      expect(servers[0]).toHaveProperty('description', 'Mock MCP Server for testing discovery');
    });

    it('should handle unreachable servers gracefully', async () => {
      // Add a non-existent server
      discovery.addServer('http://localhost:9999');
      
      // Discover servers
      const servers = await discovery.discoverServers();
      
      expect(servers).toHaveLength(0);
    });
  });

  describe('registerServer', () => {
    it('should register a server with the discovery service', async () => {
      // Register our mock server
      await discovery.registerServer({
        url: `http://localhost:${serverPort}`,
        name: 'mock-mcp-server',
        description: 'Mock MCP Server for testing discovery'
      });
      
      // Verify the server was registered
      const servers = await discovery.discoverServers();
      
      expect(servers).toHaveLength(1);
      expect(servers[0]).toHaveProperty('url', `http://localhost:${serverPort}`);
    });
  });

  describe('unregisterServer', () => {
    it('should unregister a server from the discovery service', async () => {
      // Add our mock server to the discovery service
      discovery.addServer(`http://localhost:${serverPort}`);
      
      // Verify the server was added
      let servers = await discovery.discoverServers();
      expect(servers).toHaveLength(1);
      
      // Unregister the server
      discovery.unregisterServer(`http://localhost:${serverPort}`);
      
      // Verify the server was removed
      servers = await discovery.discoverServers();
      expect(servers).toHaveLength(0);
    });
  });
});
