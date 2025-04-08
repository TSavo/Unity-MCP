import request from 'supertest';
import { Express } from 'express';
import { MCPServer } from './server';
import { MCPToolRequest } from './types';

// Set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

describe('MCP Server', () => {
  let server: MCPServer;
  let app: Express;

  beforeEach(() => {
    server = new MCPServer({
      name: 'test-server',
      description: 'Test MCP Server',
      port: 3030
    });
    app = server.getExpressApp();
  });

  describe('GET /manifest', () => {
    it('should return the server manifest', async () => {
      const response = await request(app).get('/manifest');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('schema_version', 'v1');
      expect(response.body).toHaveProperty('name', 'test-server');
      expect(response.body).toHaveProperty('description', 'Test MCP Server');
      expect(response.body).toHaveProperty('tools');
      expect(Array.isArray(response.body.tools)).toBe(true);
    });
  });

  describe('POST /tools', () => {
    it('should execute a tool and return a response', async () => {
      const toolRequest: MCPToolRequest = {
        tool_id: 'unity_help',
        parameters: {}
      };

      const response = await request(app)
        .post('/tools')
        .send(toolRequest)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('log_id');
    });

    it('should return an error for unknown tool', async () => {
      const toolRequest: MCPToolRequest = {
        tool_id: 'unknown_tool',
        parameters: {}
      };

      const response = await request(app)
        .post('/tools')
        .send(toolRequest)
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /results/:logId', () => {
    it('should retrieve a result by log ID', async () => {
      // First, execute a tool to get a log ID
      const toolRequest: MCPToolRequest = {
        tool_id: 'unity_help',
        parameters: {}
      };

      const toolResponse = await request(app)
        .post('/tools')
        .send(toolRequest)
        .set('Accept', 'application/json');

      const logId = toolResponse.body.log_id;

      // Then, retrieve the result using the log ID
      const response = await request(app).get(`/results/${logId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('log_id', logId);
    });

    it('should return an error for unknown log ID', async () => {
      const response = await request(app).get('/results/unknown-log-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /sse', () => {
    // Increase timeout for this test
    it('should establish an SSE connection', async () => {
      const response = await request(app).get('/sse');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
    }, 10000); // 10 second timeout
  });
});
