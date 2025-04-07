# Unity MCP Client

This is the Unity-side client for the Unity-MCP project. It provides a web API for executing C# code and communicating with the MCP server.

## Features

- Execute C# code
- Get environment information
- Log messages
- Mock implementation for testing without Unity

## Getting Started

### Prerequisites

- .NET 9.0 SDK
- Unity 2022.3.16f1 or later (for Unity integration)

### Running the Server

```bash
dotnet run
```

The server will start on http://localhost:8081 by default. You can access the Swagger UI at http://localhost:8081/swagger.

## API Endpoints

### Execute Code

```
POST /api/CodeExecution/execute
```

Request body:
```json
{
  "code": "return new { message = \"Hello, World!\" };",
  "timeout": 1000
}
```

Response:
```json
{
  "success": true,
  "result": {
    "message": "Hello, World!"
  },
  "logs": [
    "[MOCK] Code executed successfully"
  ],
  "executionTime": 42
}
```

### Get Environment Info

```
GET /api/CodeExecution/info
```

Response:
```json
{
  "unityVersion": "2022.3.16f1",
  "platform": "Windows",
  "isEditor": true,
  "sceneObjects": [
    "Main Camera",
    "Directional Light",
    "Player"
  ]
}
```

### Ping

```
GET /ping
```

Response:
```
"pong"
```

## Unity Integration

This server is designed to be integrated with Unity. The current implementation uses a mock code execution service, but in a real deployment, it would execute code in Unity.

To integrate with Unity:

1. Create a Unity project
2. Add this server as a package
3. Implement the `ICodeExecutionService` interface to execute code in Unity
4. Replace the mock service with the real implementation

## Architecture

The server is built using ASP.NET Core and follows a clean architecture:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Models**: Define data structures
- **Middleware**: Handle cross-cutting concerns

## License

This project is licensed under the MIT License - see the LICENSE file for details.
