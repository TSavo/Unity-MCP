# Troubleshooting

## Overview

This document provides solutions for common issues you might encounter when using Unity-MCP. It covers problems related to all four components of the architecture: MCP STDIO Client, Web Server, Unity Integration, and Unity SDK.

## MCP STDIO Client Issues

### Issue: Claude Can't Find the MCP STDIO Client

**Symptoms:**
- Claude reports that it can't find the MCP STDIO Client
- Claude can't execute code in Unity

**Possible Causes:**
1. The MCP STDIO Client is not properly configured in Claude's MCP server list
2. The path to the MCP STDIO Client is incorrect
3. The MCP STDIO Client is not built

**Solutions:**
1. Check the MCP server configuration in Claude:
   ```json
   {
     "mcpServers": {
       "unity-mcp": {
         "command": "node",
         "args": ["path/to/Unity-MCP/build/index.js"],
         "env": {
           "CONFIG_PATH": "path/to/Unity-MCP/config.json"
         }
       }
     }
   }
   ```
2. Ensure the path to the MCP STDIO Client is correct
3. Build the MCP STDIO Client:
   ```bash
   cd path/to/Unity-MCP
   npm run build
   ```

### Issue: MCP STDIO Client Can't Connect to Web Server

**Symptoms:**
- Claude can find the MCP STDIO Client, but it can't connect to the Web Server
- Error messages about connection refused or timeout

**Possible Causes:**
1. The Web Server is not running
2. The Web Server URL in the MCP STDIO Client configuration is incorrect
3. Firewall or network issues

**Solutions:**
1. Start the Web Server:
   ```bash
   cd path/to/Unity-MCP
   npm run start-server
   ```
2. Check the Web Server URL in `config.json`:
   ```json
   {
     "webServerUrl": "http://localhost:8080"
   }
   ```
3. Check firewall settings and ensure the Web Server port is open

### Issue: MCP STDIO Client Crashes

**Symptoms:**
- The MCP STDIO Client crashes when Claude tries to use it
- Error messages in Claude about the subprocess exiting

**Possible Causes:**
1. Missing dependencies
2. TypeScript compilation errors
3. Configuration errors

**Solutions:**
1. Install dependencies:
   ```bash
   cd path/to/Unity-MCP
   npm install
   ```
2. Check for TypeScript compilation errors:
   ```bash
   cd path/to/Unity-MCP
   npm run build
   ```
3. Check the configuration in `config.json`
4. Run the MCP STDIO Client manually to see error messages:
   ```bash
   cd path/to/Unity-MCP
   node build/index.js
   ```

## Web Server Issues

### Issue: Web Server Won't Start

**Symptoms:**
- The Web Server fails to start
- Error messages about port already in use or other startup issues

**Possible Causes:**
1. Another process is using the same port
2. Missing dependencies
3. Configuration errors

**Solutions:**
1. Check if another process is using the port:
   ```bash
   # On Linux/macOS
   lsof -i :8080
   
   # On Windows
   netstat -ano | findstr :8080
   ```
2. Change the port in `server-config.json`:
   ```json
   {
     "port": 8081
   }
   ```
3. Install dependencies:
   ```bash
   cd path/to/Unity-MCP
   npm install
   ```
4. Check the configuration in `server-config.json`

### Issue: Web Server Can't Connect to Database

**Symptoms:**
- The Web Server starts but reports database connection errors
- Operations that require persistence fail

**Possible Causes:**
1. Database configuration is incorrect
2. Database files are corrupted
3. Permissions issues

**Solutions:**
1. Check the database configuration in `server-config.json`:
   ```json
   {
     "database": {
       "type": "nedb",
       "path": "./data"
     }
   }
   ```
2. Ensure the database directory exists and has the correct permissions
3. Try resetting the database by deleting the database files (backup first if needed)

### Issue: Web Server Can't Communicate with Unity

**Symptoms:**
- The Web Server is running, but it can't communicate with Unity
- Error messages about WebSocket connection failures

**Possible Causes:**
1. Unity is not running
2. The Unity Integration is not in the scene
3. WebSocket connection issues

**Solutions:**
1. Ensure Unity is running with the correct scene
2. Check that the Unity Integration GameObject is in the scene
3. Check the WebSocket URL in the Unity Integration configuration
4. Check firewall settings and ensure the WebSocket port is open

## Unity Integration Issues

### Issue: Unity Integration Can't Connect to Web Server

**Symptoms:**
- The Unity Integration reports that it can't connect to the Web Server
- Error messages about WebSocket connection failures

**Possible Causes:**
1. The Web Server is not running
2. The Web Server URL in the Unity Integration configuration is incorrect
3. Firewall or network issues

**Solutions:**
1. Ensure the Web Server is running
2. Check the Web Server URL in the Unity Integration configuration:
   ```csharp
   // In the Unity Editor, select the UnityMCPIntegration GameObject
   // Check the Web Server URL property in the Inspector
   ```
3. Check firewall settings and ensure the WebSocket port is open
4. Try using `ws://localhost:8080` for local development

### Issue: Code Execution Fails in Unity

**Symptoms:**
- Code execution requests fail in Unity
- Error messages about compilation errors or runtime exceptions

**Possible Causes:**
1. Syntax errors in the C# code
2. Missing references to Unity assemblies
3. Runtime exceptions in the executed code

**Solutions:**
1. Check the C# code for syntax errors
2. Ensure the code has the necessary references to Unity assemblies
3. Add error handling to the code
4. Check the Unity Console for error messages
5. Try executing simpler code first to isolate the issue

### Issue: Unity Integration Crashes

**Symptoms:**
- The Unity Integration crashes or causes Unity to crash
- Error messages in the Unity Console

**Possible Causes:**
1. Bugs in the Unity Integration code
2. Memory issues
3. Threading issues

**Solutions:**
1. Check the Unity Console for error messages
2. Update to the latest version of the Unity Integration
3. Reduce the complexity of the code being executed
4. Check for memory leaks or excessive memory usage
5. Ensure proper thread synchronization

## Unity SDK Issues

### Issue: Unity SDK Can't Communicate with Unity Integration

**Symptoms:**
- The Unity SDK reports that it can't communicate with the Unity Integration
- Error messages about the Integration not being registered

**Possible Causes:**
1. The Unity Integration is not in the scene
2. The Unity Integration is not properly initialized
3. The Unity SDK is not properly imported

**Solutions:**
1. Ensure the Unity Integration GameObject is in the scene
2. Check that the Unity Integration is properly initialized
3. Reimport the Unity SDK package
4. Check for script compilation errors in Unity

### Issue: Data Serialization Errors

**Symptoms:**
- The Unity SDK reports serialization errors
- Error messages about circular references or non-serializable types

**Possible Causes:**
1. Trying to serialize objects with circular references
2. Trying to serialize non-serializable types
3. Trying to serialize very large objects

**Solutions:**
1. Avoid circular references in the data
2. Use only serializable types (primitives, arrays, lists, dictionaries, and serializable classes)
3. Implement custom serialization for complex types
4. Break large objects into smaller pieces

### Issue: Thread Safety Issues

**Symptoms:**
- Random crashes or exceptions
- Error messages about accessing Unity APIs from a background thread

**Possible Causes:**
1. Accessing Unity APIs from a background thread
2. Concurrent access to shared resources
3. Race conditions

**Solutions:**
1. Only access Unity APIs from the main thread
2. Use `UnityMainThreadDispatcher` to execute code on the main thread
3. Use proper thread synchronization (locks, semaphores, etc.)
4. Avoid sharing mutable state between threads

## General Issues

### Issue: Performance Problems

**Symptoms:**
- Slow response times
- High CPU or memory usage
- Unity frame rate drops

**Possible Causes:**
1. Executing complex or inefficient code
2. Sending large amounts of data
3. Memory leaks
4. Excessive logging

**Solutions:**
1. Optimize the code being executed
2. Reduce the amount of data being sent
3. Check for memory leaks
4. Reduce logging verbosity
5. Implement timeouts for long-running operations
6. Use profiling tools to identify bottlenecks

### Issue: Security Concerns

**Symptoms:**
- Unauthorized access to the system
- Execution of malicious code
- Data leaks

**Possible Causes:**
1. Lack of authentication
2. Insecure communication
3. Insufficient input validation
4. Excessive permissions

**Solutions:**
1. Implement authentication for the Web Server
2. Use HTTPS and WSS for secure communication
3. Validate all input
4. Run with minimal permissions
5. Implement a whitelist of allowed operations
6. See the [Security Considerations](11-security-considerations.md) document for more information

### Issue: Compatibility Problems

**Symptoms:**
- Components don't work together
- Version mismatch errors
- API incompatibility errors

**Possible Causes:**
1. Using different versions of components
2. Using incompatible versions of Unity
3. Using incompatible versions of Node.js

**Solutions:**
1. Ensure all components are from the same version of Unity-MCP
2. Check the Unity version requirements
3. Check the Node.js version requirements
4. Update all components to the latest version

## Logging and Debugging

### Enabling Verbose Logging

To enable verbose logging for troubleshooting:

1. **MCP STDIO Client**:
   ```json
   // config.json
   {
     "logLevel": "debug"
   }
   ```

2. **Web Server**:
   ```json
   // server-config.json
   {
     "logLevel": "debug"
   }
   ```

3. **Unity Integration**:
   ```csharp
   // In the Unity Editor, select the UnityMCPIntegration GameObject
   // Set the Log Level property to Debug in the Inspector
   ```

### Checking Logs

Check the following logs for troubleshooting:

1. **MCP STDIO Client Logs**:
   - Check the console output when running the MCP STDIO Client manually
   - Check Claude's logs for MCP STDIO Client output

2. **Web Server Logs**:
   - Check the console output when running the Web Server
   - Check the log files in the `logs` directory

3. **Unity Logs**:
   - Check the Unity Console for error messages
   - Check the Unity Editor log file:
     - Windows: `%APPDATA%\Unity\Editor\Editor.log`
     - macOS: `~/Library/Logs/Unity/Editor.log`
     - Linux: `~/.config/unity3d/Editor.log`

### Using the Debug Helper

The Unity-MCP package includes a Debug Helper that can be used for troubleshooting:

```csharp
using UnityEngine;
using UnityMCP;

public class DebugHelper : MonoBehaviour
{
    public static void LogSystemInfo()
    {
        AI.Result("system_info").Write(new
        {
            unityVersion = Application.unityVersion,
            platform = Application.platform,
            systemLanguage = Application.systemLanguage,
            deviceModel = SystemInfo.deviceModel,
            deviceName = SystemInfo.deviceName,
            processorType = SystemInfo.processorType,
            processorCount = SystemInfo.processorCount,
            systemMemorySize = SystemInfo.systemMemorySize,
            operatingSystem = SystemInfo.operatingSystem
        });
    }
    
    public static void LogSceneInfo()
    {
        var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
        
        AI.Result("scene_info").Write(new
        {
            name = scene.name,
            path = scene.path,
            isLoaded = scene.isLoaded,
            rootCount = scene.rootCount,
            rootGameObjects = scene.GetRootGameObjects().Select(go => go.name).ToArray()
        });
    }
    
    public static void LogConnectionStatus()
    {
        var integration = GameObject.FindObjectOfType<UnityMCPIntegration>();
        
        if (integration == null)
        {
            AI.Log("Unity Integration not found in scene");
            return;
        }
        
        AI.Result("connection_status").Write(new
        {
            isConnected = integration.IsConnected,
            webServerUrl = integration.WebServerUrl,
            connectionAttempts = integration.ConnectionAttempts,
            lastConnectionTime = integration.LastConnectionTime,
            lastErrorMessage = integration.LastErrorMessage
        });
    }
}
```

## Getting Help

If you're still experiencing issues after trying the solutions in this document, you can get help from the following resources:

1. **GitHub Issues**: Check the [GitHub Issues](https://github.com/TSavo/Unity-MCP/issues) for known issues and solutions
2. **GitHub Discussions**: Ask questions in the [GitHub Discussions](https://github.com/TSavo/Unity-MCP/discussions)
3. **Documentation**: Review the other documentation files for more information
4. **Community**: Join the Unity-MCP community on Discord or other platforms

## Conclusion

This troubleshooting guide covers common issues you might encounter when using Unity-MCP. By following the solutions provided, you should be able to resolve most problems. If you encounter an issue that's not covered in this guide, please report it on GitHub so it can be added to future versions of the documentation.
