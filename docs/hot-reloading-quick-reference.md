# Hot Reloading Quick Reference Guide

This quick reference guide provides essential commands and tips for using hot reloading in the Unity-MCP development environment.

## Starting Development Environment

```bash
# On Windows
.\run-dev.ps1

# On Linux/macOS
./run-dev.sh
```

## Verifying Hot Reloading

### TypeScript (MCP Server)

1. **Make a change to a TypeScript file**:
   ```typescript
   // src/mcp/server.ts
   logger.info(`Hot reloading test: ${new Date().toISOString()}`);
   ```

2. **Check logs**:
   ```bash
   docker logs mcp-server-dev --tail 20
   ```

### C# (Unity Client)

1. **Make a change to a C# file**:
   ```csharp
   // unity-client/Controllers/CodeExecutionController.cs
   [HttpGet("status")]
   public IActionResult GetStatus()
   {
       return Ok($"Unity client is running. Time: {DateTime.Now}");
   }
   ```

2. **Test the endpoint**:
   ```bash
   curl http://localhost:8081/api/CodeExecution/status
   ```

## Common Commands

### Docker Commands

```bash
# View logs
docker logs mcp-server-dev --tail 20
docker logs unity-client-dev --tail 20

# Restart containers
docker-compose -f docker-compose.dev.yml restart mcp-server
docker-compose -f docker-compose.dev.yml restart unity-client

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build -d

# Check container status
docker ps

# Execute command in container
docker exec mcp-server-dev curl -s http://unity-client-dev:8081/api/CodeExecution/status
```

### Testing Commands

```bash
# Test MCP STDIO client
echo '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"help","arguments":{}}}' | node dist/mcp-stdio-client/index.js

# Test Unity code execution
echo '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"execute_code","arguments":{"code":"return System.Environment.MachineName;","timeout":5000}}}' | node dist/mcp-stdio-client/index.js

# Test Unity client directly
curl http://localhost:8081/api/CodeExecution/status
```

## Troubleshooting Checklist

1. **File changes not detected**:
   - Check if polling is enabled
   - Verify volume mounts
   - Try touching the file

2. **Compilation errors**:
   - Check logs for error messages
   - Fix syntax errors

3. **Service not restarting**:
   - Check nodemon configuration
   - Restart container manually

4. **Networking issues**:
   - Verify Kestrel configuration (0.0.0.0:8081)
   - Check UNITY_HOST environment variable
   - Test connectivity between containers

## Key Configuration Files

1. **docker-compose.dev.yml**: Container configuration
2. **nodemon.json**: MCP server file watching
3. **appsettings.json**: Unity client configuration
4. **tsconfig.json**: TypeScript compilation

## Hot Reloading Architecture

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

## Best Practices Summary

1. Make small, incremental changes
2. Use polling for file watching
3. Monitor logs continuously
4. Test changes immediately
5. Configure networking properly
6. Use cached volumes for better performance
7. Document your changes

For more detailed information, see [Hot Reloading Guide](./hot-reloading.md).
