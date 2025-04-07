# Web Server with Persistence

## Overview

The Web Server is a long-running service that maintains persistent state across sessions, stores logs and results, and manages communication between the MCP STDIO Client and Unity. It serves as the central hub of the Unity-MCP architecture.

## Purpose

The Web Server fulfills several critical roles in the Unity-MCP architecture:

1. **Persistence**: Stores logs, results, and other data across sessions.
2. **API Gateway**: Provides HTTP endpoints for the MCP STDIO Client.
3. **WebSocket Server**: Manages WebSocket connections with Unity.
4. **Coordination**: Coordinates communication between the MCP STDIO Client and Unity.
5. **Asynchronous Execution**: Handles long-running operations that exceed the timeout.

## Implementation

The Web Server is implemented as an Express.js application that exposes HTTP endpoints for the MCP STDIO Client and WebSocket connections for Unity.

### Key Components

1. **Express Server**: Handles HTTP requests and responses.
2. **WebSocket Server**: Manages real-time communication with Unity.
3. **Database**: Stores logs, results, and other data.
4. **API Routes**: Defines the API endpoints for the MCP STDIO Client.
5. **WebSocket Handlers**: Processes messages from Unity.

## Code Example

```typescript
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { Database } from './database';
import { v4 as uuidv4 } from 'uuid';

// Create Express app
const app = express();
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Create database
const db = new Database();

// Map to store active Unity connections
const unityConnections = new Map();

// API endpoints for MCP STDIO Client
app.post('/api/execute', async (req, res) => {
  const { code, timeout = 1000 } = req.body;
  
  // Generate a unique log ID
  const logId = uuidv4();
  
  // Store the request in the database
  db.storeRequest(logId, { code, timeout, timestamp: Date.now() });
  
  // Check if Unity is connected
  if (unityConnections.size === 0) {
    return res.status(503).json({
      success: false,
      error: 'Unity is not connected',
      logId
    });
  }
  
  // Get the first Unity connection
  const ws = unityConnections.values().next().value;
  
  // Create a promise that will be resolved when Unity responds
  const responsePromise = new Promise((resolve, reject) => {
    // Store the resolve and reject functions
    db.storePromise(logId, { resolve, reject });
    
    // Set a timeout
    setTimeout(() => {
      // If the promise is still pending, resolve it with a timeout message
      if (db.isPromisePending(logId)) {
        resolve({
          success: true,
          result: null,
          logId,
          complete: false,
          message: 'Operation is still running. Use get_result to check for completion.'
        });
      }
    }, timeout);
  });
  
  // Send the request to Unity
  ws.send(JSON.stringify({
    type: 'execute',
    logId,
    code
  }));
  
  // Wait for the response or timeout
  const response = await responsePromise;
  
  // Return the response
  res.json(response);
});

app.get('/api/result/:logId', async (req, res) => {
  const { logId } = req.params;
  
  // Get the result from the database
  const result = db.getResult(logId);
  
  if (!result) {
    return res.status(404).json({
      success: false,
      error: 'Result not found'
    });
  }
  
  res.json(result);
});

// More API endpoints...

// WebSocket connections for Unity
wss.on('connection', (ws) => {
  // Generate a unique ID for this connection
  const connectionId = uuidv4();
  
  console.log(`Unity connected: ${connectionId}`);
  
  // Store the connection
  unityConnections.set(connectionId, ws);
  
  // Handle messages from Unity
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'result') {
        const { logId, result, success, error } = data;
        
        // Store the result in the database
        db.storeResult(logId, { result, success, error, timestamp: Date.now() });
        
        // Resolve the promise if it exists
        const promise = db.getPromise(logId);
        if (promise) {
          promise.resolve({
            success,
            result,
            error,
            logId,
            complete: true
          });
          
          // Remove the promise
          db.removePromise(logId);
        }
      }
      
      // Handle other message types...
    } catch (error) {
      console.error('Error processing message from Unity:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log(`Unity disconnected: ${connectionId}`);
    
    // Remove the connection
    unityConnections.delete(connectionId);
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Web Server running on port ${PORT}`);
});
```

## API Endpoints

The Web Server exposes the following HTTP endpoints for the MCP STDIO Client:

### Code Execution

- **POST /api/execute**
  - Description: Executes C# code in Unity.
  - Request Body:
    - `code` (string, required): C# code to execute.
    - `timeout` (number, optional): Timeout in milliseconds (default: 1000).
  - Response:
    - `success` (boolean): Whether the operation was successful.
    - `result` (any): The result of the code execution (if completed within timeout).
    - `logId` (string): The unique ID for this operation.
    - `complete` (boolean): Whether the operation is complete.
    - `message` (string): A message describing the status of the operation.

### Query Execution

- **POST /api/query**
  - Description: Executes a query in Unity.
  - Request Body:
    - `query` (string, required): Query using dot notation.
    - `timeout` (number, optional): Timeout in milliseconds (default: 1000).
  - Response: Same as `/api/execute`.

### Result Retrieval

- **GET /api/result/:logId**
  - Description: Retrieves the result of a previously executed operation.
  - URL Parameters:
    - `logId` (string, required): The unique ID of the operation.
  - Response:
    - `success` (boolean): Whether the operation was successful.
    - `result` (any): The result of the operation.
    - `error` (string, optional): Error message if the operation failed.
    - `timestamp` (number): The timestamp when the result was stored.
    - `complete` (boolean): Whether the operation is complete.

### Log Retrieval

- **GET /api/logs**
  - Description: Retrieves logs from Unity.
  - Query Parameters:
    - `count` (number, optional): Number of logs to retrieve (default: 10).
    - `offset` (number, optional): Offset for pagination (default: 0).
  - Response:
    - `logs` (array): Array of log entries.
    - `total` (number): Total number of logs.

### Log Details

- **GET /api/log/:logId**
  - Description: Retrieves detailed information about a specific log entry.
  - URL Parameters:
    - `logId` (string, required): The unique ID of the log entry.
  - Response:
    - `log` (object): Detailed information about the log entry.

## WebSocket Protocol

The Web Server communicates with Unity using a WebSocket protocol:

### Messages from Web Server to Unity

- **Execute Code**
  ```json
  {
    "type": "execute",
    "logId": "550e8400-e29b-41d4-a716-446655440000",
    "code": "return GameObject.Find(\"Player\").transform.position;"
  }
  ```

- **Execute Query**
  ```json
  {
    "type": "query",
    "logId": "550e8400-e29b-41d4-a716-446655440000",
    "query": "GameObject.Find(\"Player\").transform.position"
  }
  ```

### Messages from Unity to Web Server

- **Result**
  ```json
  {
    "type": "result",
    "logId": "550e8400-e29b-41d4-a716-446655440000",
    "success": true,
    "result": {
      "x": 0,
      "y": 1,
      "z": 0
    }
  }
  ```

- **Log**
  ```json
  {
    "type": "log",
    "logId": "550e8400-e29b-41d4-a716-446655440000",
    "level": "info",
    "message": "Player reached checkpoint",
    "timestamp": 1625097600000
  }
  ```

## Persistence

The Web Server uses a database to store logs, results, and other data. This allows AI assistants to retrieve results later, even if the operation takes longer than the timeout.

### Database Schema

- **Requests**: Stores information about code execution requests.
  - `logId` (string): The unique ID of the request.
  - `code` (string): The code to execute.
  - `timeout` (number): The timeout in milliseconds.
  - `timestamp` (number): The timestamp when the request was made.

- **Results**: Stores the results of code execution.
  - `logId` (string): The unique ID of the result.
  - `result` (any): The result of the code execution.
  - `success` (boolean): Whether the operation was successful.
  - `error` (string, optional): Error message if the operation failed.
  - `timestamp` (number): The timestamp when the result was stored.
  - `complete` (boolean): Whether the operation is complete.

- **Logs**: Stores log entries from Unity.
  - `logId` (string): The unique ID of the log entry.
  - `level` (string): The log level (info, warning, error).
  - `message` (string): The log message.
  - `timestamp` (number): The timestamp when the log was created.

## Error Handling

The Web Server implements comprehensive error handling:

1. **Unity Connection Errors**: Handles errors when Unity is not connected.
2. **Timeout Errors**: Handles timeouts when waiting for responses from Unity.
3. **Database Errors**: Handles errors when interacting with the database.
4. **WebSocket Errors**: Handles errors in WebSocket communication.

## Deployment

The Web Server can be deployed in various ways:

1. **Node.js Process**: Run as a Node.js process on a server.
2. **Docker Container**: Run in a Docker container.
3. **Cloud Service**: Deploy to a cloud service like AWS, Azure, or Google Cloud.

## Conclusion

The Web Server is a critical component of the Unity-MCP architecture, serving as the central hub that coordinates communication between the MCP STDIO Client and Unity. Its persistence layer ensures that results are available even for long-running operations, and its WebSocket server enables real-time communication with Unity.
