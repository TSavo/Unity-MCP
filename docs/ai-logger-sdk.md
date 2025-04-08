# AILogger Integration

The AILogger provides a simple, framework-agnostic way to log data that can be accessed by AI tools. This document explains how to use AILogger with Unity-MCP.

## Overview

The AILogger is designed to be:

- **Framework-agnostic**: Works with or without Unity, and can integrate with existing logging frameworks
- **Simple to use**: Provides a fluent API for logging data
- **Flexible**: Supports multiple log levels and structured data
- **Extensible**: Can be extended with custom appenders

## Architecture

Unity-MCP uses AILogger as its persistence layer, allowing AI assistants to interact with Unity and store results for later retrieval.

```
AI Assistant <-> Unity-MCP STDIO Client <-> Unity <-> AILogger
```

- **AI Assistant**: Communicates with the Unity-MCP STDIO Client using the MCP protocol
- **Unity-MCP STDIO Client**: Forwards commands to Unity and stores results in AILogger
- **Unity**: Executes commands and returns results
- **AILogger**: Stores logs and results for later retrieval

## Setup

1. Start the AILogger server:
   ```bash
   cd AILogger
   docker-compose up -d
   ```

2. Start the Unity-MCP STDIO client:
   ```bash
   cd Unity-MCP
   npm start
   ```

3. The AI assistant can now execute code in Unity and retrieve results from AILogger.

## Log Levels

The AI Logger supports five standard log levels:

1. **Debug**: Detailed information for debugging purposes
2. **Info**: General information about application flow
3. **Warning**: Potential issues that don't prevent the application from working
4. **Error**: Errors that prevent a function from working
5. **Critical**: Critical errors that prevent the application from working

## Basic Usage

### Standalone Usage

```csharp
// Create a logger
var logger = new AILogger("my-component");

// Log messages with different levels
logger.Debug("Detailed debug information");
logger.Info("User logged in", new { userId = 123, username = "player1" });
logger.Warning("Resource running low", new { resourceType = "memory", available = "10%" });
logger.Error("Failed to load asset", new { assetName = "character.fbx", error = "File not found" });
logger.Critical("Database connection failed", new { connectionString = "db:1234", error = "Timeout" });

// Log with tags
logger.WithTags("gameplay", "player").Info("Player jumped", new { position = new Vector3(1, 2, 3) });

// Log with context
logger.WithContext("level", "tutorial").Info("Tutorial completed", new { timeSpent = 120 });
```

### Unity Integration

In Unity, the SDK works the same way but automatically captures Unity-specific context:

```csharp
// Create a logger in a MonoBehaviour
private AILogger logger;

void Awake()
{
    logger = new AILogger(this.GetType().Name);
}

void OnPlayerAction(PlayerAction action)
{
    // Log player action with position
    logger.Info("Player action", new {
        type = action.type,
        position = transform.position,
        target = action.target
    });
}

void OnError(Exception ex)
{
    // Log error with stack trace
    logger.Error("An error occurred", new {
        message = ex.Message,
        stackTrace = ex.StackTrace
    });
}
```

### Integration with Existing Logging Frameworks

The SDK can be integrated with existing logging frameworks:

#### NLog Integration

```csharp
// Create an NLog target that forwards to AI Logger
public class AILoggerTarget : NLog.Targets.TargetWithLayout
{
    private AILogger logger = new AILogger("NLog");

    protected override void Write(NLog.LogEventInfo logEvent)
    {
        var level = ConvertLogLevel(logEvent.Level);
        var message = Layout.Render(logEvent);

        logger.Log(level, message, logEvent.Properties);
    }

    private LogLevel ConvertLogLevel(NLog.LogLevel level)
    {
        if (level == NLog.LogLevel.Debug) return LogLevel.Debug;
        if (level == NLog.LogLevel.Info) return LogLevel.Info;
        if (level == NLog.LogLevel.Warn) return LogLevel.Warning;
        if (level == NLog.LogLevel.Error) return LogLevel.Error;
        if (level == NLog.LogLevel.Fatal) return LogLevel.Critical;
        return LogLevel.Info;
    }
}
```

#### log4net Integration

```csharp
// Create a log4net appender that forwards to AI Logger
public class AILoggerAppender : log4net.Appender.AppenderSkeleton
{
    private AILogger logger = new AILogger("log4net");

    protected override void Append(log4net.Core.LoggingEvent loggingEvent)
    {
        var level = ConvertLogLevel(loggingEvent.Level);
        var message = loggingEvent.RenderedMessage;
        var properties = new Dictionary<string, object>();

        // Extract properties
        foreach (var key in loggingEvent.Properties.GetKeys())
        {
            properties[key] = loggingEvent.Properties[key];
        }

        logger.Log(level, message, properties);
    }

    private LogLevel ConvertLogLevel(log4net.Core.Level level)
    {
        if (level == log4net.Core.Level.Debug) return LogLevel.Debug;
        if (level == log4net.Core.Level.Info) return LogLevel.Info;
        if (level == log4net.Core.Level.Warn) return LogLevel.Warning;
        if (level == log4net.Core.Level.Error) return LogLevel.Error;
        if (level == log4net.Core.Level.Fatal) return LogLevel.Critical;
        return LogLevel.Info;
    }
}
```

## Advanced Usage

### Custom Appenders

You can create custom appenders to send logs to different destinations:

```csharp
// Create a custom appender
public class ConsoleAppender : ILogAppender
{
    public void Append(LogEntry entry)
    {
        var color = GetColorForLevel(entry.Level);
        Console.ForegroundColor = color;
        Console.WriteLine($"[{entry.Timestamp:yyyy-MM-dd HH:mm:ss}] [{entry.Level}] [{entry.LoggerName}] {entry.Message}");

        if (entry.Data != null)
        {
            Console.WriteLine($"Data: {System.Text.Json.JsonSerializer.Serialize(entry.Data)}");
        }

        Console.ResetColor();
    }

    private ConsoleColor GetColorForLevel(LogLevel level)
    {
        switch (level)
        {
            case LogLevel.Debug: return ConsoleColor.Gray;
            case LogLevel.Info: return ConsoleColor.White;
            case LogLevel.Warning: return ConsoleColor.Yellow;
            case LogLevel.Error: return ConsoleColor.Red;
            case LogLevel.Critical: return ConsoleColor.DarkRed;
            default: return ConsoleColor.White;
        }
    }
}

// Use the custom appender
var logger = new AILogger("my-component");
logger.AddAppender(new ConsoleAppender());
logger.Info("This will be logged to the console");
```

### Structured Logging

The SDK supports structured logging:

```csharp
// Log structured data
logger.Info("User registered", new {
    userId = 123,
    username = "player1",
    email = "player1@example.com",
    registrationDate = DateTime.Now
});

// Log complex objects
var player = new Player {
    Id = 123,
    Username = "player1",
    Level = 10,
    Position = new Vector3(1, 2, 3),
    Inventory = new List<Item> {
        new Item { Id = 1, Name = "Sword", Quantity = 1 },
        new Item { Id = 2, Name = "Potion", Quantity = 5 }
    }
};

logger.Info("Player state", player);
```

## Accessing Logs from AI Tools

AI tools can access the logs using the MCP STDIO client tools:

### Using JSON-RPC

```json
// Get all logs
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_logs",
    "arguments": {
      "limit": 10
    }
  }
}

// Get a specific log by name
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_log_by_name",
    "arguments": {
      "log_name": "unity-execute-1712534400000",
      "limit": 10
    }
  }
}
```

### Using the AILogger API

```bash
# Get all logs
curl http://localhost:3030/logs

# Get a specific log by name
curl http://localhost:3030/logs/unity-execute-1712534400000
```

### Using the AILogger SDK

```typescript
// Get all logs
const allLogs = await aiLogger.getLogs({
    limit: 10
});

// Get a specific log by name
const log = await aiLogger.getLogByName({
    logName: 'unity-execute-1712534400000',
    limit: 10
});

// Analyze the logs
const insights = analyzeLogData(log);
```

## Configuration

### AILogger Server

The AILogger server can be configured using environment variables:

```bash
# Set the port
PORT=3030 npm start

# Set the log directory
LOG_DIR=/path/to/logs npm start
```

### Unity-MCP STDIO Client

The Unity-MCP STDIO client can be configured using environment variables:

```bash
# Set the AILogger server URL
AI_LOGGER_URL=http://custom-ailogger-server:3030 npm start

# Set the log directory
LOG_DIR=/path/to/logs npm start
```

### AILogger SDK

The AILogger SDK can be configured in various ways:

```csharp
// Configure the logger
var config = new AILoggerConfig {
    ServerUrl = "http://localhost:3030",
    DefaultLogLevel = LogLevel.Info,
    BufferSize = 100,
    FlushInterval = TimeSpan.FromSeconds(5),
    IncludeCallSite = true,
    IncludeTimestamp = true
};

var logger = new AILogger("my-component", config);
```

## Unity-Free Development

The AILogger is designed to work without Unity dependencies. For Unity-free development:

1. Use the standalone version of the AILogger
2. Configure the AILogger to use the AILogger server endpoint
3. Use mock appenders for testing

```csharp
// For Unity-free development
var logger = new AILogger("my-component");
logger.AddAppender(new MCPServerAppender("http://localhost:3030"));
logger.Info("This will be sent to the AILogger server");
```

## Log Format

Results are stored in AILogger with the following format:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "unity-execute-1712534400000",
  "data": {
    "result": {
      "success": true,
      "result": 42,
      "logs": ["Hello from Unity!"],
      "executionTime": 123
    },
    "timestamp": "2025-04-08T00:00:00.000Z"
  },
  "timestamp": "2025-04-08T00:00:00.000Z"
}
```

## Log Naming Conventions

- **Unity Code Execution**: `unity-execute-{timestamp}`
- **Unity Queries**: `unity-query-{timestamp}`

Where `{timestamp}` is the current time in milliseconds since the Unix epoch.

## Best Practices

### For AILogger

1. **Use appropriate log levels**: Use Debug for detailed information, Info for general information, Warning for potential issues, Error for errors, and Critical for critical errors.

2. **Include context**: Add relevant context to your logs to make them more useful for analysis.

3. **Use structured logging**: Log structured data instead of just strings to make it easier to analyze the logs.

4. **Use tags**: Add tags to your logs to make it easier to filter them.

5. **Configure buffer size and flush interval**: Configure the buffer size and flush interval to balance performance and real-time logging.

6. **Use dependency injection**: Inject the logger into your classes instead of creating it directly.

7. **Create a logger per component**: Create a separate logger for each component to make it easier to filter logs.

8. **Log at the appropriate level**: Don't log everything at the Info level - use the appropriate level for each message.

9. **Include relevant data**: Include relevant data in your logs to make them more useful for analysis.

10. **Don't log sensitive information**: Don't log sensitive information like passwords or personal data.

### For Unity-MCP Integration

1. **Start AILogger first**: Always start the AILogger server before starting the Unity-MCP STDIO client.

2. **Use meaningful log names**: Use meaningful log names to make it easier to find logs later.

3. **Include timeout parameters**: Always include timeout parameters when executing code in Unity to prevent hanging.

4. **Handle errors gracefully**: Handle errors gracefully and store error information in AILogger for later analysis.

5. **Use structured data**: Use structured data when logging to make it easier to analyze the logs.

6. **Monitor log growth**: Monitor log growth and clean up old logs to prevent disk space issues.

7. **Use Docker for production**: Use Docker for production deployments to ensure consistent behavior across environments.

8. **Back up logs**: Back up logs regularly to prevent data loss.

9. **Use environment variables**: Use environment variables to configure the AILogger server and Unity-MCP STDIO client.

10. **Document log formats**: Document log formats to make it easier for AI assistants to understand the logs.
