# AILogger

A simple, flexible logger for AI tools that logs to the MCP server.

## Features

- Simple, fluent API
- Multiple log levels (debug, info, warn, error, fatal)
- Automatic timestamps
- Custom data support
- TypeScript types for better developer experience
- Promise-based API

## Installation

The AILogger is included in the Unity-MCP project. No additional installation is required.

## Usage

### Basic Usage

```typescript
import { AILogger } from '../logging/AILogger';

// Create a logger
const logger = new AILogger('my-component');

// Log messages at different levels
logger.debug('This is a debug message');
logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.fatal('This is a fatal message');

// Log with custom data
logger.info('User logged in', {
  userId: '12345',
  username: 'john.doe',
  loginTime: new Date().toISOString()
});

// Get log entries
const entries = await logger.getEntries();
console.log(entries);

// Clear the log
await logger.clear();
```

### Advanced Usage

```typescript
import { AILogger, LogLevel } from '../logging/AILogger';

// Create a logger with custom options
const logger = new AILogger('my-component', {
  mcpServerUrl: 'http://mcp-server:8080',
  defaultLevel: LogLevel.DEBUG,
  includeTimestamps: true
});

// Log with custom data
try {
  // Some code that might throw an error
  throw new Error('Something went wrong');
} catch (error) {
  logger.error('Error in operation', {
    error: error.message,
    stack: error.stack,
    operationId: '12345'
  });
}
```

## API Reference

### Constructor

```typescript
constructor(logName: string, options?: AILoggerOptions)
```

- `logName`: Name of the log
- `options`: Logger options
  - `mcpServerUrl`: MCP server URL (default: 'http://localhost:8080')
  - `defaultLevel`: Default log level (default: LogLevel.INFO)
  - `includeTimestamps`: Whether to include timestamps automatically (default: true)

### Methods

#### log(level: LogLevel, message: string, data?: Record<string, any>): Promise<string>

Log a message at the specified level.

- `level`: Log level
- `message`: Message to log
- `data`: Additional data to log
- Returns: Promise that resolves with the log ID

#### debug(message: string, data?: Record<string, any>): Promise<string>

Log a debug message.

- `message`: Message to log
- `data`: Additional data to log
- Returns: Promise that resolves with the log ID

#### info(message: string, data?: Record<string, any>): Promise<string>

Log an info message.

- `message`: Message to log
- `data`: Additional data to log
- Returns: Promise that resolves with the log ID

#### warn(message: string, data?: Record<string, any>): Promise<string>

Log a warning message.

- `message`: Message to log
- `data`: Additional data to log
- Returns: Promise that resolves with the log ID

#### error(message: string, data?: Record<string, any>): Promise<string>

Log an error message.

- `message`: Message to log
- `data`: Additional data to log
- Returns: Promise that resolves with the log ID

#### fatal(message: string, data?: Record<string, any>): Promise<string>

Log a fatal message.

- `message`: Message to log
- `data`: Additional data to log
- Returns: Promise that resolves with the log ID

#### getEntries(limit?: number): Promise<any[]>

Get log entries.

- `limit`: Maximum number of entries to return (default: 10)
- Returns: Promise that resolves with the log entries

#### clear(): Promise<boolean>

Clear the log.

- Returns: Promise that resolves with a boolean indicating whether the log was cleared

## Examples

See the [examples](../examples) directory for more examples of how to use the AILogger.
