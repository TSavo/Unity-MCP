# Hot Reloading in Unity-MCP

This document provides comprehensive information about hot reloading in the Unity-MCP development environment, including how it works, how to use it effectively, and how to troubleshoot common issues.

## Overview

Hot reloading is a development technique that allows you to make changes to your code and see the results immediately, without having to manually restart the application. The Unity-MCP development environment supports hot reloading for both TypeScript and C# code, making development round trips as painless as possible.

### Why Hot Reloading Matters

Hot reloading dramatically improves development efficiency by:

1. **Eliminating manual restarts**: No need to stop and restart services after code changes
2. **Reducing feedback time**: See the results of your changes within seconds
3. **Maintaining application state**: The application state is preserved during reloads
4. **Enabling rapid iteration**: Make small changes and test them immediately
5. **Improving developer experience**: Less context switching and waiting

### When to Use Hot Reloading

Hot reloading is ideal for:

- Making small, incremental changes to code
- Fixing bugs and testing solutions
- Tweaking UI components and behavior
- Experimenting with different implementations
- Developing new features iteratively

## How Hot Reloading Works

### TypeScript Hot Reloading (MCP Server)

When you make changes to TypeScript files:

1. **File Change Detection**: The file watcher (chokidar) detects changes to `.ts` files in the `src` directory using polling (essential for reliable detection in Docker on Windows)
2. **Compilation**: The TypeScript compiler (`tsc --watch`) automatically compiles the changed files to JavaScript in the `dist` directory
3. **Change Detection**: Nodemon in the MCP server container detects changes to `.js` files in the `dist` directory (also using polling)
4. **Server Restart**: Nodemon automatically restarts the Node.js process with the new code
5. **Verification**: The MCP server logs show the restart and any new log messages you've added

**Detailed Flow**:
```
Edit TypeScript file → File watcher detects change → TypeScript compiler compiles to JavaScript →
Nodemon detects JavaScript change → Node.js process restarts → MCP server runs with new code
```

### C# Hot Reloading (Unity Client)

When you make changes to C# files:

1. **File Change Detection**: The file watcher detects changes to `.cs` files in the `unity-client` directory using polling
2. **Container Notification**: The development runner notifies the Unity client container of the change
3. **Compilation**: `dotnet watch` inside the container rebuilds the C# code
4. **Service Restart**: The ASP.NET Core service automatically restarts with the new code
5. **Verification**: The Unity client logs show the restart and any new behavior from your changes

**Detailed Flow**:
```
Edit C# file → File watcher detects change → dotnet watch rebuilds code →
ASP.NET Core service restarts → Unity client runs with new code
```

### Configuration Changes

You can also make changes to configuration files, which are hot reloaded as follows:

1. **TypeScript Configuration** (tsconfig.json): Changes trigger the TypeScript compiler to use the new configuration for subsequent compilations
2. **MCP Server Configuration** (package.json, .env): Changes are applied when the MCP server restarts
3. **Unity Client Configuration** (appsettings.json): Changes are applied when the Unity client restarts
4. **Docker Configuration** (docker-compose.dev.yml): Changes require a manual restart of the containers with `docker-compose -f docker-compose.dev.yml up --build -d`

### Hot Reloading Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Development Environment                     │
│                                                                 │
│  ┌─────────────┐        ┌─────────────┐       ┌─────────────┐   │
│  │ File Watcher│        │TypeScript   │       │ Docker      │   │
│  │ (chokidar)  │───────▶│ Compiler    │──────▶│ Containers  │   │
│  └─────────────┘        └─────────────┘       └─────────────┘   │
│         │                                            │           │
│         │                                            │           │
│         ▼                                            ▼           │
│  ┌─────────────┐                             ┌─────────────┐    │
│  │ Development │                             │ Hot Reload  │    │
│  │ Runner      │────────────────────────────▶│ Triggers    │    │
│  └─────────────┘                             └─────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
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
  ignored: /(^|[\/\\])\../,
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

## Practical Examples

### TypeScript Hot Reloading Examples

#### Example 1: Adding Log Messages

One of the simplest ways to test hot reloading is to add or modify log messages:

```typescript
// src/mcp/server.ts
public start(): void {
  this.app.listen(this.port, () => {
    logger.info(`MCP Server running on port ${this.port}`);
    logger.info(`Development mode is ${process.env.NODE_ENV === 'development' ? 'enabled' : 'disabled'}`);
    logger.info(`Server started at ${new Date().toISOString()}`);
    logger.info(`Hot reloading is working correctly!`); // Add this line to test hot reloading
    logger.info(`Current timestamp: ${Date.now()}`); // Add another line with dynamic content
  });
}
```

**Verification**: When you save this file, watch the Docker logs:

```bash
docker logs mcp-server-dev --tail 20
```

You should see the new log messages appear after the server restarts automatically.

#### Example 2: Modifying API Behavior

You can also modify the behavior of API endpoints:

```typescript
// src/mcp/controllers/toolController.ts
export const executeTool = async (req: Request, res: Response): Promise<void> => {
  const toolRequest: MCPToolRequest = req.body;
  const tools = req.app.locals.mcpManifest.tools;

  // Add debug information
  logger.info(`Executing tool: ${toolRequest.tool_id} with arguments:`, toolRequest.arguments);

  // Rest of the function...
}
```

**Verification**: Execute a tool through the MCP STDIO client and check the logs to see your new debug information.

### C# Hot Reloading Examples

#### Example 1: Adding a New API Endpoint

Add a new endpoint to test the status of the service:

```csharp
// unity-client/Controllers/CodeExecutionController.cs
[HttpGet("status")]
[ProducesResponseType(typeof(StatusResponse), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status500InternalServerError)]
public IActionResult GetStatus()
{
    _logService.Log("Status endpoint called", LogSeverity.Info);

    var response = new StatusResponse
    {
        Status = "Running",
        Version = "1.0.0",
        Timestamp = DateTime.Now,
        Environment = _environment.EnvironmentName,
        Features = new[] { "Code Execution", "Hot Reloading" }
    };

    return Ok(response);
}

// Add this class at the end of the file or in a separate Models folder
public class StatusResponse
{
    public string Status { get; set; }
    public string Version { get; set; }
    public DateTime Timestamp { get; set; }
    public string Environment { get; set; }
    public string[] Features { get; set; }
}
```

**Verification**: Test the new endpoint with curl:

```bash
# From the host machine
curl http://localhost:8081/api/CodeExecution/status

# From the MCP server container
docker exec mcp-server-dev curl -s http://unity-client-dev:8081/api/CodeExecution/status
```

#### Example 2: Modifying Mock Responses

Modify the mock implementation to return more detailed information:

```csharp
// unity-client/Services/MockCodeExecutionService.cs
private object MockEvaluateCode(string code)
{
    // Extract return statement if present
    var returnMatch = System.Text.RegularExpressions.Regex.Match(code, @"return\s+(.*?);");
    if (returnMatch.Success)
    {
        code = returnMatch.Groups[1].Value;
    }

    // Handle some common Unity patterns with mock responses
    if (code.Contains("GameObject.Find"))
    {
        return new { name = "MockGameObject", transform = new { position = new { x = 0, y = 0, z = 0 } } };
    }

    // For other code, return a mock object with enhanced information
    return new {
        mockResult = true,
        code,
        timestamp = DateTime.Now.ToString(),
        environment = System.Environment.MachineName,
        message = "This response was generated by the mock service with hot reloading!"
    };
}
```

**Verification**: Execute code through the Unity AI Bridge and observe the enhanced mock response:

```bash
echo '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"execute_code","arguments":{"code":"return UnityEngine.Application.productName;","timeout":5000}}}' | node dist/mcp-stdio-client/index.js
```

Or use the Unity AI Bridge directly if available.

### Configuration Changes Examples

#### Example 1: Updating Kestrel Configuration

Update the Kestrel configuration to listen on all interfaces:

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

**Verification**: Check the Unity client logs to see the configuration change being applied:

```bash
docker logs unity-client-dev --tail 20
```

Then test connectivity from the MCP server container:

```bash
docker exec mcp-server-dev curl -s http://unity-client-dev:8081/api/CodeExecution/status
```

#### Example 2: Adding CORS Configuration

Add CORS configuration to allow cross-origin requests:

```json
// unity-client/appsettings.json
"Cors": {
  "AllowedOrigins": ["http://localhost:8080"],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "AllowedHeaders": ["Content-Type", "Authorization"]
}
```

Then update the C# code to use this configuration:

```csharp
// unity-client/Program.cs - in the ConfigureServices method
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>())
              .WithMethods(builder.Configuration.GetSection("Cors:AllowedMethods").Get<string[]>())
              .WithHeaders(builder.Configuration.GetSection("Cors:AllowedHeaders").Get<string[]>());
    });
});

// In the Configure method
app.UseCors();
```

**Verification**: Both files will be hot reloaded. Check the logs to see the changes being applied, then test a cross-origin request.

## Troubleshooting

### Comprehensive Troubleshooting Guide

#### Diagnosing Hot Reloading Issues

If hot reloading isn't working as expected, follow this systematic approach:

1. **Verify File Change Detection**
   - Make a simple change (add a comment or log message)
   - Check if the file watcher detects the change:
     ```bash
     # Check development runner logs
     docker logs mcp-server-dev | grep "file changed"
     ```
   - If changes aren't detected, focus on file watching configuration

2. **Verify Compilation**
   - Check if TypeScript files are being compiled:
     ```bash
     # Look for TypeScript compilation messages
     docker logs mcp-server-dev | grep "Starting compilation"
     ```
   - For C# files, check if dotnet watch is rebuilding:
     ```bash
     docker logs unity-client-dev | grep "Building"
     ```

3. **Verify Service Restart**
   - Check if services are restarting after changes:
     ```bash
     # For MCP server
     docker logs mcp-server-dev | grep "restarting due to changes"

     # For Unity client
     docker logs unity-client-dev | grep "Application is shutting down"
     ```

4. **Verify Changes Applied**
   - Add a distinctive log message or behavior change
   - Check if it appears in the logs or affects behavior

#### Common Issues and Solutions

##### 1. File Changes Not Detected

**Symptoms**:
- You make changes to files but nothing happens
- No compilation or restart messages in logs

**Solutions**:

- **Enable Polling for File Watching**:
  ```bash
  # Check if polling is enabled for nodemon
  docker exec mcp-server-dev cat /app/nodemon.json | grep poll

  # Check if polling is enabled for dotnet watch
  docker exec unity-client-dev env | grep DOTNET_USE_POLLING_FILE_WATCHER
  ```

- **Verify Volume Mounts**:
  ```bash
  # Check if source files are properly mounted
  docker exec mcp-server-dev ls -la /app/src
  docker exec unity-client-dev ls -la /app
  ```

- **Try a Different Editor**: Some editors use temporary files or have special save behaviors that can confuse file watchers

- **Force a Change**: Make a more significant change or touch the file:
  ```bash
  # On Windows
  copy /b src\mcp\server.ts +,,

  # On Linux/macOS
  touch src/mcp/server.ts
  ```

##### 2. Compilation Errors

**Symptoms**:
- Changes detected but services don't restart
- Error messages in logs

**Solutions**:

- **Check Compilation Errors**:
  ```bash
  # For TypeScript
  docker logs mcp-server-dev | grep "error TS"

  # For C#
  docker logs unity-client-dev | grep "error CS"
  ```

- **Fix Syntax Errors**: Make sure your code changes are syntactically correct

- **Check Dependencies**: Ensure all required packages are installed

##### 3. Service Not Restarting

**Symptoms**:
- Compilation succeeds but service doesn't restart
- No restart messages in logs

**Solutions**:

- **Check Nodemon Configuration**:
  ```bash
  docker exec mcp-server-dev cat /app/nodemon.json
  ```
  Ensure it's watching the correct directories and file extensions

- **Check Docker Health**:
  ```bash
  docker stats mcp-server-dev unity-client-dev
  ```
  Look for high CPU or memory usage that might prevent restarts

- **Manual Restart**:
  ```bash
  docker-compose -f docker-compose.dev.yml restart mcp-server
  docker-compose -f docker-compose.dev.yml restart unity-client
  ```

##### 4. Changes Applied But Not Working

**Symptoms**:
- Service restarts but your changes don't seem to have any effect

**Solutions**:

- **Check if the Right Files are Being Modified**: Ensure you're editing the source files, not compiled output

- **Clear Browser Cache**: If testing UI changes, clear your browser cache

- **Check for Runtime Errors**:
  ```bash
  docker logs mcp-server-dev | grep "Error"
  docker logs unity-client-dev | grep "Exception"
  ```

- **Add Explicit Verification**: Add code that clearly demonstrates your change is working

##### 5. Docker-Specific Issues

**Symptoms**:
- Hot reloading works inconsistently or stops working after a while

**Solutions**:

- **Restart Docker**: Sometimes Docker's file system watcher can get into a bad state

- **Use Cached Volumes**: Ensure volumes are mounted with the `:cached` option in docker-compose.yml

- **Increase Polling Frequency**: Adjust polling intervals in nodemon.json and chokidar configuration

- **Check Docker Desktop Settings**: On Windows, ensure WSL 2 integration is properly configured

#### Networking Issues

##### 1. Unity Client Not Accessible

**Symptoms**:
- Cannot connect to Unity client from host or other containers

**Solutions**:

- **Check Kestrel Configuration**:
  ```bash
  docker exec unity-client-dev cat /app/appsettings.json
  ```
  Ensure it's configured to listen on `0.0.0.0` not just `localhost`:
  ```json
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:8081"
      }
    }
  }
  ```

- **Check Docker Network**:
  ```bash
  docker network inspect unity-mcp_default
  ```
  Ensure containers are on the same network

- **Check Listening Addresses**:
  ```bash
  docker exec unity-client-dev netstat -tulpn | grep 8081
  ```
  Should show listening on 0.0.0.0:8081

##### 2. MCP Server Not Connecting to Unity Client

**Symptoms**:
- MCP server logs show connection errors to Unity client

**Solutions**:

- **Check Environment Variables**:
  ```bash
  docker exec mcp-server-dev env | grep UNITY_HOST
  ```
  Should be set to `unity-client-dev`

- **Update Docker Compose**:
  Ensure the `UNITY_HOST` environment variable is set in docker-compose.dev.yml:
  ```yaml
  environment:
    - NODE_ENV=development
    - UNITY_HOST=unity-client-dev
  ```

- **Test Connectivity**:
  ```bash
  docker exec mcp-server-dev curl -v http://unity-client-dev:8081/health
  ```

#### Advanced Troubleshooting

##### 1. Debugging File Watching

To get detailed information about file watching:

```bash
# For nodemon, enable verbose logging
docker exec -it mcp-server-dev sh -c "echo '{\"verbose\":true,\"watch\":[\"dist\"],\"ext\":\"js,json\",\"ignore\":[\"node_modules\",\"logs\"],\"delay\":\"500\",\"execMap\":{\"js\":\"node\"},\"legacyWatch\":true,\"poll\":1000}' > /app/nodemon.json"

# Restart the container
docker-compose -f docker-compose.dev.yml restart mcp-server
```

##### 2. Debugging TypeScript Compilation

To see detailed TypeScript compilation information:

```bash
# Run tsc with verbose output
docker exec -it mcp-server-dev npx tsc --listFiles
```

##### 3. Debugging Docker Volumes

To verify file synchronization between host and containers:

```bash
# Create a test file on host
echo "test file $(date)" > src/test-sync.txt

# Check if it appears in container
docker exec mcp-server-dev cat /app/src/test-sync.txt
```

##### 4. Last Resort: Clean Rebuild

If all else fails, try a complete rebuild:

```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down

# Remove volumes (optional, will lose data)
docker-compose -f docker-compose.dev.yml down -v

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build -d
```

## Best Practices for Efficient Hot Reloading

### Development Workflow

1. **Start with the Development Runner**
   ```bash
   # On Windows
   .\run-dev.ps1

   # On Linux/macOS
   ./run-dev.sh
   ```
   This single command sets up the entire development environment with hot reloading enabled.

2. **Use a Multi-Window Setup**
   - Window 1: Code editor
   - Window 2: Development runner terminal (showing logs)
   - Window 3: Testing terminal (for curl commands, etc.)
   This setup allows you to see changes, logs, and test results simultaneously.

3. **Follow the Edit-Save-Verify Loop**
   - Make a small, focused change
   - Save the file
   - Watch the logs for compilation and restart
   - Verify the change works as expected
   - Repeat

### Code Organization

4. **Structure Code for Hot Reloading**
   - Keep modules small and focused
   - Use dependency injection for better reloading
   - Avoid global state that might be lost on reload
   - Use configuration files for values that might change frequently

5. **Add Strategic Log Points**
   ```typescript
   // Add version or timestamp information to easily verify reloading
   logger.info(`Service started, version ${VERSION}, build time: ${new Date().toISOString()}`);
   ```

6. **Use Feature Flags**
   ```typescript
   // Use environment variables or config files for feature flags
   if (process.env.ENABLE_NEW_FEATURE === 'true') {
     // New code path
   } else {
     // Old code path
   }
   ```
   This allows you to toggle features without code changes.

### Technical Considerations

7. **Use Polling for File Watching**
   - Essential for reliable detection in Docker on Windows
   - Configure appropriate polling intervals:
     ```json
     // nodemon.json
     {
       "poll": 1000,  // Poll every 1 second
       "legacyWatch": true
     }
     ```

8. **Use Cached Volumes**
   ```yaml
   # docker-compose.dev.yml
   volumes:
     - ./src:/app/src:cached
     - ./dist:/app/dist:cached
   ```
   This improves performance, especially on Windows.

9. **Optimize Docker Configuration**
   - Allocate sufficient resources to Docker
   - Use WSL 2 backend on Windows
   - Consider using Docker Compose profiles for complex setups

10. **Configure Networking Properly**
    - Make sure your services are configured to listen on the correct interfaces and ports
    - Set the `UNITY_HOST` environment variable correctly in docker-compose.dev.yml
    - Use container names for inter-container communication

### Testing Strategies

11. **Create Test Scripts**
    ```bash
    # Create a test.sh script for common test operations
    #!/bin/bash
    echo "Testing MCP server..."
    curl http://localhost:8080/help

    echo "\nTesting Unity client..."
    curl http://localhost:8081/api/CodeExecution/status

    echo "\nTesting Unity code execution..."
    echo '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"execute_code","arguments":{"code":"return System.Environment.MachineName;","timeout":5000}}}' | node dist/mcp-stdio-client/index.js
    ```

12. **Use Automated Tests**
    - Write unit tests that can be run quickly
    - Set up integration tests for critical paths
    - Consider using test-driven development (TDD)

13. **Test Edge Cases**
    - Test with different input values
    - Test error handling
    - Test performance under load

### Collaboration

14. **Document Changes**
    - Keep a changelog of your changes
    - Document any configuration changes
    - Share knowledge about hot reloading techniques

15. **Use Version Control Effectively**
    - Commit frequently
    - Use feature branches
    - Write clear commit messages

### Maintenance

16. **Regular Cleanup**
    - Remove unused code and dependencies
    - Clean up Docker volumes and images
    - Restart Docker periodically

17. **Monitor Resource Usage**
    ```bash
    # Check Docker resource usage
    docker stats
    ```

18. **Update Dependencies**
    - Keep dependencies up to date
    - Test updates in isolation
    - Document dependency changes
