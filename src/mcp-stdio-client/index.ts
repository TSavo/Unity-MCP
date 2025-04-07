import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import fs from "fs";
import path from "path";

// Configure file logging with fully qualified path
const DEFAULT_LOG_DIR = process.platform === 'win32'
  ? path.join('C:', 'Unity-MCP-Logs')
  : path.join('/var', 'log', 'unity-mcp');

const LOG_DIR = process.env.LOG_DIR || DEFAULT_LOG_DIR;
const LOG_FILE = path.join(LOG_DIR, `mcp-stdio-${new Date().toISOString().replace(/:/g, "-")}.log`);

// Log the fully qualified path for reference
if (process.env.NODE_ENV !== 'test') {
  // Only log to stderr during startup, not during normal operation
  process.stderr.write(`MCP STDIO Client logs will be written to: ${LOG_FILE}\n`);
}

/**
 * Logger that writes to a file without using console.log/error
 * to keep stdio streams clean for MCP communication
 */
class FileLogger {
  private logStream: fs.WriteStream | null = null;

  constructor(logFile: string) {
    try {
      // Create log directory if it doesn't exist
      const logDir = path.dirname(logFile);
      if (!fs.existsSync(logDir)) {
        try {
          fs.mkdirSync(logDir, { recursive: true });
        } catch (mkdirError) {
          // If we can't create the directory, try to write to stderr without disrupting the MCP protocol
          process.stderr.write(`Error creating log directory ${logDir}: ${mkdirError}\n`);

          // Try to use a fallback directory in the user's home directory
          const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
          const fallbackDir = path.join(homeDir, '.unity-mcp-logs');

          process.stderr.write(`Trying fallback log directory: ${fallbackDir}\n`);

          if (!fs.existsSync(fallbackDir)) {
            fs.mkdirSync(fallbackDir, { recursive: true });
          }

          // Update the log file path
          logFile = path.join(fallbackDir, path.basename(logFile));
        }
      }

      // Open log file for writing
      this.logStream = fs.createWriteStream(logFile, { flags: 'a' });

      // Set up error handler for the stream
      this.logStream.on('error', (streamError) => {
        process.stderr.write(`Error writing to log file: ${streamError}\n`);
        this.logStream = null;
      });

      // Log startup with detailed information
      this.info(`MCP STDIO Client started at ${new Date().toISOString()}`);
      this.info(`Log file: ${logFile}`);
      this.info(`Process ID: ${process.pid}`);
      this.info(`Node.js version: ${process.version}`);
      this.info(`Platform: ${process.platform}`);
      this.info(`Working directory: ${process.cwd()}`);
    } catch (error) {
      // Try to write to stderr without disrupting the MCP protocol
      process.stderr.write(`Error initializing logger: ${error}\n`);
      this.logStream = null;
    }
  }

  /**
   * Log an info message
   * @param message The message to log
   */
  info(message: string): void {
    this.log('INFO', message);
  }

  /**
   * Log an error message
   * @param message The message to log
   */
  error(message: string): void {
    this.log('ERROR', message);
  }

  /**
   * Log a debug message
   * @param message The message to log
   */
  debug(message: string): void {
    this.log('DEBUG', message);
  }

  /**
   * Log a message with a level
   * @param level The log level
   * @param message The message to log
   */
  private log(level: string, message: string): void {
    if (!this.logStream) {
      // Try to write to stderr as a fallback, but only for errors
      if (level === 'ERROR') {
        try {
          process.stderr.write(`[${new Date().toISOString()}] [${level}] ${message}\n`);
        } catch (stderrError) {
          // Nothing we can do if stderr fails
        }
      }
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const pid = process.pid;
      this.logStream.write(`[${timestamp}] [${level}] [PID:${pid}] ${message}\n`);
    } catch (error) {
      // Try to write to stderr as a fallback, but only for errors
      if (level === 'ERROR') {
        try {
          process.stderr.write(`[${new Date().toISOString()}] [${level}] ${message} (Error writing to log: ${error})\n`);
        } catch (stderrError) {
          // Nothing we can do if stderr fails
        }
      }
    }
  }

  /**
   * Close the log stream
   */
  close(): void {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }
}

// Create the logger
const logger = new FileLogger(LOG_FILE);

/**
 * Create an MCP STDIO client that communicates with Claude via stdin/stdout
 * and forwards requests to the web server.
 */
export async function createMcpStdioClient(webServerUrl: string = process.env.WEB_SERVER_URL || "http://localhost:8080") {
  logger.info(`Creating MCP STDIO client with web server URL: ${webServerUrl}`);
  // Create an MCP server
  const server = new McpServer({
    name: "Unity-MCP",
    version: "1.0.0"
  });

  // Add tools that communicate with the Web Server

  // Execute code tool
  server.tool("execute_code",
    {
      code: z.string().describe("C# code to execute in Unity"),
      timeout: z.number().optional().describe("Timeout in milliseconds (default: 1000)")
    },
    async ({ code, timeout = 1000 }) => {
      try {
        logger.info(`Executing code: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}`);

        // Forward to Web Server
        const response = await axios.post(`${webServerUrl}/tools`, {
          tool_id: "unity_execute_code",
          parameters: {
            code,
            timeout
          }
        });

        const result = response.data;
        logger.debug(`Received result: ${JSON.stringify(result).substring(0, 200)}${JSON.stringify(result).length > 200 ? '...' : ''}`);

        // Return result to Claude
        return {
          content: [{
            type: "text",
            text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
          }]
        };
      } catch (error) {
        // Log the error
        logger.error(`Error executing code: ${error instanceof Error ? error.message : String(error)}`);

        // Return error to Claude
        return {
          content: [{
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Query tool
  server.tool("query",
    {
      query: z.string().describe("Query using dot notation to access objects and properties"),
      timeout: z.number().optional().describe("Timeout in milliseconds (default: 1000)")
    },
    async ({ query, timeout = 1000 }) => {
      try {
        logger.info(`Executing query: ${query}`);

        // Forward to Web Server
        const response = await axios.post(`${webServerUrl}/tools`, {
          tool_id: "unity_query",
          parameters: {
            query,
            timeout
          }
        });

        const result = response.data;
        logger.debug(`Received result: ${JSON.stringify(result).substring(0, 200)}${JSON.stringify(result).length > 200 ? '...' : ''}`);

        // Return result to Claude
        return {
          content: [{
            type: "text",
            text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
          }]
        };
      } catch (error) {
        // Log the error
        logger.error(`Error executing query: ${error instanceof Error ? error.message : String(error)}`);

        // Return error to Claude
        return {
          content: [{
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get result tool
  server.tool("get_result",
    {
      logId: z.string().describe("Log ID of the result to retrieve")
    },
    async ({ logId }) => {
      try {
        logger.info(`Getting result for log ID: ${logId}`);

        // Forward to Web Server
        const response = await axios.post(`${webServerUrl}/tools`, {
          tool_id: "unity_get_result",
          parameters: {
            log_id: logId
          }
        });

        const result = response.data;
        logger.debug(`Received result: ${JSON.stringify(result).substring(0, 200)}${JSON.stringify(result).length > 200 ? '...' : ''}`);

        // Return result to Claude
        return {
          content: [{
            type: "text",
            text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
          }]
        };
      } catch (error) {
        // Log the error
        logger.error(`Error getting result: ${error instanceof Error ? error.message : String(error)}`);

        // Return error to Claude
        return {
          content: [{
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get logs tool
  server.tool("get_logs",
    {
      count: z.number().optional().describe("Number of logs to retrieve (default: 10)"),
      offset: z.number().optional().describe("Offset for pagination (default: 0)")
    },
    async ({ count = 10, offset = 0 }) => {
      try {
        logger.info(`Getting logs with count: ${count}, offset: ${offset}`);

        // Forward to Web Server
        const response = await axios.get(`${webServerUrl}/operations`, {
          params: {
            limit: count,
            offset
          }
        });

        const result = response.data;
        logger.debug(`Received logs: ${JSON.stringify(result).substring(0, 200)}${JSON.stringify(result).length > 200 ? '...' : ''}`);

        // Return result to Claude
        return {
          content: [{
            type: "text",
            text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
          }]
        };
      } catch (error) {
        // Log the error
        logger.error(`Error getting logs: ${error instanceof Error ? error.message : String(error)}`);

        // Return error to Claude
        return {
          content: [{
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get log details tool
  server.tool("get_log_details",
    {
      logId: z.string().describe("Log ID of the log entry")
    },
    async ({ logId }) => {
      try {
        logger.info(`Getting log details for log ID: ${logId}`);

        // Forward to Web Server
        const response = await axios.post(`${webServerUrl}/tools`, {
          tool_id: "unity_get_log_details",
          parameters: {
            log_id: logId
          }
        });

        const result = response.data;
        logger.debug(`Received log details: ${JSON.stringify(result).substring(0, 200)}${JSON.stringify(result).length > 200 ? '...' : ''}`);

        // Return result to Claude
        return {
          content: [{
            type: "text",
            text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
          }]
        };
      } catch (error) {
        // Log the error
        logger.error(`Error getting log details: ${error instanceof Error ? error.message : String(error)}`);

        // Return error to Claude
        return {
          content: [{
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Help tool
  server.tool("help",
    {},
    async () => {
      try {
        logger.info("Getting help");

        // Forward to Web Server
        const response = await axios.get(`${webServerUrl}/help`);

        const result = response.data;
        logger.debug(`Received help: ${JSON.stringify(result).substring(0, 200)}${JSON.stringify(result).length > 200 ? '...' : ''}`);

        // Return result to Claude
        return {
          content: [{
            type: "text",
            text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)
          }]
        };
      } catch (error) {
        // Log the error
        logger.error(`Error getting help: ${error instanceof Error ? error.message : String(error)}`);

        // Generate help text locally if the web server is not available
        return {
          content: [{
            type: "text",
            text: `# Unity-MCP Help\n\n## Available Tools\n\n- execute_code: Execute C# code in Unity\n- query: Execute a query using dot notation\n- get_result: Retrieve the result of a previous operation\n- get_logs: Retrieve logs from Unity\n- get_log_details: Retrieve detailed information about a log entry\n- help: Show this help text`
          }]
        };
      }
    }
  );

  // Start receiving messages on stdin and sending messages on stdout
  logger.info("Connecting to stdio transport");
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log success but don't use console.error/log to keep stdio clean
  logger.info("MCP STDIO Client started and ready to receive messages");

  // Set up process exit handler to close the logger
  process.on('exit', () => {
    logger.info("MCP STDIO Client shutting down");
    logger.close();
  });

  return server;
}

// If this file is run directly, start the MCP STDIO client
if (require.main === module) {
  createMcpStdioClient().catch(error => {
    // Log the error to the file, not to stderr
    logger.error(`Fatal error starting MCP STDIO client: ${error instanceof Error ? error.message : String(error)}`);
    logger.error(error instanceof Error && error.stack ? error.stack : "No stack trace available");
    logger.close();

    // Exit with error code
    process.exit(1);
  });
}
