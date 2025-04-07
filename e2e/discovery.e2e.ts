import { MCPDiscovery } from '../src/mcp/discovery';

describe('MCP Discovery E2E Tests', () => {
  let discovery: MCPDiscovery;

  beforeEach(() => {
    discovery = new MCPDiscovery();
  });

  describe('Server Discovery', () => {
    it('should discover the test server', async () => {
      // Add the test server to the discovery service
      discovery.addServer(global.serverUrl);
      
      // Discover servers
      const servers = await discovery.discoverServers();
      
      // Verify that the test server was discovered
      expect(servers).toHaveLength(1);
      expect(servers[0]).toHaveProperty('url', global.serverUrl);
      expect(servers[0]).toHaveProperty('name', 'e2e-test-server');
      expect(servers[0]).toHaveProperty('description', 'MCP Server for E2E Testing');
      expect(servers[0]).toHaveProperty('tools');
      expect(Array.isArray(servers[0].tools)).toBe(true);
    });

    it('should handle unreachable servers gracefully', async () => {
      // Add a non-existent server
      discovery.addServer('http://localhost:9999');
      
      // Discover servers
      const servers = await discovery.discoverServers();
      
      // Verify that no servers were discovered
      expect(servers).toHaveLength(0);
    });
  });

  describe('Server Registration', () => {
    it('should register a server with the discovery service', async () => {
      // Register the test server
      await discovery.registerServer({
        url: global.serverUrl,
        name: 'e2e-test-server',
        description: 'MCP Server for E2E Testing'
      });
      
      // Discover servers
      const servers = await discovery.discoverServers();
      
      // Verify that the test server was discovered
      expect(servers).toHaveLength(1);
      expect(servers[0]).toHaveProperty('url', global.serverUrl);
      expect(servers[0]).toHaveProperty('name', 'e2e-test-server');
    });
  });

  describe('Server Unregistration', () => {
    it('should unregister a server from the discovery service', async () => {
      // Add the test server to the discovery service
      discovery.addServer(global.serverUrl);
      
      // Verify that the server was added
      let servers = await discovery.discoverServers();
      expect(servers).toHaveLength(1);
      
      // Unregister the server
      discovery.unregisterServer(global.serverUrl);
      
      // Verify that the server was removed
      servers = await discovery.discoverServers();
      expect(servers).toHaveLength(0);
    });
  });
});
