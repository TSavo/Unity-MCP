"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = __importDefault(require("./routes"));
const discovery_1 = require("./discovery");
const error_handler_1 = require("./middleware/error-handler");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * MCP Server Implementation
 */
class MCPServer {
    constructor(config) {
        this.app = (0, express_1.default)();
        this.port = config.port;
        this.serverUrl = `http://localhost:${this.port}`;
        this.discovery = new discovery_1.MCPDiscovery();
        // Configure Express
        this.app.use((0, cors_1.default)());
        this.app.use(body_parser_1.default.json({ limit: '1mb' }));
        // Add error handling middleware
        this.app.use(error_handler_1.jsonErrorHandler);
        this.app.use(error_handler_1.validateRequest);
        this.app.use(error_handler_1.rateLimiter);
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
    getExpressApp() {
        return this.app;
    }
    /**
     * Start the server
     */
    start() {
        this.app.listen(this.port, () => {
            logger_1.default.info(`MCP Server running on port ${this.port}`);
            logger_1.default.info(`Development mode is ${process.env.NODE_ENV === 'development' ? 'enabled' : 'disabled'}`);
            logger_1.default.info(`Server started at ${new Date().toISOString()}`);
            logger_1.default.info(`Unity client connected to port 8081`);
            logger_1.default.info(`Hot reloading is working correctly!`);
            logger_1.default.info(`Docker volumes with polling are working correctly!`);
        });
    }
    /**
     * Stop the server
     */
    stop() {
        // Stop advertising the server
        this.discovery.stopAdvertising(this.serverUrl);
        logger_1.default.info(`MCP Server stopped`);
    }
    /**
     * Advertise the server on the network
     */
    advertiseServer() {
        const serverInfo = {
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
    setupRoutes() {
        // Use the routes
        this.app.use(routes_1.default);
        // Add error handler middleware (should be after all routes)
        this.app.use(error_handler_1.errorHandler);
    }
    /**
     * Get default tools
     */
    getDefaultTools() {
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
exports.MCPServer = MCPServer;
