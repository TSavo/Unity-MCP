# Asynchronous Operations in MCP Unity Bridge

## 1. Introduction

This specification defines how the MCP Unity Bridge tool supports asynchronous operations. The goal is to enable the AI to execute long-running operations in Unity without blocking, and to retrieve results later using log IDs.

## 2. Core Requirements

The MCP Unity Bridge tool supports:

1. **Timeout Parameters**: All operations accept a timeout parameter
2. **Log IDs**: All responses include a unique log ID
3. **Partial Results**: Operations that timeout return partial results when available
4. **Result Retrieval**: A separate tool call allows retrieving results using log IDs
5. **Continuation**: The AI can continue execution while waiting for results

## 3. Tool Interface

### 3.1 Minimal Command Set

The Unity-MCP Bridge provides exactly six commands:

#### 3.1.1 Execute Code

```json
{
  "tool_id": "unity_execute_code",
  "parameters": {
    "code": "// Some potentially long-running code",
    "timeout": 1000  // Default timeout in milliseconds
  }
}
```

#### 3.1.2 Execute Query

```json
{
  "tool_id": "unity_query",
  "parameters": {
    "query": "Scene['Player'].transform.position",
    "timeout": 1000  // Default timeout in milliseconds
  }
}
```

#### 3.1.3 Get Result

```json
{
  "tool_id": "unity_get_result",
  "parameters": {
    "log_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### 3.1.4 Get Logs

```json
{
  "tool_id": "unity_get_logs",
  "parameters": {
    "log_name": "string (optional)",
    "limit": 10,
    "since": "string (optional, ISO timestamp)",
    "log_type": "string (optional, error|warning|info|all)"
  }
}
```

#### 3.1.5 Get Log Details

```json
{
  "tool_id": "unity_get_log_details",
  "parameters": {
    "log_id": "string"
  }
}
```

#### 3.1.6 Get Help

```json
{
  "tool_id": "unity_help",
  "parameters": {}
}
```

### 3.2 Response Format

All tool responses include a log ID and status:

```json
{
  "status": "completed",  // or "timeout", "error"
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "result": { /* result data if completed */ },
  "partial_result": { /* partial data if available */ },
  "is_complete": true,  // or false if timed out
  "message": "Operation completed successfully."
}
```

For timeout responses:

```json
{
  "status": "timeout",
  "log_id": "550e8400-e29b-41d4-a716-446655440000",
  "partial_result": { /* any partial data available */ },
  "is_complete": false,
  "message": "Operation timed out. Use the unity_get_result tool with this log_id to retrieve the complete result when available."
}
```

## 4. Unity Threading Model and MCP Integration

### 4.1 Unity's Single-Threaded Execution Model

Unity uses a primarily single-threaded execution model where most Unity API calls must be made from the main thread. This includes:
- Accessing or modifying GameObjects and Components
- Modifying scene hierarchy
- Accessing Unity's rendering, physics, or input systems
- Instantiating or destroying objects

Attempting to access these APIs from background threads will result in errors or undefined behavior.

### 4.2 Coroutines as Unity's Asynchronous Pattern

Instead of traditional multi-threading, Unity uses coroutines as its primary asynchronous pattern:
- Coroutines run on the main thread but can yield execution
- They resume execution in a subsequent frame
- They allow long-running operations without blocking the main thread
- They maintain access to Unity's APIs throughout their execution

### 4.3 MCP-Unity Bridge Threading Architecture

The MCP-Unity Bridge handles this unique threading model by:
1. Receiving requests on background threads via HTTP
2. Queuing operations to run on Unity's main thread
3. Using coroutines for long-running operations
4. Storing results in thread-safe storage
5. Allowing retrieval of results from any thread

### 4.4 Log ID and Thread Context

The Log ID system is critical for maintaining context across thread boundaries:
- Each operation generates a unique Log ID regardless of which thread initiates it
- The Log ID follows the operation as it moves from background threads to the main thread
- Results are stored indexed by Log ID in thread-safe storage
- The AI can retrieve results using the Log ID from any thread context

This architecture ensures that the MCP-Unity Bridge can handle asynchronous operations while respecting Unity's threading requirements.

## 5. Implementation Guidelines

### 5.1 Timeout Handling

- Default timeout should be 1000 milliseconds
- Operations should continue running in the background after timeout
- The Unity bridge should store partial results as they become available

### 5.2 Log ID Management

- Log IDs should be UUIDs or similarly unique identifiers
- All results should be stored and indexed by log ID
- Results should be retained for a reasonable period (e.g., 24 hours)

### 5.3 Result Storage

- The Unity bridge must maintain a result storage system
- Results should be stored even if the AI doesn't immediately retrieve them
- Storage should include both complete and partial results

## 6. AI Interaction Pattern

The AI should be instructed to follow this pattern:

1. Execute an operation with an appropriate timeout
2. If the operation times out:
   - Store the log ID
   - Continue with other tasks or information gathering
   - Retrieve the result later using the log ID
3. If the operation completes within the timeout:
   - Process the result immediately

Example interaction:

```
AI: I'll run all the tests in your Unity project.

[AI uses unity_execute_code tool with a timeout of 1000 milliseconds]

AI: I've started running the tests. This might take a while, so I'll continue with other tasks and check the results later.

[AI continues conversation]

AI: Let me check if those test results are available now.

[AI uses unity_get_result tool with the stored log ID]

AI: The tests have completed. Here are the results...
```

## 7. Tool Implementation

The MCP Unity Bridge should implement these operations:

### 7.1 Code Execution

```csharp
public object ExecuteCode(string code, int timeout)
{
    string logId = GenerateLogId();

    try
    {
        // Start a task to execute the code
        var task = Task.Run(() => codeExecutor.Execute(code));

        // Wait for the task to complete or timeout
        if (task.Wait(timeout))
        {
            // Task completed within timeout
            var result = task.Result;

            // Store the result
            resultStorage.StoreResult(logId, result, true);

            return new {
                status = "completed",
                log_id = logId,
                result = result,
                is_complete = true,
                message = "Code execution completed successfully."
            };
        }
        else
        {
            // Task timed out
            var partialResult = codeExecutor.GetPartialResult();

            // Store the partial result
            resultStorage.StoreResult(logId, partialResult, false);

            // Continue execution in background
            ContinueExecutionInBackground(task, logId);

            return new {
                status = "timeout",
                log_id = logId,
                partial_result = partialResult,
                is_complete = false,
                message = "Code execution timed out. Use the unity_get_result tool with this log_id to retrieve the complete result when available."
            };
        }
    }
    catch (Exception ex)
    {
        // Store the error
        resultStorage.StoreError(logId, ex.Message);

        return new {
            status = "error",
            log_id = logId,
            error = ex.Message,
            is_complete = true,
            message = "Code execution failed with an error."
        };
    }
}
```

### 7.2 Result Retrieval

```csharp
public object GetResult(string logId)
{
    // Get the stored result
    var storedResult = resultStorage.GetResult(logId);

    if (storedResult == null)
    {
        return new {
            status = "not_found",
            log_id = logId,
            message = "No result found for the provided log ID."
        };
    }

    return new {
        status = storedResult.IsComplete ? "completed" : "in_progress",
        log_id = logId,
        result = storedResult.Result,
        partial_result = storedResult.PartialResult,
        is_complete = storedResult.IsComplete,
        message = storedResult.IsComplete
            ? "Operation completed successfully."
            : "Operation is still in progress. Try again later."
    };
}
```

## 7. Communication with AI.Write

The Unity Bridge should use `AI.Write` to communicate results to the log system. This replaces the traditional logging approach (like TrolleyDebug) and completes the communication loop between Unity and the AI.

```csharp
public static class AI
{
    /// <summary>
    /// Writes data to the log with a specific log ID for later retrieval
    /// </summary>
    public static void Write(string logId, object data)
    {
        // Convert data to JSON
        string jsonData = JsonConvert.SerializeObject(data, Formatting.Indented);

        // Write to the log file with the log ID as a header
        string logEntry = $"[LOG_ID:{logId}]\n{jsonData}\n[/LOG_ID:{logId}]";

        // Write to a dedicated log file that the MCP server can access
        string logPath = Path.Combine(Application.persistentDataPath, "AI_Logs", $"{logId}.json");
        Directory.CreateDirectory(Path.GetDirectoryName(logPath));
        File.WriteAllText(logPath, jsonData);

        // Also write to the Unity console for debugging
        Debug.Log($"AI.Write: {logId}\n{jsonData}");
    }

    /// <summary>
    /// Updates an existing log entry with new data
    /// </summary>
    public static void Update(string logId, object data)
    {
        // Same as Write, but indicates this is an update to existing data
        Write(logId, data);
    }

    /// <summary>
    /// Writes an error to the log
    /// </summary>
    public static void WriteError(string logId, string errorMessage, Exception ex = null)
    {
        object errorData = new
        {
            error = errorMessage,
            stackTrace = ex?.StackTrace,
            timestamp = DateTime.UtcNow
        };

        Write(logId, errorData);
    }
}

## 8. Result Storage Implementation

```csharp
public class ResultStorage
{
    private Dictionary<string, StoredResult> results = new Dictionary<string, StoredResult>();

    public void StoreResult(string logId, object result, bool isComplete)
    {
        var storedResult = new StoredResult
        {
            LogId = logId,
            Result = result,
            IsComplete = isComplete,
            Timestamp = DateTime.UtcNow
        };

        results[logId] = storedResult;

        // Write to the AI log system
        AI.Write(logId, new {
            status = isComplete ? "completed" : "in_progress",
            result = result,
            is_complete = isComplete,
            timestamp = DateTime.UtcNow.ToString("o")
        });
    }

    public void UpdateResult(string logId, object result, bool isComplete)
    {
        if (results.TryGetValue(logId, out var storedResult))
        {
            storedResult.Result = result;
            storedResult.IsComplete = isComplete;
            storedResult.LastUpdated = DateTime.UtcNow;

            // Update the AI log
            AI.Update(logId, new {
                status = isComplete ? "completed" : "in_progress",
                result = result,
                is_complete = isComplete,
                timestamp = DateTime.UtcNow.ToString("o")
            });
        }
    }

    public StoredResult GetResult(string logId)
    {
        if (results.TryGetValue(logId, out var storedResult))
        {
            return storedResult;
        }

        // Try to read from the log file if not in memory
        string logPath = Path.Combine(Application.persistentDataPath, "AI_Logs", $"{logId}.json");
        if (File.Exists(logPath))
        {
            try
            {
                string jsonData = File.ReadAllText(logPath);
                var logData = JsonConvert.DeserializeObject<dynamic>(jsonData);

                storedResult = new StoredResult
                {
                    LogId = logId,
                    Result = logData.result,
                    IsComplete = logData.is_complete,
                    Timestamp = DateTime.Parse(logData.timestamp.ToString())
                };

                // Cache it in memory
                results[logId] = storedResult;

                return storedResult;
            }
            catch (Exception ex)
            {
                Debug.LogError($"Error reading log file: {ex.Message}");
            }
        }

        return null;
    }

    public void StoreError(string logId, string errorMessage)
    {
        var storedResult = new StoredResult
        {
            LogId = logId,
            Error = errorMessage,
            IsComplete = true,
            Timestamp = DateTime.UtcNow
        };

        results[logId] = storedResult;

        // Write to the AI log system
        AI.WriteError(logId, errorMessage);
    }

    public void CleanupOldResults(TimeSpan maxAge)
    {
        var cutoffTime = DateTime.UtcNow - maxAge;
        var keysToRemove = results
            .Where(kvp => kvp.Value.Timestamp < cutoffTime)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var key in keysToRemove)
        {
            results.Remove(key);

            // Also remove the log file
            string logPath = Path.Combine(Application.persistentDataPath, "AI_Logs", $"{key}.json");
            if (File.Exists(logPath))
            {
                File.Delete(logPath);
            }
        }
    }
}

public class StoredResult
{
    public string LogId { get; set; }
    public object Result { get; set; }
    public object PartialResult { get; set; }
    public string Error { get; set; }
    public bool IsComplete { get; set; }
    public DateTime Timestamp { get; set; }
    public DateTime LastUpdated { get; set; }
}
```

## 8. MCP Tool Definitions

The MCP Unity Bridge defines exactly six tools:

```json
{
  "tools": [
    {
      "id": "unity_execute_code",
      "description": "Execute C# code in Unity. For long-running operations, use the unity_get_result tool with the returned log_id to retrieve results later.",
      "parameters": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "description": "C# code to execute in Unity"
          },
          "timeout": {
            "type": "number",
            "description": "Maximum time to wait in milliseconds before returning (default: 1000)",
            "default": 1000
          }
        },
        "required": ["code"]
      }
    },
    {
      "id": "unity_query",
      "description": "Execute a query using dot notation to access objects, properties, and methods in Unity",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Query string using dot notation (e.g., Scene['Player'].transform.position)"
          },
          "timeout": {
            "type": "number",
            "description": "Maximum time to wait in milliseconds before returning (default: 1000)",
            "default": 1000
          }
        },
        "required": ["query"]
      }
    },
    {
      "id": "unity_get_result",
      "description": "Retrieve the result of a previously executed operation using its log ID",
      "parameters": {
        "type": "object",
        "properties": {
          "log_id": {
            "type": "string",
            "description": "The log ID returned from a previous operation"
          }
        },
        "required": ["log_id"]
      }
    },
    {
      "id": "unity_get_logs",
      "description": "Retrieve logs from Unity, including errors, messages, and custom logs",
      "parameters": {
        "type": "object",
        "properties": {
          "log_name": {
            "type": "string",
            "description": "Name of the log to retrieve (default: all logs)"
          },
          "limit": {
            "type": "number",
            "description": "Maximum number of log entries to return (default: 10)",
            "default": 10
          },
          "since": {
            "type": "string",
            "description": "Only return logs that occurred after this timestamp (ISO format)"
          },
          "log_type": {
            "type": "string",
            "description": "Type of logs to retrieve (error, warning, info, all)",
            "default": "all"
          }
        }
      }
    },
    {
      "id": "unity_get_log_details",
      "description": "Retrieve detailed information about a specific log entry",
      "parameters": {
        "type": "object",
        "properties": {
          "log_id": {
            "type": "string",
            "description": "The ID of the log entry to retrieve details for"
          }
        },
        "required": ["log_id"]
      }
    },
    {
      "id": "unity_help",
      "description": "Get documentation on the available commands and query syntax",
      "parameters": {
        "type": "object",
        "properties": {}
      }
    }
  ]
}
```

## 9. Conclusion

By implementing this asynchronous operation pattern with a minimal command set in the MCP Unity Bridge, the AI will be able to:

1. Execute long-running operations without blocking
2. Retrieve results later using log IDs
3. Continue interaction while waiting for results
4. Access both complete and partial results

This approach significantly enhances the AI's ability to work with Unity, especially for complex operations like running tests, executing resource-intensive code, or performing scene analysis.

The minimal command set of just six commands (execute code, execute query, get result, get help) provides a powerful yet simple interface that can access any object, property, or method in Unity without requiring specific commands for each operation. This design is future-proof and requires no modifications to support new Unity features or game-specific functionality.
