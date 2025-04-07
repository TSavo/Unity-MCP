# Development Mode for Unity-MCP

This document explains how to use the development mode for the Unity-MCP integration, which supports incremental builds and live code updates.

## Overview

The development mode uses Docker containers with volume mounts to enable live code updates without rebuilding the containers. It also uses tools like `nodemon` and `dotnet watch` to automatically detect changes and restart the services.

We provide a TypeScript development runner that manages the entire development cycle, watching for changes in both TypeScript and C# code, triggering compilation when needed, and restarting the appropriate services.

## Components

The development setup consists of two containers:

1. **MCP Server (TypeScript)**: Runs on port 8080 and uses `nodemon` to automatically restart when the compiled JavaScript files change.
2. **Unity Client (C#)**: Runs on port 8081 and uses `dotnet watch` to automatically rebuild and restart when the C# files change.

Note: The MCP STDIO client is not included in Docker Compose because Claude needs to run it directly, not through Docker.

## Starting Development Mode

### Using the Development Runner (Recommended)

The development runner is a TypeScript script that manages the entire development cycle, watching for changes in both TypeScript and C# code, triggering compilation when needed, and restarting the appropriate services.

On Linux/macOS:
```bash
chmod +x run-dev.sh
./run-dev.sh
```

On Windows:
```powershell
.\run-dev.ps1
```

This will:
1. Install dependencies if needed
2. Start the TypeScript compiler in watch mode
3. Build and start the development containers
4. Watch for changes in TypeScript and C# code
5. Automatically restart the appropriate services when changes are detected
6. Show the logs from the containers

### Using the Docker Compose Script

If you prefer to manage the development cycle manually, you can use the Docker Compose script:

On Linux/macOS:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

On Windows:
```powershell
.\start-dev.ps1
```

This will:
1. Stop any running development containers
2. Build and start the development containers
3. Start the TypeScript compiler in watch mode in a new terminal
4. Show the logs from the containers

### Manual Setup

If you prefer to have full control over the development cycle, you can set up the development environment manually:

1. Start the TypeScript compiler in watch mode:
```bash
npx tsc --watch
```

2. In a separate terminal, start the development containers:
```bash
docker-compose -f docker-compose.dev.yml up --build -d
```

3. View the logs:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

## Development Workflow

### With the Development Runner

When using the development runner, the workflow is simple:

1. **Start the Development Runner**: Run `./run-dev.sh` or `./run-dev.ps1`

2. **Edit Code**: Make changes to TypeScript or C# code

3. **Watch for Automatic Updates**: The development runner will:
   - Detect changes in TypeScript files and compile them
   - Detect changes in compiled JavaScript files and restart the MCP Server
   - Detect changes in C# files and trigger the Unity Client to rebuild and restart

4. **Test Changes**: You can test your changes by sending requests directly to the MCP STDIO client:

```bash
echo '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{"protocolVersion":"0.1.0","clientInfo":{"name":"test-client","version":"1.0.0"},"capabilities":{}}}' | node dist/mcp-stdio-client/index.js
```

This is how Claude will interact with the MCP STDIO client.

For more information about the MCP STDIO client, including logging to fully qualified paths, see [MCP STDIO Client](./mcp-stdio-client.md).

### Manual Workflow

If you're not using the development runner, the workflow is:

1. **Edit TypeScript Code**: When you edit TypeScript files in the `src` directory, the TypeScript compiler will automatically compile them to JavaScript in the `dist` directory. The MCP Server container will detect the changes in the `dist` directory and restart automatically.

2. **Edit C# Code**: When you edit C# files in the `unity-client` directory, the Unity Client container will automatically detect the changes, rebuild the code, and restart the service.

3. **Test Changes**: Same as above - send requests directly to the MCP STDIO client.

## Hot Reloading

The development environment supports hot reloading for both TypeScript and C# code, making development round trips as painless as possible.

### TypeScript Hot Reloading

When you make changes to TypeScript files:

1. The TypeScript compiler detects the change and compiles the code to JavaScript
2. The development runner detects the change in the compiled JavaScript file
3. Nodemon in the MCP server container detects the change in the `dist` directory
4. Nodemon restarts the Node.js process with the new code
5. The MCP server restarts with the new code

Example:
```typescript
// src/mcp/server.ts
public start(): void {
  this.app.listen(this.port, () => {
    logger.info(`MCP Server running on port ${this.port}`);
    logger.info(`Development mode is ${process.env.NODE_ENV === 'development' ? 'enabled' : 'disabled'}`);
    logger.info(`Server started at ${new Date().toISOString()}`);
    logger.info(`Hot reloading is working correctly!`); // Add this line to test hot reloading
  });
}
```

### C# Hot Reloading

When you make changes to C# files:

1. The development runner detects the change in the C# file
2. The Unity client container detects the change
3. `dotnet watch` rebuilds the code and restarts the service
4. The Unity client restarts with the new code

Example:
```csharp
// unity-client/Controllers/CodeExecutionController.cs
[HttpGet("status")]
[ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status500InternalServerError)]
public IActionResult GetStatus()
{
    _logService.Log("Status endpoint called", LogSeverity.Info);

    return Ok("Code execution service is running with hot reload enabled!");
}
```

### Configuration Changes

You can also make changes to configuration files like `appsettings.json`:

```json
// unity-client/appsettings.json
"Kestrel": {
  "Endpoints": {
    "Http": {
      "Url": "http://0.0.0.0:8081"  // Change from localhost to 0.0.0.0 to listen on all interfaces
    }
  }
}
```

## Docker Volume Configuration

The development environment uses Docker volumes to enable live code updates. The volumes are configured with the `:cached` option to improve performance on Windows and macOS:

```yaml
# docker-compose.dev.yml
volumes:
  - ./src:/app/src:cached
  - ./dist:/app/dist:cached
  - ./package.json:/app/package.json:cached
  - ./package-lock.json:/app/package-lock.json:cached
  - ./tsconfig.json:/app/tsconfig.json:cached
```

### File Watching Configuration

To ensure reliable file watching across Docker volumes, especially on Windows, the development environment uses polling-based file watching:

1. **Nodemon Configuration**:
```json
// nodemon.json
{
  "verbose": true,
  "watch": ["dist"],
  "ext": "js,json",
  "ignore": ["node_modules", "logs"],
  "delay": "500",
  "execMap": {
    "js": "node"
  },
  "legacyWatch": true,
  "poll": 1000
}
```

2. **Development Runner Configuration**:
```typescript
// src/dev/runner.ts
const watcher = chokidar.watch(`${config.tsSourceDir}/**/*.ts`, {
  ignored: /(^|[\/\\])\.\./,
  persistent: true,
  usePolling: true,        // Use polling for more reliable detection on Windows/Docker
  interval: 1000,          // Poll every 1 second
  awaitWriteFinish: true,  // Wait for writes to finish
});
```

3. **Unity Client Configuration**:
```yaml
# docker-compose.dev.yml
environment:
  - DOTNET_USE_POLLING_FILE_WATCHER=true
```

## Testing Your Changes

### Testing MCP Server Changes

You can test changes to the MCP server by sending requests to it through the MCP STDIO client:

```bash
echo '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{"protocolVersion":"0.1.0","clientInfo":{"name":"test-client","version":"1.0.0"},"capabilities":{}}}' | node dist/mcp-stdio-client/index.js
```

### Testing Unity Client Changes

You can test changes to the Unity client by sending HTTP requests to it:

```bash
# From the host machine
curl http://localhost:8081/api/CodeExecution/status

# From the MCP server container
docker exec mcp-server-dev curl -s http://unity-client-dev:8081/api/CodeExecution/status
```

## Stopping Development Mode

### When Using the Development Runner

If you're using the development runner, simply press `Ctrl+C` in the terminal where the runner is running. The runner will gracefully shut down all containers and processes.

### Manual Shutdown

To stop the development containers manually:
```bash
docker-compose -f docker-compose.dev.yml down
```

If you started the TypeScript compiler in a separate terminal, press `Ctrl+C` in that terminal to stop it.

## Troubleshooting

### Hot Reloading Issues

If hot reloading is not working correctly, try the following:

1. **Check File Watching Configuration**:
   - Make sure nodemon is configured to use polling:
     ```bash
     docker exec mcp-server-dev cat /app/nodemon.json
     ```
   - Make sure the Unity client is configured to use polling:
     ```bash
     docker exec unity-client-dev env | grep DOTNET_USE_POLLING_FILE_WATCHER
     ```

2. **Check Volume Mounts**:
   - Make sure the volumes are mounted correctly:
     ```bash
     docker exec mcp-server-dev ls -la /app
     docker exec unity-client-dev ls -la /app
     ```

3. **Restart Containers**:
   - Restart the containers to apply changes to configuration files:
     ```bash
     docker-compose -f docker-compose.dev.yml restart
     ```

4. **Check Logs**:
   - Check the logs for any errors:
     ```bash
     docker logs mcp-server-dev
     docker logs unity-client-dev
     ```

### Unity Client Networking Issues

If you're having trouble connecting to the Unity client from outside the container, make sure it's configured to listen on all interfaces:

1. **Check Kestrel Configuration**:
   - Make sure the Unity client is configured to listen on 0.0.0.0:
     ```bash
     docker exec unity-client-dev cat /app/appsettings.json
     ```
   - The Kestrel configuration should include:
     ```json
     "Kestrel": {
       "Endpoints": {
         "Http": {
           "Url": "http://0.0.0.0:8081"
         }
       }
     }
     ```

2. **Check Listening Addresses**:
   - Check which addresses the Unity client is listening on:
     ```bash
     docker exec unity-client-dev netstat -tulpn | grep 8081
     ```

### Development Runner Issues

If the development runner is not working correctly, try the following:

1. Check if the required dependencies are installed:
```bash
npm install
```

2. Check if the TypeScript code compiles correctly:
```bash
npm run build
```

3. Restart the development runner:
```bash
./run-dev.sh  # or ./run-dev.ps1 on Windows
```

### TypeScript Compilation Errors

If you see TypeScript compilation errors in the TypeScript compiler terminal, fix the errors and save the files. The TypeScript compiler will automatically recompile the files.

### Container Restart Issues

If the containers are not restarting automatically when you make changes, try the following:

1. Check the logs to see if there are any errors:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

2. Restart the containers manually:
```bash
docker-compose -f docker-compose.dev.yml restart
```

3. Rebuild the containers:
```bash
docker-compose -f docker-compose.dev.yml up --build -d
```

### Volume Mount Issues

If the volume mounts are not working correctly, try the following:

1. Check if the volumes are mounted correctly:
```bash
docker-compose -f docker-compose.dev.yml exec mcp-server ls -la /app
```

2. Restart Docker:
```bash
docker-compose -f docker-compose.dev.yml down
docker restart
docker-compose -f docker-compose.dev.yml up --build -d
```

### Unity Client Hot Reload Issues

If the Unity client is not automatically reloading when you make changes to C# code, try the following:

1. Check the Unity client logs:
```bash
docker-compose -f docker-compose.dev.yml logs unity-client
```

2. Restart the Unity client container:
```bash
docker-compose -f docker-compose.dev.yml restart unity-client
```

3. Make sure the file watcher is working correctly by checking if the `DOTNET_USE_POLLING_FILE_WATCHER` environment variable is set to `true` in the Unity client container:
```bash
docker-compose -f docker-compose.dev.yml exec unity-client env | grep DOTNET_USE_POLLING_FILE_WATCHER
```

## Best Practices

1. **Use TypeScript Features**: Take advantage of TypeScript's type checking to catch errors early.

2. **Write Tests**: Write tests for your code and run them frequently to ensure that your changes don't break existing functionality.

3. **Use Git**: Commit your changes frequently to Git to keep track of your progress and make it easier to revert changes if necessary.

4. **Monitor Logs**: Keep an eye on the logs to see if there are any errors or warnings.

5. **Restart Containers**: If you make significant changes to the code, it's a good idea to restart the containers to ensure that all changes are applied correctly.

6. **Use Hot Reloading**: Take advantage of hot reloading to speed up development. Make small changes and test them immediately.

7. **Configure Networking Properly**: Make sure your services are configured to listen on the correct interfaces and ports.

8. **Use Polling for File Watching**: When working with Docker volumes, especially on Windows, use polling-based file watching for reliable change detection.
