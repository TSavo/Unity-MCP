# Unity SDK

## Overview

The Unity SDK is a C# library that Unity developers can use in their projects to interact with the Unity-MCP system. It provides a clean, simple API for logging information, writing results, and communicating with AI assistants.

## Purpose

The Unity SDK fulfills several critical roles in the Unity-MCP architecture:

1. **Developer API**: Provides a clean, simple API for Unity developers.
2. **Data Communication**: Allows Unity code to write data that becomes available to the MCP client.
3. **Abstraction Layer**: Abstracts away the communication details with the Web Server.
4. **Bidirectional Communication**: Enables bidirectional communication between Unity games and AI assistants.

## Implementation

The Unity SDK is implemented as a C# library with a simple, fluent API that makes it easy for Unity developers to interact with the system.

### Key Components

1. **AI Class**: The main entry point for the SDK.
2. **Result Class**: Represents a named result that can be written to, appended to, or cleared.
3. **Integration Bridge**: Connects the SDK to the Unity Integration.
4. **Serialization Utilities**: Handles serialization of data for communication.

## Code Example

```csharp
using UnityEngine;
using System;
using System.Collections.Generic;

namespace UnityMCP
{
    /// <summary>
    /// The main entry point for the Unity MCP SDK.
    /// </summary>
    public static class AI
    {
        private static UnityMCPIntegration integration;
        
        /// <summary>
        /// Gets a reference to a named result.
        /// </summary>
        /// <param name="name">The name of the result.</param>
        /// <returns>A Result object that can be used to write, append, or clear data.</returns>
        public static Result Result(string name)
        {
            return new Result(name);
        }
        
        /// <summary>
        /// Logs a message that will be available to AI assistants.
        /// </summary>
        /// <param name="message">The message to log.</param>
        public static void Log(string message)
        {
            Result("log").Append(message);
        }
        
        /// <summary>
        /// Logs an error message that will be available to AI assistants.
        /// </summary>
        /// <param name="message">The error message to log.</param>
        public static void LogError(string message)
        {
            Result("error").Append(message);
        }
        
        /// <summary>
        /// Logs a warning message that will be available to AI assistants.
        /// </summary>
        /// <param name="message">The warning message to log.</param>
        public static void LogWarning(string message)
        {
            Result("warning").Append(message);
        }
        
        /// <summary>
        /// Registers the Unity Integration with the SDK.
        /// This is called by the Unity Integration when it starts.
        /// </summary>
        /// <param name="integration">The Unity Integration instance.</param>
        internal static void RegisterIntegration(UnityMCPIntegration integration)
        {
            AI.integration = integration;
        }
        
        /// <summary>
        /// Sends data to the Web Server.
        /// This is used internally by the Result class.
        /// </summary>
        /// <param name="resultName">The name of the result.</param>
        /// <param name="data">The data to send.</param>
        internal static void SendData(string resultName, object data)
        {
            if (integration == null)
            {
                Debug.LogWarning("[Unity MCP SDK] Cannot send data: Integration not registered");
                return;
            }
            
            integration.SendData(resultName, data);
        }
    }
    
    /// <summary>
    /// Represents a named result that can be written to, appended to, or cleared.
    /// </summary>
    public class Result
    {
        private string name;
        
        /// <summary>
        /// Creates a new Result with the specified name.
        /// </summary>
        /// <param name="name">The name of the result.</param>
        public Result(string name)
        {
            this.name = name;
        }
        
        /// <summary>
        /// Writes data to the result, replacing any existing data.
        /// </summary>
        /// <param name="data">The data to write.</param>
        public void Write(object data)
        {
            AI.SendData(name, new ResultData
            {
                action = "write",
                data = data
            });
        }
        
        /// <summary>
        /// Appends data to the result, preserving existing data.
        /// </summary>
        /// <param name="data">The data to append.</param>
        public void Append(object data)
        {
            AI.SendData(name, new ResultData
            {
                action = "append",
                data = data
            });
        }
        
        /// <summary>
        /// Clears the result, removing all data.
        /// </summary>
        public void Clear()
        {
            AI.SendData(name, new ResultData
            {
                action = "clear",
                data = null
            });
        }
    }
    
    /// <summary>
    /// Represents data sent to a result.
    /// </summary>
    [Serializable]
    internal class ResultData
    {
        public string action;
        public object data;
    }
}
```

## API Reference

### AI Class

The `AI` class is the main entry point for the SDK. It provides methods for getting references to named results and logging messages.

#### Methods

- **Result(string name)**
  - Description: Gets a reference to a named result.
  - Parameters:
    - `name` (string): The name of the result.
  - Returns: A `Result` object that can be used to write, append, or clear data.

- **Log(string message)**
  - Description: Logs a message that will be available to AI assistants.
  - Parameters:
    - `message` (string): The message to log.

- **LogError(string message)**
  - Description: Logs an error message that will be available to AI assistants.
  - Parameters:
    - `message` (string): The error message to log.

- **LogWarning(string message)**
  - Description: Logs a warning message that will be available to AI assistants.
  - Parameters:
    - `message` (string): The warning message to log.

### Result Class

The `Result` class represents a named result that can be written to, appended to, or cleared.

#### Methods

- **Write(object data)**
  - Description: Writes data to the result, replacing any existing data.
  - Parameters:
    - `data` (object): The data to write.

- **Append(object data)**
  - Description: Appends data to the result, preserving existing data.
  - Parameters:
    - `data` (object): The data to append.

- **Clear()**
  - Description: Clears the result, removing all data.

## Usage Examples

### Basic Usage

```csharp
using UnityEngine;
using UnityMCP;

public class Player : MonoBehaviour
{
    private void Start()
    {
        // Log a message
        AI.Log("Player started");
        
        // Write player stats
        AI.Result("player_stats").Write(new
        {
            health = 100,
            position = transform.position
        });
    }
    
    private void Update()
    {
        // Update player stats
        AI.Result("player_position").Write(transform.position);
    }
    
    public void TakeDamage(int amount)
    {
        // Log damage
        AI.Log($"Player took {amount} damage");
        
        // Update health
        int health = GetComponent<Health>().CurrentHealth;
        AI.Result("player_health").Write(health);
    }
}
```

### Advanced Usage

```csharp
using UnityEngine;
using UnityMCP;
using System.Collections.Generic;

public class GameManager : MonoBehaviour
{
    private List<string> gameEvents = new List<string>();
    
    private void Start()
    {
        // Clear any existing game events
        AI.Result("game_events").Clear();
    }
    
    public void LogGameEvent(string eventName, object eventData)
    {
        // Create a timestamped event
        var gameEvent = new
        {
            name = eventName,
            data = eventData,
            timestamp = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
        };
        
        // Add to local list
        gameEvents.Add(JsonUtility.ToJson(gameEvent));
        
        // Append to game events result
        AI.Result("game_events").Append(gameEvent);
        
        // Also log a simple message
        AI.Log($"Game event: {eventName}");
    }
    
    public void SaveGameState()
    {
        // Save the current game state
        var gameState = new
        {
            level = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name,
            playerPosition = GameObject.FindWithTag("Player").transform.position,
            enemies = GameObject.FindGameObjectsWithTag("Enemy").Length,
            gameEvents = gameEvents
        };
        
        // Write the game state
        AI.Result("game_state").Write(gameState);
        
        AI.Log("Game state saved");
    }
}
```

## Integration with Unity

The Unity SDK is designed to be easy to integrate into Unity projects:

1. **Import the SDK**: Import the Unity SDK package into your Unity project.
2. **Add the Integration**: Add the Unity Integration prefab to your scene.
3. **Use the API**: Use the `AI` class to interact with the system.

## Thread Safety

The Unity SDK is designed to be thread-safe, allowing it to be used from any thread in Unity:

- **Main Thread**: All Unity API calls are made on the main thread.
- **Background Threads**: Data can be sent from background threads.
- **Coroutines**: The SDK can be used from coroutines.

## Performance Considerations

When using the Unity SDK, consider the following performance implications:

1. **Data Size**: Large data objects may impact performance. Consider sending only the necessary data.
2. **Update Frequency**: Frequent updates may impact performance. Consider throttling updates for rapidly changing values.
3. **Serialization**: Complex objects may be expensive to serialize. Consider using simple data structures.

## Security Considerations

When using the Unity SDK, consider the following security implications:

1. **Sensitive Data**: Be careful not to expose sensitive data through the SDK.
2. **User Privacy**: Respect user privacy by not logging personal information.
3. **Access Control**: Implement access control to restrict who can access the data.

## Conclusion

The Unity SDK is a critical component of the Unity-MCP architecture, providing a clean, simple API for Unity developers to interact with the system. It enables bidirectional communication between Unity games and AI assistants, allowing for a wide range of applications.
