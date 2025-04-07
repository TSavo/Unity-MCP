# Usage Examples

## Overview

This document provides practical examples of using Unity-MCP in various scenarios. It covers examples for both AI assistants interacting with Unity and Unity developers using the SDK.

## AI Assistant Examples

### 1. Inspecting Game Objects

#### Example: Finding All Game Objects in the Scene

**Claude's Request:**
```
Can you list all the game objects in the current scene?
```

**MCP STDIO Client Code:**
```typescript
// Execute code in Unity
const response = await executeCode(`
  // Find all root game objects in the scene
  var rootObjects = UnityEngine.SceneManagement.SceneManager.GetActiveScene().GetRootGameObjects();
  
  // Create a list to store all game objects
  var allObjects = new System.Collections.Generic.List<UnityEngine.GameObject>();
  
  // Add all root objects to the list
  foreach (var rootObject in rootObjects) {
    allObjects.Add(rootObject);
    
    // Add all children recursively
    foreach (var child in rootObject.GetComponentsInChildren<UnityEngine.Transform>(true)) {
      if (child.gameObject != rootObject) {
        allObjects.Add(child.gameObject);
      }
    }
  }
  
  // Return information about each game object
  return allObjects.Select(obj => new {
    name = obj.name,
    active = obj.activeSelf,
    tag = obj.tag,
    layer = obj.layer,
    components = obj.GetComponents<UnityEngine.Component>().Select(c => c.GetType().Name).ToArray()
  }).ToArray();
`);
```

**Result:**
```json
[
  {
    "name": "Main Camera",
    "active": true,
    "tag": "MainCamera",
    "layer": 0,
    "components": ["Transform", "Camera", "AudioListener"]
  },
  {
    "name": "Directional Light",
    "active": true,
    "tag": "Untagged",
    "layer": 0,
    "components": ["Transform", "Light"]
  },
  {
    "name": "Player",
    "active": true,
    "tag": "Player",
    "layer": 0,
    "components": ["Transform", "MeshFilter", "MeshRenderer", "Rigidbody", "PlayerController"]
  },
  // More game objects...
]
```

### 2. Modifying Game Objects

#### Example: Moving a Game Object

**Claude's Request:**
```
Can you move the Player object 5 units up?
```

**MCP STDIO Client Code:**
```typescript
// Execute code in Unity
const response = await executeCode(`
  // Find the Player game object
  var player = UnityEngine.GameObject.FindWithTag("Player");
  
  if (player == null) {
    return "Player not found";
  }
  
  // Get the current position
  var position = player.transform.position;
  
  // Store the original position for the response
  var originalPosition = position;
  
  // Move the player 5 units up
  position.y += 5;
  player.transform.position = position;
  
  // Return the original and new positions
  return new {
    originalPosition = originalPosition,
    newPosition = player.transform.position
  };
`);
```

**Result:**
```json
{
  "originalPosition": {
    "x": 0,
    "y": 1,
    "z": 0
  },
  "newPosition": {
    "x": 0,
    "y": 6,
    "z": 0
  }
}
```

### 3. Creating Game Objects

#### Example: Creating a Cube

**Claude's Request:**
```
Can you create a red cube at position (2, 0, 3)?
```

**MCP STDIO Client Code:**
```typescript
// Execute code in Unity
const response = await executeCode(`
  // Create a cube
  var cube = UnityEngine.GameObject.CreatePrimitive(UnityEngine.PrimitiveType.Cube);
  
  // Set its name
  cube.name = "RedCube";
  
  // Set its position
  cube.transform.position = new UnityEngine.Vector3(2, 0, 3);
  
  // Set its color to red
  var renderer = cube.GetComponent<UnityEngine.Renderer>();
  renderer.material.color = UnityEngine.Color.red;
  
  // Return information about the created cube
  return new {
    name = cube.name,
    position = cube.transform.position,
    color = renderer.material.color
  };
`);
```

**Result:**
```json
{
  "name": "RedCube",
  "position": {
    "x": 2,
    "y": 0,
    "z": 3
  },
  "color": {
    "r": 1,
    "g": 0,
    "b": 0,
    "a": 1
  }
}
```

### 4. Executing Game Logic

#### Example: Triggering a Game Event

**Claude's Request:**
```
Can you trigger the StartGame method on the GameManager?
```

**MCP STDIO Client Code:**
```typescript
// Execute code in Unity
const response = await executeCode(`
  // Find the GameManager
  var gameManager = UnityEngine.GameObject.Find("GameManager");
  
  if (gameManager == null) {
    return "GameManager not found";
  }
  
  // Get the GameManager component
  var gameManagerComponent = gameManager.GetComponent<GameManager>();
  
  if (gameManagerComponent == null) {
    return "GameManager component not found";
  }
  
  // Call the StartGame method
  gameManagerComponent.StartGame();
  
  // Return success message
  return "Game started successfully";
`);
```

**Result:**
```json
"Game started successfully"
```

### 5. Querying Component Properties

#### Example: Getting Player Health

**Claude's Request:**
```
What is the current health of the player?
```

**MCP STDIO Client Code:**
```typescript
// Execute query in Unity
const response = await executeQuery(`
  UnityEngine.GameObject.FindWithTag("Player").GetComponent<Health>().currentHealth
`);
```

**Result:**
```json
75
```

### 6. Asynchronous Operations

#### Example: Running a Long Operation

**Claude's Request:**
```
Can you generate 1000 random positions and find the closest one to the player?
```

**MCP STDIO Client Code:**
```typescript
// Execute code in Unity with a longer timeout
const response = await executeCode(`
  // Find the player
  var player = UnityEngine.GameObject.FindWithTag("Player");
  
  if (player == null) {
    return "Player not found";
  }
  
  var playerPosition = player.transform.position;
  
  // Generate 1000 random positions
  var random = new System.Random();
  var positions = new UnityEngine.Vector3[1000];
  
  for (int i = 0; i < 1000; i++) {
    positions[i] = new UnityEngine.Vector3(
      (float)random.NextDouble() * 100 - 50,
      (float)random.NextDouble() * 100 - 50,
      (float)random.NextDouble() * 100 - 50
    );
  }
  
  // Find the closest position
  var closestPosition = positions[0];
  var closestDistance = UnityEngine.Vector3.Distance(playerPosition, closestPosition);
  
  for (int i = 1; i < positions.Length; i++) {
    var distance = UnityEngine.Vector3.Distance(playerPosition, positions[i]);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPosition = positions[i];
    }
  }
  
  // Return the result
  return new {
    playerPosition = playerPosition,
    closestPosition = closestPosition,
    distance = closestDistance
  };
`, 5000); // 5 second timeout
```

**Result (if operation completes within timeout):**
```json
{
  "playerPosition": {
    "x": 0,
    "y": 1,
    "z": 0
  },
  "closestPosition": {
    "x": 0.123,
    "y": 1.456,
    "z": 0.789
  },
  "distance": 0.912
}
```

**Result (if operation exceeds timeout):**
```json
{
  "success": true,
  "result": null,
  "logId": "550e8400-e29b-41d4-a716-446655440000",
  "complete": false,
  "message": "Operation is still running. Use get_result to check for completion."
}
```

**Follow-up to get the result:**
```typescript
// Get the result using the logId
const result = await getResult("550e8400-e29b-41d4-a716-446655440000");
```

### 7. Working with Unity's Physics

#### Example: Applying Force to a Rigidbody

**Claude's Request:**
```
Can you apply an upward force to the player's rigidbody?
```

**MCP STDIO Client Code:**
```typescript
// Execute code in Unity
const response = await executeCode(`
  // Find the player
  var player = UnityEngine.GameObject.FindWithTag("Player");
  
  if (player == null) {
    return "Player not found";
  }
  
  // Get the rigidbody component
  var rigidbody = player.GetComponent<UnityEngine.Rigidbody>();
  
  if (rigidbody == null) {
    return "Player does not have a Rigidbody component";
  }
  
  // Apply an upward force
  rigidbody.AddForce(UnityEngine.Vector3.up * 500);
  
  // Return success message
  return new {
    message = "Applied upward force to player",
    velocity = rigidbody.velocity
  };
`);
```

**Result:**
```json
{
  "message": "Applied upward force to player",
  "velocity": {
    "x": 0,
    "y": 10,
    "z": 0
  }
}
```

## Unity SDK Examples

### 1. Basic Logging

```csharp
using UnityEngine;
using UnityMCP;

public class ExampleLogger : MonoBehaviour
{
    private void Start()
    {
        // Log a simple message
        AI.Log("Game started");
        
        // Log an error
        AI.LogError("Failed to load config file");
        
        // Log a warning
        AI.LogWarning("Low memory");
    }
}
```

### 2. Storing Player Stats

```csharp
using UnityEngine;
using UnityMCP;

public class PlayerStats : MonoBehaviour
{
    public int health = 100;
    public int mana = 50;
    public int level = 1;
    public int experience = 0;
    
    private void Start()
    {
        // Store initial player stats
        UpdateStats();
    }
    
    public void TakeDamage(int amount)
    {
        health -= amount;
        
        // Log the damage
        AI.Log($"Player took {amount} damage");
        
        // Update stats
        UpdateStats();
    }
    
    public void GainExperience(int amount)
    {
        experience += amount;
        
        // Check for level up
        if (experience >= level * 100)
        {
            level++;
            experience = 0;
            health = 100;
            mana = 50;
            
            // Log the level up
            AI.Log($"Player leveled up to level {level}");
        }
        
        // Update stats
        UpdateStats();
    }
    
    private void UpdateStats()
    {
        // Store player stats
        AI.Result("player_stats").Write(new
        {
            health,
            mana,
            level,
            experience
        });
    }
}
```

### 3. Tracking Game Events

```csharp
using UnityEngine;
using UnityMCP;
using System.Collections.Generic;

public class GameEventTracker : MonoBehaviour
{
    private List<object> gameEvents = new List<object>();
    
    private void Start()
    {
        // Clear any existing game events
        AI.Result("game_events").Clear();
    }
    
    public void TrackEvent(string eventType, object eventData)
    {
        // Create a timestamped event
        var gameEvent = new
        {
            type = eventType,
            data = eventData,
            timestamp = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
        };
        
        // Add to local list
        gameEvents.Add(gameEvent);
        
        // Append to game events result
        AI.Result("game_events").Append(gameEvent);
        
        // Log the event
        AI.Log($"Game event: {eventType}");
    }
    
    // Example event tracking methods
    
    public void TrackPlayerDeath(Vector3 position, string cause)
    {
        TrackEvent("player_death", new
        {
            position,
            cause
        });
    }
    
    public void TrackItemPickup(string itemName, Vector3 position)
    {
        TrackEvent("item_pickup", new
        {
            itemName,
            position
        });
    }
    
    public void TrackEnemyKill(string enemyType, Vector3 position)
    {
        TrackEvent("enemy_kill", new
        {
            enemyType,
            position
        });
    }
}
```

### 4. Saving Game State

```csharp
using UnityEngine;
using UnityMCP;
using System.Collections.Generic;

public class GameStateSaver : MonoBehaviour
{
    public void SaveGameState()
    {
        // Get player information
        var player = GameObject.FindWithTag("Player");
        var playerPosition = player.transform.position;
        var playerStats = player.GetComponent<PlayerStats>();
        
        // Get enemy information
        var enemies = GameObject.FindGameObjectsWithTag("Enemy");
        var enemyData = new List<object>();
        
        foreach (var enemy in enemies)
        {
            enemyData.Add(new
            {
                name = enemy.name,
                position = enemy.transform.position,
                health = enemy.GetComponent<EnemyHealth>().health
            });
        }
        
        // Get item information
        var items = GameObject.FindGameObjectsWithTag("Item");
        var itemData = new List<object>();
        
        foreach (var item in items)
        {
            itemData.Add(new
            {
                name = item.name,
                position = item.transform.position,
                type = item.GetComponent<Item>().type
            });
        }
        
        // Create game state object
        var gameState = new
        {
            player = new
            {
                position = playerPosition,
                stats = new
                {
                    health = playerStats.health,
                    mana = playerStats.mana,
                    level = playerStats.level,
                    experience = playerStats.experience
                }
            },
            enemies = enemyData,
            items = itemData,
            timestamp = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
        };
        
        // Save game state
        AI.Result("game_state").Write(gameState);
        
        // Log the save
        AI.Log("Game state saved");
    }
}
```

### 5. Debugging with the SDK

```csharp
using UnityEngine;
using UnityMCP;

public class DebugHelper : MonoBehaviour
{
    public static void LogObjectHierarchy(GameObject obj, string prefix = "")
    {
        // Log the object
        AI.Log($"{prefix}- {obj.name} [{obj.tag}]");
        
        // Log components
        var components = obj.GetComponents<Component>();
        foreach (var component in components)
        {
            AI.Log($"{prefix}  - Component: {component.GetType().Name}");
        }
        
        // Log children
        foreach (Transform child in obj.transform)
        {
            LogObjectHierarchy(child.gameObject, prefix + "  ");
        }
    }
    
    public static void LogSceneHierarchy()
    {
        AI.Log("Scene Hierarchy:");
        
        // Get all root objects
        var rootObjects = UnityEngine.SceneManagement.SceneManager.GetActiveScene().GetRootGameObjects();
        
        // Log each root object and its hierarchy
        foreach (var rootObject in rootObjects)
        {
            LogObjectHierarchy(rootObject);
        }
    }
    
    public static void LogPerformanceStats()
    {
        AI.Result("performance_stats").Write(new
        {
            fps = 1.0f / Time.deltaTime,
            deltaTime = Time.deltaTime,
            frameCount = Time.frameCount,
            memoryUsage = System.GC.GetTotalMemory(false) / (1024 * 1024) // MB
        });
    }
}
```

## Conclusion

These examples demonstrate the versatility and power of Unity-MCP for both AI assistants interacting with Unity and Unity developers using the SDK. By combining direct code execution, query syntax, asynchronous operations, and a clean SDK API, Unity-MCP offers a comprehensive solution for AI-assisted game development.
