# Unity-MCP Architecture Clarification

## Core Architecture Principles

The Unity-MCP project is designed around a few key architectural principles that are important to understand:

1. **Direct Code Execution**: The system allows AI assistants to execute arbitrary C# code directly in Unity. This is a fundamental design choice that provides maximum flexibility.

2. **Asynchronous Communication**: All operations have a default timeout of 1 second, after which they return a Log GUID. Unity can continue to update this Log GUID with results as they become available.

3. **Bidirectional Communication**: The system supports both AI-to-Unity communication (executing code) and Unity-to-AI communication (logging results and events).

4. **Persistence Layer**: Operation results are persisted, allowing AI assistants to retrieve them later, even if the operation takes longer than the timeout.

## System Components

### 1. TypeScript Server (MCP Server)

The TypeScript server is responsible for:

- Receiving requests from AI assistants
- Forwarding code execution requests to Unity
- Managing the asynchronous execution system
- Storing operation results in the persistence layer
- Providing endpoints for Unity to update operation results
- Returning results to AI assistants

### 2. Unity Component

The Unity component is responsible for:

- Receiving code execution requests from the TypeScript server
- Executing the code in Unity's context
- Returning results to the TypeScript server
- Providing a simple API for Unity developers to log information for AI assistants

## Communication Flow

### AI Assistant to Unity

1. AI assistant sends a request to the TypeScript server
2. TypeScript server generates a Log GUID
3. TypeScript server forwards the request to Unity
4. Unity executes the code
5. If execution completes within the timeout (default: 1 second):
   - Unity returns the result to the TypeScript server
   - TypeScript server returns the result and Log GUID to the AI assistant
6. If execution exceeds the timeout:
   - TypeScript server returns only the Log GUID to the AI assistant
   - Unity continues executing the code
   - When execution completes, Unity sends the result to the TypeScript server
   - TypeScript server stores the result with the Log GUID
   - AI assistant can retrieve the result later using the Log GUID

### Unity to AI Assistant

1. Unity developer calls a simple API like `AI.Log("Player reached checkpoint")`
2. Unity sends this information to the TypeScript server
3. TypeScript server stores the information with a Log GUID
4. AI assistant can retrieve this information using the Log GUID

## Key Clarifications

### 1. Direct Code Execution

The system allows executing arbitrary C# code directly in Unity. There is no "translation" or "parsing" layer - the code is sent as a string and executed as-is in Unity.

```csharp
// This code is sent directly to Unity and executed
GameObject.Find("Player").transform.position.x = 10;
```

### 2. Query Language vs. Direct Code

The "Query Language" mentioned in the documentation is not a separate language or parser. It's simply a convention for how AI assistants should format their C# code to access Unity objects. The code is still executed directly in Unity.

### 3. Asynchronous Execution

All operations have a default timeout of 1 second. If an operation takes longer, it continues running in the background, and the AI assistant can retrieve the result later using the Log GUID.

### 4. Unity-to-AI Communication

Unity developers can send information to AI assistants by calling simple methods like `AI.Log()`. This information is stored with a Log GUID and can be retrieved by AI assistants.

## Implementation Details

### TypeScript Server

The TypeScript server is implemented as a Node.js application that:

1. Exposes HTTP endpoints for AI assistants to send requests
2. Manages the asynchronous execution system
3. Stores operation results in a persistence layer (NeDB)
4. Provides endpoints for Unity to update operation results

### Unity Component

The Unity component is implemented as a MonoBehaviour that:

1. Starts a web server to receive requests from the TypeScript server
2. Executes code in Unity's context
3. Returns results to the TypeScript server
4. Provides a simple API for Unity developers to log information

## Conclusion

The Unity-MCP architecture is designed to be simple and flexible, allowing AI assistants to execute arbitrary C# code in Unity and receive results asynchronously. The system also provides a way for Unity developers to send information to AI assistants, creating a bidirectional communication channel.

The key to understanding the architecture is recognizing that there is no complex translation or parsing layer - the system simply forwards code from AI assistants to Unity and results from Unity back to AI assistants, with an asynchronous execution system to handle long-running operations.
