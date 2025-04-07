# AI Logger SDK

The AI Logger SDK provides a simple, framework-agnostic way to log data that can be accessed by AI tools. This document explains how to use the AI Logger SDK in different environments.

## Overview

The AI Logger SDK is designed to be:

- **Framework-agnostic**: Works with or without Unity, and can integrate with existing logging frameworks
- **Simple to use**: Provides a fluent API for logging data
- **Flexible**: Supports multiple log levels and structured data
- **Extensible**: Can be extended with custom appenders

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

AI tools can access the logs using the MCP server tools:

```typescript
// Get logs by name
const logs = await executeAITool('get_logs', {
    log_name: 'my-component',
    limit: 10
});

// Get log details
const logDetails = await executeAITool('get_log_details', {
    log_id: logs[0].id
});

// Analyze the logs
const insights = analyzeLogData(logDetails);
```

## Configuration

The SDK can be configured in various ways:

```csharp
// Configure the logger
var config = new AILoggerConfig {
    ServerUrl = "http://localhost:8080",
    DefaultLogLevel = LogLevel.Info,
    BufferSize = 100,
    FlushInterval = TimeSpan.FromSeconds(5),
    IncludeCallSite = true,
    IncludeTimestamp = true
};

var logger = new AILogger("my-component", config);
```

## Unity-Free Development

The SDK is designed to work without Unity dependencies. For Unity-free development:

1. Use the standalone version of the SDK
2. Configure the SDK to use the MCP server endpoint
3. Use mock appenders for testing

```csharp
// For Unity-free development
var logger = new AILogger("my-component");
logger.AddAppender(new MCPServerAppender("http://localhost:8080"));
logger.Info("This will be sent to the MCP server");
```

## Best Practices

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
