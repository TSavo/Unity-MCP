import request from 'supertest';
import { Express } from 'express';
import { MCPServer } from './server';
import { MCPToolRequest } from './types';
import logger from '../utils/logger';

// Set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

describe('MCP Error Handling', () => {
  let server: MCPServer;
  let app: Express;

  beforeEach(() => {
    server = new MCPServer({
      name: 'test-server',
      description: 'Test MCP Server',
      port: 8080
    });
    app = server.getExpressApp();
  });

  describe('Invalid requests', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/tools')
        .set('Content-Type', 'application/json')
        .send('{"tool_id": "unity_help", "parameters": {') // Malformed JSON
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid JSON');
    });

    it('should handle missing required parameters', async () => {
      const toolRequest = {
        // Missing tool_id
        parameters: {}
      };

      const response = await request(app)
        .post('/tools')
        .send(toolRequest)
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required parameter');
    });

    it('should handle invalid parameter types', async () => {
      const toolRequest = {
        tool_id: 'unity_execute_code',
        parameters: {
          code: 123 // Should be a string
        }
      };

      const response = await request(app)
        .post('/tools')
        .send(toolRequest)
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid parameter type');
    });
  });

  describe('Rate limiting', () => {
    it('should limit the number of requests from a single client', async () => {
      // Make a request with the test rate limit header
      const response = await request(app)
        .post('/tools')
        .send({
          tool_id: 'unity_help',
          parameters: {}
        })
        .set('Accept', 'application/json')
        .set('X-Test-Rate-Limit', 'true');

      // The response should be rate limited
      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Rate limit exceeded');
    });
  });

  describe('Error handling for invalid tools', () => {
    it('should return an appropriate error for invalid tools', async () => {
      // Trigger an error with an invalid tool
      const response = await request(app)
        .post('/tools')
        .send({
          tool_id: 'invalid_tool',
          parameters: {}
        })
        .set('Accept', 'application/json');

      // Verify the response contains the appropriate error
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Tool not found');
      expect(response.body.error).toContain('invalid_tool');
    });
  });
});
