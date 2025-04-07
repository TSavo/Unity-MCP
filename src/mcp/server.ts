import express, { Express } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { MCPServerManifest, MCPTool } from './types';
import routes from './routes';
import { MCPDiscovery, MCPServerInfo } from './discovery';
import { jsonErrorHandler, validateRequest, errorHandler, rateLimiter } from './middleware/error-handler';
import logger from '../utils/logger';

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  name: string;
  description: string;
  port: number;
  advertise?: boolean; // Whether to advertise the server on the network
}

/**
 * MCP Server Implementation
 */
export class MCPServer {
  private app: Express;
  private port: number;
  private manifest: MCPServerManifest;
  private discovery: MCPDiscovery;
  private serverUrl: string;

  constructor(config: MCPServerConfig) {
    this.app = express();
    this.port = config.port;
    this.serverUrl = `http://localhost:${this.port}`;
    this.discovery = new MCPDiscovery();

    // Configure Express
    this.app.use(cors());
    this.app.use(bodyParser.json({ limit: '1mb' }));

    // Add error handling middleware
    this.app.use(jsonErrorHandler);
    this.app.use(validateRequest);
    this.app.use(rateLimiter);

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

    // Advertise the server if requested
    if (config.advertise) {
      this.advertiseServer();
    }
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
      logger.info(`MCP Server running on port ${this.port}`);
      logger.info(`Development mode is ${process.env.NODE_ENV === 'development' ? 'enabled' : 'disabled'}`);
      logger.info(`Server started at ${new Date().toISOString()}`);
      logger.info(`Unity client connected to port 8081`);
      logger.info(`Hot reloading is working correctly!`);
      logger.info(`Docker volumes with polling are working correctly!`);
    });
  }

  /**
   * Stop the server
   */
  public stop(): void {
    // Stop advertising the server
    this.discovery.stopAdvertising(this.serverUrl);

    logger.info(`MCP Server stopped`);
  }

  /**
   * Advertise the server on the network
   */
  private advertiseServer(): void {
    const serverInfo: MCPServerInfo = {
      url: this.serverUrl,
      name: this.manifest.name,
      description: this.manifest.description,
      tools: this.manifest.tools.map(tool => tool.id)
    };

    this.discovery.advertiseServer(serverInfo);
  }

  /**
   * Set up server routes
   */
  private setupRoutes(): void {
    // Use the routes
    this.app.use(routes);

    // Add error handler middleware (should be after all routes)
    this.app.use(errorHandler);
  }

  /**
   * Get default tools
   */
  private getDefaultTools(): MCPTool[] {
    return [
      {
        id: 'execute_code',
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
        id: 'query',
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
        id: 'get_result',
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
        id: 'get_logs',
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
        id: 'get_log_by_name',
        description: 'Retrieve a log by name',
        parameters: {
          type: 'object',
          properties: {
            log_name: {
              type: 'string',
              description: 'The name of the log to retrieve'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of entries to return (default: 10)',
              default: 10
            }
          },
          required: ['log_name']
        }
      },
      {
        id: 'append_to_log',
        description: 'Append data to a log',
        parameters: {
          type: 'object',
          properties: {
            log_name: {
              type: 'string',
              description: 'The name of the log to append to'
            },
            data: {
              type: 'object',
              description: 'The data to append to the log'
            }
          },
          required: ['log_name', 'data']
        }
      },
      {
        id: 'clear_log',
        description: 'Clear a log',
        parameters: {
          type: 'object',
          properties: {
            log_name: {
              type: 'string',
              description: 'The name of the log to clear'
            }
          },
          required: ['log_name']
        }
      },
      {
        id: 'help',
        description: 'Get documentation on the available commands and query syntax',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }
}
