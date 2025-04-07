import express, { Express } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { MCPServerManifest, MCPTool } from './types';
import routes from './routes';

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  name: string;
  description: string;
  port: number;
}

/**
 * MCP Server Implementation
 */
export class MCPServer {
  private app: Express;
  private port: number;
  private manifest: MCPServerManifest;

  constructor(config: MCPServerConfig) {
    this.app = express();
    this.port = config.port;

    // Configure Express
    this.app.use(cors());
    this.app.use(bodyParser.json());

    // Initialize manifest
    this.manifest = {
      schema_version: 'v1',
      name: config.name,
      description: config.description,
      tools: this.getDefaultTools()
    };

    // Store manifest in app locals for access in controllers
    this.app.locals.mcpManifest = this.manifest;

    // Set up routes
    this.setupRoutes();
  }

  /**
   * Get the Express app instance
   */
  public getExpressApp(): Express {
    return this.app;
  }

  /**
   * Start the server
   */
  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`MCP Server running on port ${this.port}`);
    });
  }

  /**
   * Set up server routes
   */
  private setupRoutes(): void {
    // Use the routes
    this.app.use(routes);
  }

  /**
   * Get default tools
   */
  private getDefaultTools(): MCPTool[] {
    return [
      {
        id: 'unity_execute_code',
        description: 'Execute C# code in Unity at runtime',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'C# code to execute'
            },
            timeout: {
              type: 'number',
              description: 'Maximum time to wait in milliseconds before returning (default: 1000)',
              default: 1000
            }
          },
          required: ['code']
        }
      },
      {
        id: 'unity_query',
        description: 'Execute a query using dot notation to access objects, properties, and methods',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Query string using dot notation (e.g., Scene[\'Player\'].transform.position)'
            },
            timeout: {
              type: 'number',
              description: 'Maximum time to wait in milliseconds before returning (default: 1000)',
              default: 1000
            }
          },
          required: ['query']
        }
      },
      {
        id: 'unity_get_result',
        description: 'Retrieve the result of a previously executed operation using its log ID',
        parameters: {
          type: 'object',
          properties: {
            log_id: {
              type: 'string',
              description: 'The log ID returned from a previous operation'
            }
          },
          required: ['log_id']
        }
      },
      {
        id: 'unity_get_logs',
        description: 'Retrieve logs from Unity, including errors, messages, and custom logs',
        parameters: {
          type: 'object',
          properties: {
            log_name: {
              type: 'string',
              description: 'Name of the log to retrieve (default: all logs)'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of log entries to return (default: 10)',
              default: 10
            },
            since: {
              type: 'string',
              description: 'Only return logs that occurred after this timestamp (ISO format)'
            },
            log_type: {
              type: 'string',
              description: 'Type of logs to retrieve (error, warning, info, all)',
              default: 'all'
            }
          }
        }
      },
      {
        id: 'unity_get_log_details',
        description: 'Retrieve detailed information about a specific log entry',
        parameters: {
          type: 'object',
          properties: {
            log_id: {
              type: 'string',
              description: 'The ID of the log entry to retrieve details for'
            }
          },
          required: ['log_id']
        }
      },
      {
        id: 'unity_help',
        description: 'Get documentation on the available commands and query syntax',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }
}
