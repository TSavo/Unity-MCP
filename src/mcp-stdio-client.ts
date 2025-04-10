import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import fs from "fs";
import path from "path";
import { UnityClientFactory } from "./unity/UnityClientFactory";
import { UnityClient } from "./unity/UnityClient";

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

      // Open the log file
      this.logStream = fs.createWriteStream(logFile, { flags: 'a' });
    } catch (error) {
      // If we can't open the log file, try to write to stderr without disrupting the MCP protocol
      process.stderr.write(`Error opening log file ${logFile}: ${error}\n`);
    }
  }

  /**
   * Write a log message to the file
   *
   * @param level Log level
   * @param message Message to log
   */
  public log(level: string, message: string): void {
    if (this.logStream) {
      const timestamp = new Date().toISOString();
      const logMessage = `${timestamp} [${level.toUpperCase()}] ${message}\n`;
      this.logStream.write(logMessage);
    }
  }

  /**
   * Log an info message
   *
   * @param message Message to log
   */
  public info(message: string): void {
    this.log('info', message);
  }

  /**
   * Log a debug message
   *
   * @param message Message to log
   */
  public debug(message: string): void {
    this.log('debug', message);
  }

  /**
   * Log a warning message
   *
   * @param message Message to log
   */
  public warn(message: string): void {
    this.log('warn', message);
  }

  /**
   * Log an error message
   *
   * @param message Message to log
   */
  public error(message: string): void {
    this.log('error', message);
  }

  /**
   * Close the log file
   */
  public close(): void {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }
}

// Create a logger
const logger = new FileLogger(LOG_FILE);

// Get the AILogger URL from environment variables or use default
const aiLoggerUrl = process.env.AI_LOGGER_URL || 'http://localhost:3030';

// Log the AILogger URL
logger.info(`Using AILogger URL: ${aiLoggerUrl}`);

// Create a Unity client
const unityClient = UnityClientFactory.createClient();

// Create an MCP server
const server = new McpServer({
  name: "Unity-MCP",
  version: "1.0.0"
});

// Add execute_code tool
server.tool("execute_code",
  {
    code: z.string(),
    timeout: z.number().optional()
  },
  async (args) => {
    try {
      const { code, timeout = 30000 } = args;
      const logName = `unity-execute-${Date.now()}`;
      logger.info(`Executing code in Unity: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}`);
      logger.info(`Using log name: ${logName}`);

      // Execute code in Unity
      const result = await unityClient.executeCode(code, timeout);

      // Store the result in AILogger
      await storeResultInAILogger(logName, result);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "success",
            logName,
            result: result
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error(`Error executing code in Unity: ${error}`);
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message || String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Add query tool
server.tool("query",
  {
    query: z.string(),
    timeout: z.number().optional()
  },
  async (args) => {
    try {
      const { query, timeout = 30000 } = args;
      const logName = `unity-query-${Date.now()}`;
      logger.info(`Querying Unity: ${query}`);
      logger.info(`Using log name: ${logName}`);

      // Query Unity
      const result = await unityClient.query(query, timeout);

      // Store the result in AILogger
      await storeResultInAILogger(logName, result);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "success",
            logName,
            result: result
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error(`Error querying Unity: ${error}`);
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message || String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Add get_logs tool
server.tool("get_logs",
  {
    limit: z.number().optional()
  },
  async (args) => {
    try {
      const { limit = 10 } = args;
      logger.info(`Getting logs with limit: ${limit}`);

      // Get logs from AILogger
      const response = await axios.get(`${aiLoggerUrl}/logs`, {
        params: { limit }
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error(`Error getting logs: ${error}`);
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message || String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Add get_log_by_name tool
server.tool("get_log_by_name",
  {
    log_name: z.string(),
    limit: z.number().optional()
  },
  async (args) => {
    try {
      const { log_name, limit = 10 } = args;
      logger.info(`Getting log by name: ${log_name}, limit: ${limit}`);

      // Get log from AILogger
      const response = await axios.get(`${aiLoggerUrl}/logs/${log_name}`, {
        params: { limit }
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error(`Error getting log by name: ${error}`);
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message || String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Add get_state tool
server.tool("get_state",
  {},
  async () => {
    try {
      logger.info('Getting game state from Unity');
      const logName = `unity-state-${Date.now()}`;

      // Get game state from Unity
      const gameState = await unityClient.getGameState();

      // Store the result in AILogger
      await storeResultInAILogger(logName, gameState);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "success",
            logName,
            result: gameState
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error(`Error getting game state from Unity: ${error}`);
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message || String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Add start_game tool
server.tool("start_game",
  {},
  async () => {
    try {
      logger.info('Starting game in Unity');
      const logName = `unity-start-${Date.now()}`;

      // Start the game in Unity
      const result = await unityClient.startGame();

      // Store the result in AILogger
      await storeResultInAILogger(logName, result);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "success",
            logName,
            result: result
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error(`Error starting game in Unity: ${error}`);
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message || String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Add stop_game tool
server.tool("stop_game",
  {},
  async () => {
    try {
      logger.info('Stopping game in Unity');
      const logName = `unity-stop-${Date.now()}`;

      // Stop the game in Unity
      const result = await unityClient.stopGame();

      // Store the result in AILogger
      await storeResultInAILogger(logName, result);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "success",
            logName,
            result: result
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error(`Error stopping game in Unity: ${error}`);
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message || String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Store a result in AILogger
 *
 * @param logName Log name
 * @param result Result to store
 */
async function storeResultInAILogger(logName: string, result: any): Promise<void> {
  try {
    // Store the result in AILogger
    await axios.post(`${aiLoggerUrl}/logs/${logName}`, {
      result,
      timestamp: new Date().toISOString()
    });

    logger.info(`Stored result in AILogger: ${logName}`);
  } catch (error: any) {
    logger.error(`Error storing result in AILogger: ${error}`);
    throw error;
  }
}

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
logger.info("Unity-MCP STDIO client starting...");

// Connect the server to the transport
server.connect(transport).catch((error: any) => {
  logger.error(`Error connecting to transport: ${error}`);
  process.exit(1);
});

logger.info("Unity-MCP STDIO client started");

// Handle process exit
process.on('exit', () => {
  logger.info("Unity-MCP STDIO client shutting down");
  logger.close();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught exception: ${error}`);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});
