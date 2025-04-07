# Asynchronous Execution in Unity-AI Bridge with MCP

## 1. Introduction

### 1.1 Purpose

This specification defines the asynchronous execution model for the Unity-AI Bridge with MCP compatibility. It enables handling of long-running operations without blocking the AI assistant, allowing for more complex interactions with Unity while maintaining responsiveness.

### 1.2 Scope

This document covers:
- The asynchronous execution model
- Timeout handling and configuration
- Log ID generation and management
- Result retrieval mechanisms
- AI assistant interaction patterns
- Implementation details

### 1.3 Prerequisites

This specification assumes familiarity with:
- The Model Context Protocol (MCP) as described in "01-model-context-protocol.md"
- The Unity-AI Bridge as described in "02-unity-ai-bridge-mcp.md"
- Basic understanding of asynchronous programming patterns

## 2. Asynchronous Execution Model

### 2.1 Overview

The asynchronous execution model allows the Unity-AI Bridge to handle long-running operations without blocking the AI assistant. The key components of this model are:

1. **Timeout Parameters**: Allow the AI to specify how long it's willing to wait for a result
2. **Log IDs**: Unique identifiers for each operation that allow results to be retrieved later
3. **Result Storage**: A system for storing operation results, including partial results
4. **Result Retrieval**: A mechanism for retrieving results using Log IDs
5. **Status Updates**: A way to check the status of ongoing operations

### 2.2 Execution Flow

The asynchronous execution flow follows these steps:

1. The AI assistant initiates an operation with a timeout parameter
2. The Unity-AI Bridge generates a Log ID for the operation
3. The operation is executed until completion or timeout
4. If the operation completes within the timeout, the result is returned immediately
5. If the operation times out, a partial result and status are returned
6. The AI assistant can retrieve the full result later using the Log ID

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AI Assistant  │     │  Unity-AI Bridge │     │  Unity Runtime  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  Request Operation    │                       │
         │  with Timeout         │                       │
         │───────────────────────►                       │
         │                       │                       │
         │                       │  Generate Log ID      │
         │                       │◄──────────────────────►
         │                       │                       │
         │                       │  Execute Operation    │
         │                       │───────────────────────►
         │                       │                       │
         │                       │                       │
         │                       │     If Timeout        │
         │  Partial Result with  │◄──────────────────────┘
         │  Log ID               │                       
         │◄──────────────────────┤                       
         │                       │                       
         │  Request Result       │                       
         │  with Log ID          │                       
         │───────────────────────►                       
         │                       │                       
         │  Complete Result      │                       
         │◄──────────────────────┤                       
         │                       │                       
```

### 2.3 Key Benefits

- **Responsiveness**: The AI assistant can continue interacting with the user while operations complete
- **Complex Operations**: Enables operations that take longer than typical request timeouts
- **Partial Results**: Provides feedback even for incomplete operations
- **Resumability**: Operations can be monitored and results retrieved when ready
- **Reliability**: Prevents lost results due to connection issues or timeouts

## 3. Timeout Handling

### 3.1 Timeout Parameter

Each operation accepts a `timeout` parameter that specifies the maximum time (in seconds) the AI assistant is willing to wait for a result:

```json
{
  "tool_id": "execute_code",
  "parameters": {
    "code": "// Some long-running code",
    "timeout": 5
  }
}
```

### 3.2 Default Timeout

If no timeout is specified, a default timeout of 1 second is used. This ensures that operations don't block the AI assistant for too long by default.

### 3.3 Timeout Behavior

When a timeout occurs:

1. The operation continues running in the background
2. A partial result (if available) is returned to the AI assistant
3. The operation's status is set to "running"
4. The Log ID is included in the response for later result retrieval

### 3.4 Timeout Response

When an operation times out, the response follows this format:

```json
{
  "status": "timeout",
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "partial_result": {
    // Any partial results available at timeout
  },
  "message": "Operation timed out after 5 seconds. Use the get_operation_result tool with the provided log_id to retrieve the complete result when available."
}
```

## 4. Log ID Management

### 4.1 Log ID Generation

Each operation is assigned a unique Log ID when it is initiated. The Log ID is a UUID (Universally Unique Identifier) that is used to identify the operation and retrieve its results later.

```csharp
public string GenerateLogId()
{
    return Guid.NewGuid().ToString();
}
```

### 4.2 Log Storage

The Unity-AI Bridge maintains a log storage system that associates Log IDs with operation results:

```csharp
public class LogStorage
{
    private Dictionary<string, OperationLog> logs = new Dictionary<string, OperationLog>();
    
    public void StoreLog(string logId, OperationLog log)
    {
        logs[logId] = log;
    }
    
    public OperationLog GetLog(string logId)
    {
        if (logs.TryGetValue(logId, out var log))
        {
            return log;
        }
        
        return null;
    }
    
    public void UpdateLog(string logId, OperationLog log)
    {
        if (logs.ContainsKey(logId))
        {
            logs[logId] = log;
        }
    }
    
    public void CleanupOldLogs(TimeSpan maxAge)
    {
        var cutoffTime = DateTime.UtcNow - maxAge;
        var keysToRemove = logs.Where(kvp => kvp.Value.Timestamp < cutoffTime)
                               .Select(kvp => kvp.Key)
                               .ToList();
        
        foreach (var key in keysToRemove)
        {
            logs.Remove(key);
        }
    }
}
```

### 4.3 Operation Log Structure

Each operation log contains:

```csharp
public class OperationLog
{
    public string LogId { get; set; }
    public string ToolId { get; set; }
    public object Parameters { get; set; }
    public string Status { get; set; } // "running", "completed", "error"
    public object Result { get; set; }
    public object PartialResult { get; set; }
    public string ErrorMessage { get; set; }
    public DateTime Timestamp { get; set; }
    public DateTime LastUpdated { get; set; }
}
```

### 4.4 Log Retention

Logs are retained for a configurable period (default: 24 hours) to allow for result retrieval. After this period, logs are automatically cleaned up to prevent memory leaks.

## 5. Result Retrieval

### 5.1 Result Retrieval Tool

The Unity-AI Bridge provides a dedicated tool for retrieving operation results using Log IDs:

```json
{
  "id": "get_operation_result",
  "description": "Retrieve the result of a previously initiated operation using its Log ID",
  "parameters": {
    "type": "object",
    "properties": {
      "log_id": {
        "type": "string",
        "description": "The Log ID of the operation"
      },
      "wait": {
        "type": "boolean",
        "description": "Whether to wait for the operation to complete",
        "default": false
      },
      "timeout": {
        "type": "number",
        "description": "Maximum time to wait in seconds (only used if wait is true)",
        "default": 5
      }
    },
    "required": ["log_id"]
  }
}
```

### 5.2 Result Retrieval Response

The response from the result retrieval tool follows this format:

```json
{
  "status": "completed", // "completed", "running", "error", "not_found"
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    // The operation result if completed
  },
  "partial_result": {
    // Any partial results if still running
  },
  "error": "Error message if status is error",
  "message": "Operation completed successfully."
}
```

### 5.3 Wait Parameter

The `wait` parameter allows the AI assistant to wait for an operation to complete:

- If `wait` is `true`, the tool will wait up to `timeout` seconds for the operation to complete
- If `wait` is `false` (default), the tool will return immediately with the current status

### 5.4 Status Checking

The AI assistant can check the status of an operation without retrieving the full result:

```json
{
  "id": "get_operation_status",
  "description": "Check the status of a previously initiated operation",
  "parameters": {
    "type": "object",
    "properties": {
      "log_id": {
        "type": "string",
        "description": "The Log ID of the operation"
      }
    },
    "required": ["log_id"]
  }
}
```

## 6. Implementation Details

### 6.1 Asynchronous Execution

The Unity-AI Bridge implements asynchronous execution using Tasks and coroutines:

```csharp
public async Task<object> ExecuteOperationAsync(string toolId, object parameters, int timeout)
{
    // Generate a Log ID
    string logId = GenerateLogId();
    
    // Create an operation log
    var log = new OperationLog
    {
        LogId = logId,
        ToolId = toolId,
        Parameters = parameters,
        Status = "running",
        Timestamp = DateTime.UtcNow,
        LastUpdated = DateTime.UtcNow
    };
    
    // Store the log
    logStorage.StoreLog(logId, log);
    
    // Create a cancellation token source with the timeout
    var cts = new CancellationTokenSource(TimeSpan.FromSeconds(timeout));
    
    try
    {
        // Execute the operation
        var task = ExecuteToolAsync(toolId, parameters, cts.Token);
        
        // Wait for the operation to complete or timeout
        if (await Task.WhenAny(task, Task.Delay(timeout * 1000)) == task)
        {
            // Operation completed within timeout
            var result = await task;
            
            // Update the log
            log.Status = "completed";
            log.Result = result;
            log.LastUpdated = DateTime.UtcNow;
            logStorage.UpdateLog(logId, log);
            
            // Return the result with the Log ID
            return new
            {
                status = "completed",
                log_id = logId,
                result = result,
                message = "Operation completed successfully."
            };
        }
        else
        {
            // Operation timed out
            cts.Cancel();
            
            // Get any partial results
            var partialResult = GetPartialResult(toolId, parameters);
            
            // Update the log
            log.Status = "running";
            log.PartialResult = partialResult;
            log.LastUpdated = DateTime.UtcNow;
            logStorage.UpdateLog(logId, log);
            
            // Return timeout response with the Log ID
            return new
            {
                status = "timeout",
                log_id = logId,
                partial_result = partialResult,
                message = $"Operation timed out after {timeout} seconds. Use the get_operation_result tool with the provided log_id to retrieve the complete result when available."
            };
        }
    }
    catch (Exception ex)
    {
        // Operation failed
        log.Status = "error";
        log.ErrorMessage = ex.Message;
        log.LastUpdated = DateTime.UtcNow;
        logStorage.UpdateLog(logId, log);
        
        // Return error response with the Log ID
        return new
        {
            status = "error",
            log_id = logId,
            error = ex.Message,
            message = "Operation failed with an error."
        };
    }
}
```

### 6.2 Result Retrieval Implementation

The implementation of the result retrieval tool:

```csharp
public async Task<object> GetOperationResult(string logId, bool wait, int timeout)
{
    // Get the operation log
    var log = logStorage.GetLog(logId);
    
    if (log == null)
    {
        return new
        {
            status = "not_found",
            log_id = logId,
            message = "Operation not found. The Log ID may be invalid or the log may have been cleaned up."
        };
    }
    
    // If the operation is already completed or failed, return the result immediately
    if (log.Status == "completed" || log.Status == "error")
    {
        return new
        {
            status = log.Status,
            log_id = logId,
            result = log.Result,
            error = log.ErrorMessage,
            message = log.Status == "completed" ? "Operation completed successfully." : "Operation failed with an error."
        };
    }
    
    // If wait is false, return the current status immediately
    if (!wait)
    {
        return new
        {
            status = log.Status,
            log_id = logId,
            partial_result = log.PartialResult,
            message = "Operation is still running. Use the get_operation_result tool with wait=true to wait for completion."
        };
    }
    
    // Wait for the operation to complete
    var startTime = DateTime.UtcNow;
    while (log.Status == "running" && (DateTime.UtcNow - startTime).TotalSeconds < timeout)
    {
        await Task.Delay(100);
        log = logStorage.GetLog(logId);
        
        if (log.Status != "running")
        {
            break;
        }
    }
    
    // Check if the operation completed within the timeout
    if (log.Status == "completed" || log.Status == "error")
    {
        return new
        {
            status = log.Status,
            log_id = logId,
            result = log.Result,
            error = log.ErrorMessage,
            message = log.Status == "completed" ? "Operation completed successfully." : "Operation failed with an error."
        };
    }
    else
    {
        return new
        {
            status = "running",
            log_id = logId,
            partial_result = log.PartialResult,
            message = "Operation is still running. Try again later or use a longer timeout."
        };
    }
}
```

### 6.3 Partial Result Collection

For operations that can produce partial results, the Unity-AI Bridge implements a mechanism to collect and store these results:

```csharp
public object GetPartialResult(string toolId, object parameters)
{
    switch (toolId)
    {
        case "execute_code":
            return GetCodeExecutionPartialResult(parameters);
        
        case "run_test":
        case "run_all_tests":
            return GetTestRunPartialResult(parameters);
        
        default:
            return null;
    }
}

private object GetCodeExecutionPartialResult(object parameters)
{
    // Get any output or logs from the code execution
    var logs = codeExecutor.GetCurrentLogs();
    
    return new
    {
        logs = logs,
        execution_status = "in_progress"
    };
}

private object GetTestRunPartialResult(object parameters)
{
    // Get any test results that have completed so far
    var completedTests = testRunner.GetCompletedTests();
    
    return new
    {
        completed_tests = completedTests,
        total_tests = testRunner.GetTotalTests(),
        completed_count = completedTests.Count,
        test_run_status = "in_progress"
    };
}
```

### 6.4 Background Task Management

The Unity-AI Bridge manages background tasks to ensure they don't interfere with Unity's main thread:

```csharp
public class BackgroundTaskManager : MonoBehaviour
{
    private List<Task> activeTasks = new List<Task>();
    private List<Task> completedTasks = new List<Task>();
    
    private void Update()
    {
        // Check for completed tasks
        for (int i = activeTasks.Count - 1; i >= 0; i--)
        {
            var task = activeTasks[i];
            
            if (task.IsCompleted)
            {
                completedTasks.Add(task);
                activeTasks.RemoveAt(i);
            }
        }
        
        // Clean up completed tasks
        if (completedTasks.Count > 100)
        {
            completedTasks.Clear();
        }
    }
    
    public void RegisterTask(Task task)
    {
        activeTasks.Add(task);
    }
    
    public void CancelAllTasks()
    {
        // Cancel all active tasks
    }
    
    private void OnDestroy()
    {
        CancelAllTasks();
    }
}
```

## 7. AI Assistant Interaction

### 7.1 Timeout Handling

When an operation times out, the AI assistant should:

1. Acknowledge the timeout to the user
2. Store the Log ID for later use
3. Continue with other tasks or information gathering
4. Check for the result later using the Log ID

### 7.2 Result Retrieval

The AI assistant can retrieve results in several ways:

1. **Immediate Check**: Check if a quick operation has completed
2. **Delayed Check**: Wait a specific amount of time before checking
3. **Periodic Checks**: Check at regular intervals for long-running operations
4. **Final Check**: Check at the end of a conversation or task

### 7.3 Example Interaction

Here's an example of how an AI assistant should interact with the asynchronous execution model:

```
User: Can you run all the tests in my Unity project and tell me which ones are failing?

AI: I'll run all the tests in your Unity project. This might take a while, so I'll start the tests and then check the results.

[AI uses run_all_tests tool with a timeout of 5 seconds]

AI: I've started running all the tests in your Unity project. The operation has timed out after 5 seconds, which means the tests are still running. I'll check the results in a moment.

In the meantime, is there anything specific you're concerned about in the tests? Any particular area of the code you're focusing on?

User: I'm particularly concerned about the Fighter tests.

AI: I understand you're particularly concerned about the Fighter tests. Let me check if the test results are available now.

[AI uses get_operation_result tool with the Log ID]

AI: The tests are still running. So far, 15 out of 42 tests have completed. Of the completed tests, 12 have passed and 3 have failed.

Let me check specifically for any Fighter tests that have completed:

[AI analyzes the partial results for Fighter tests]

AI: Among the completed tests, I can see that 2 Fighter tests have run:
1. FighterTests.Constructor_SetsPropertiesCorrectly - PASSED
2. FighterTests.WithDescription_SetsDescription - FAILED

The failure in WithDescription_SetsDescription appears to be related to a null reference. Let me check again in a moment for more complete results.

[AI uses get_operation_result tool with the Log ID again]

AI: Great! All the tests have completed now. Here's a summary of the Fighter tests:

PASSED (4):
- FighterTests.Constructor_SetsPropertiesCorrectly
- FighterTests.WithAudioFile_SetsAudioFile
- FighterTests.WithImagePath_SetsImagePath
- FighterTests.WithImagePrompt_SetsImagePrompt

FAILED (1):
- FighterTests.WithDescription_SetsDescription

The failure in WithDescription_SetsDescription is due to:
"NullReferenceException: Object reference not set to an instance of an object at TrolleyGame.Fighter.WithDescription(String description)"

This suggests that there might be an issue with the Fighter.WithDescription method. Would you like me to look at the implementation of this method to identify the problem?
```

### 7.4 Best Practices for AI Assistants

AI assistants should follow these best practices when working with asynchronous operations:

1. **Set Appropriate Timeouts**: Use shorter timeouts for simple operations and longer timeouts for complex operations
2. **Inform the User**: Let the user know when an operation is running in the background
3. **Continue Interaction**: Don't block the conversation while waiting for results
4. **Check Periodically**: Check for results at appropriate intervals
5. **Provide Partial Information**: Share partial results when available
6. **Handle Errors Gracefully**: Inform the user if an operation fails and suggest alternatives

## 8. MCP Integration

### 8.1 MCP Tool Definitions

The asynchronous execution model is exposed through MCP with these tool definitions:

```json
{
  "id": "execute_code",
  "description": "Execute C# code in Unity at runtime",
  "parameters": {
    "type": "object",
    "properties": {
      "code": {
        "type": "string",
        "description": "C# code to execute"
      },
      "timeout": {
        "type": "number",
        "description": "Maximum time to wait in seconds",
        "default": 1
      }
    },
    "required": ["code"]
  }
}
```

```json
{
  "id": "get_operation_result",
  "description": "Retrieve the result of a previously initiated operation using its Log ID",
  "parameters": {
    "type": "object",
    "properties": {
      "log_id": {
        "type": "string",
        "description": "The Log ID of the operation"
      },
      "wait": {
        "type": "boolean",
        "description": "Whether to wait for the operation to complete",
        "default": false
      },
      "timeout": {
        "type": "number",
        "description": "Maximum time to wait in seconds (only used if wait is true)",
        "default": 5
      }
    },
    "required": ["log_id"]
  }
}
```

```json
{
  "id": "get_operation_status",
  "description": "Check the status of a previously initiated operation",
  "parameters": {
    "type": "object",
    "properties": {
      "log_id": {
        "type": "string",
        "description": "The Log ID of the operation"
      }
    },
    "required": ["log_id"]
  }
}
```

### 8.2 MCP Response Format

All MCP responses include the Log ID and status information:

```json
{
  "status": "completed", // "completed", "running", "error", "timeout", "not_found"
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    // The operation result if completed
  },
  "partial_result": {
    // Any partial results if still running or timed out
  },
  "error": "Error message if status is error",
  "message": "Human-readable message about the operation status"
}
```

## 9. Configuration

### 9.1 Default Timeout

The default timeout for operations is 1 second. This can be configured globally:

```csharp
public class UnityAIBridgeConfig : ScriptableObject
{
    [SerializeField] private int defaultTimeoutSeconds = 1;
    [SerializeField] private int maxTimeoutSeconds = 60;
    [SerializeField] private int logRetentionHours = 24;
    
    // Getters and setters
}
```

### 9.2 Maximum Timeout

To prevent abuse, a maximum timeout can be configured. Any timeout value larger than this will be capped:

```csharp
public int GetEffectiveTimeout(int requestedTimeout)
{
    return Math.Min(requestedTimeout, config.MaxTimeoutSeconds);
}
```

### 9.3 Log Retention

The log retention period determines how long operation logs are kept before being cleaned up:

```csharp
public void CleanupOldLogs()
{
    var maxAge = TimeSpan.FromHours(config.LogRetentionHours);
    logStorage.CleanupOldLogs(maxAge);
}
```

## 10. Security Considerations

### 10.1 Resource Consumption

Long-running operations can consume significant resources. To mitigate this:

1. **Operation Limits**: Limit the number of concurrent operations
2. **Resource Monitoring**: Monitor CPU, memory, and other resource usage
3. **Cancellation**: Provide a way to cancel long-running operations
4. **Timeouts**: Enforce maximum timeouts for all operations

### 10.2 Log ID Security

Log IDs provide access to operation results. To secure them:

1. **Use UUIDs**: Generate cryptographically strong UUIDs
2. **Limited Lifetime**: Enforce log retention policies
3. **Access Control**: Restrict access to logs based on the originating session
4. **Sanitization**: Ensure logs don't contain sensitive information

## 11. Conclusion

The asynchronous execution model for the Unity-AI Bridge with MCP compatibility enables AI assistants to work with long-running operations in Unity without blocking the conversation. By implementing timeouts, Log IDs, and result retrieval mechanisms, the bridge provides a flexible and responsive way to interact with Unity.

This model is particularly valuable for operations like running tests, executing complex code, or performing resource-intensive tasks that may take longer than typical request timeouts. The ability to retrieve partial results and check operation status allows AI assistants to provide feedback and continue the conversation while operations complete in the background.

By following the best practices outlined in this specification, AI assistants can provide a smooth and responsive experience when working with Unity, even when performing complex and time-consuming operations.

## 12. References

- [Model Context Protocol Specification](./01-model-context-protocol.md)
- [Unity-AI Bridge with MCP Compatibility Specification](./02-unity-ai-bridge-mcp.md)
- [Unity Documentation on Coroutines](https://docs.unity3d.com/Manual/Coroutines.html)
- [C# Task-based Asynchronous Pattern](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)
