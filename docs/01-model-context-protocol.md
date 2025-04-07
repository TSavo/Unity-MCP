# Model Context Protocol (MCP) Specification

## 1. Introduction

### 1.1 Purpose

The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to Large Language Models (LLMs). It creates a universal interface for connecting AI systems with data sources and tools, replacing fragmented integrations with a single, consistent protocol.

### 1.2 Scope

This specification covers:
- The core architecture of MCP
- Communication protocols and data formats
- Server and client implementation guidelines
- Security considerations
- Integration patterns

### 1.3 Audience

This document is intended for:
- Developers building AI-powered applications
- Teams integrating AI capabilities into existing systems
- Tool developers creating MCP-compatible servers
- Anyone interested in understanding how AI systems can interact with external data sources

## 2. Core Concepts

### 2.1 What is MCP?

MCP is best understood as a "USB-C port for AI applications." Just as USB-C provides a standardized way to connect devices to various peripherals, MCP provides a standardized way to connect AI models to different data sources and tools.

The protocol enables AI assistants to:
- Access data from various sources
- Execute actions through external tools
- Maintain context across different systems
- Operate securely within defined boundaries

### 2.2 Key Benefits

- **Standardization**: One protocol for connecting to any data source
- **Interoperability**: Switch between different AI providers and data sources
- **Security**: Keep sensitive data within your infrastructure
- **Extensibility**: Easily add new capabilities to AI systems
- **Ecosystem**: Leverage a growing library of pre-built integrations

### 2.3 Use Cases

- **Development Environments**: Connect AI to code repositories, build systems, and debugging tools
- **Data Analysis**: Access databases, data warehouses, and analytics platforms
- **Content Management**: Interact with document repositories, wikis, and knowledge bases
- **Business Tools**: Integrate with CRM systems, project management tools, and communication platforms
- **Custom Applications**: Connect to proprietary systems and internal tools

## 3. Architecture

### 3.1 Components

MCP follows a client-server architecture with the following components:

1. **MCP Hosts**: Programs like Claude Desktop, IDEs, or AI tools that want to access data through MCP
2. **MCP Clients**: Protocol clients that maintain 1:1 connections with servers
3. **MCP Servers**: Lightweight programs that expose specific capabilities through the standardized Model Context Protocol
4. **Local Data Sources**: Computer files, databases, and services that MCP servers can securely access
5. **Remote Services**: External systems available over the internet that MCP servers can connect to

```
┌─────────────────┐     ┌─────────────────┐
│   MCP Host      │     │   MCP Client    │
│  (AI Assistant) │◄────►                 │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   MCP Server    │
                        └────────┬────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                  ┌─────┴─────┐     ┌─────┴─────┐
                  │  Local    │     │  Remote   │
                  │  Data     │     │  Services │
                  └───────────┘     └───────────┘
```

### 3.2 Transport Types

MCP supports two primary transport mechanisms:

#### 3.2.1 stdio Transport

- Runs on the **local machine**
- Managed automatically by the MCP host
- Communicates directly via `stdout`
- Only accessible locally
- Input: Valid shell command that is run by the host

#### 3.2.2 SSE Transport

- Can run **locally or remotely**
- Managed and run independently
- Communicates **over the network**
- Can be **shared** across machines
- Input: URL to the `/sse` endpoint of an MCP server

### 3.3 Communication Flow

1. The MCP host discovers available MCP servers through configuration
2. The MCP client establishes connections with servers
3. The AI assistant requests data or actions through the MCP client
4. The MCP server processes requests and interacts with data sources
5. Results are returned to the AI assistant through the MCP client

## 4. Core Capabilities

MCP servers provide two primary capabilities:

### 4.1 Resources

Resources are data and content that MCP servers expose to LLMs. They allow AI assistants to:
- Read files and documents
- Access database records
- Retrieve information from APIs
- Browse web content
- Query knowledge bases

Resources are typically read-only and provide context to the AI assistant.

### 4.2 Tools

Tools enable LLMs to perform actions through MCP servers. They allow AI assistants to:
- Execute commands
- Modify data
- Interact with external systems
- Trigger workflows
- Create or update content

Tools are interactive and allow the AI assistant to make changes or perform operations.

## 5. Protocol Specification

### 5.1 Server Discovery

MCP servers are discovered through configuration files:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

For SSE transport:

```json
{
  "mcpServers": {
    "server-name": {
      "url": "http://example.com:8000/sse"
    }
  }
}
```

### 5.2 Server Manifest

Each MCP server provides a manifest that describes its capabilities:

```json
{
  "schema_version": "v1",
  "name": "example-server",
  "description": "Example MCP server",
  "tools": [
    {
      "id": "execute_command",
      "description": "Execute a shell command",
      "parameters": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "description": "Command to execute"
          }
        },
        "required": ["command"]
      }
    }
  ],
  "resources": [
    {
      "id": "file_system",
      "description": "Access to the file system",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "Path to the file or directory"
          }
        },
        "required": ["path"]
      }
    }
  ]
}
```

### 5.3 Tool Execution

Tool execution follows this request/response pattern:

Request:
```json
{
  "tool_id": "execute_command",
  "parameters": {
    "command": "ls -la"
  }
}
```

Response:
```json
{
  "status": "success",
  "result": {
    "output": "total 12\ndrwxr-xr-x  2 user user 4096 Apr  6 20:04 .\ndrwxr-xr-x 10 user user 4096 Apr  6 20:04 ..\n-rw-r--r--  1 user user    0 Apr  6 20:04 file.txt"
  }
}
```

### 5.4 Resource Access

Resource access follows this request/response pattern:

Request:
```json
{
  "resource_id": "file_system",
  "parameters": {
    "path": "/path/to/file.txt"
  }
}
```

Response:
```json
{
  "status": "success",
  "content": "File content goes here...",
  "metadata": {
    "mime_type": "text/plain",
    "size": 123,
    "last_modified": "2023-04-06T20:04:00Z"
  }
}
```

## 6. Security Considerations

### 6.1 Local Execution

MCP servers running locally have the same permissions as the user running them. This means they can:
- Access any files the user can access
- Execute any commands the user can execute
- Connect to any services the user can connect to

Users should only install MCP servers from trusted sources.

### 6.2 Remote Execution

MCP servers running remotely should implement appropriate authentication and authorization mechanisms. Consider:
- Using HTTPS for all communications
- Implementing API keys or OAuth for authentication
- Restricting access to specific resources and tools
- Limiting the scope of operations

### 6.3 Data Privacy

MCP servers should:
- Only send necessary data to the AI assistant
- Avoid exposing sensitive information
- Implement data filtering and redaction where appropriate
- Provide clear documentation on what data is shared

## 7. Implementation Guidelines

### 7.1 Server Implementation

When implementing an MCP server:
1. Define the capabilities (resources and tools) your server will provide
2. Implement the MCP protocol (manifest, resource access, tool execution)
3. Handle authentication and authorization
4. Implement error handling and logging
5. Document your server's capabilities and requirements

### 7.2 Client Implementation

When implementing an MCP client:
1. Discover available MCP servers
2. Connect to servers and retrieve their manifests
3. Present available resources and tools to the AI assistant
4. Handle resource access and tool execution requests
5. Manage errors and provide feedback

### 7.3 Best Practices

- Keep servers focused on specific domains or systems
- Provide clear documentation for each resource and tool
- Implement robust error handling
- Use appropriate security measures
- Follow the principle of least privilege

## 8. Getting Started

### 8.1 Setting Up an MCP Server

1. Choose a programming language and framework
2. Implement the MCP protocol
3. Define your server's resources and tools
4. Test your server with an MCP client
5. Deploy your server (locally or remotely)

### 8.2 Using MCP with AI Assistants

1. Install or configure MCP servers
2. Create an MCP configuration file
3. Connect your AI assistant to your MCP servers
4. Request data or actions through the AI assistant
5. Review and validate the results

## 9. Conclusion

The Model Context Protocol (MCP) provides a standardized way to connect AI assistants to data sources and tools. By implementing MCP, developers can create more powerful and flexible AI applications that can access and manipulate data across various systems.

As the MCP ecosystem grows, we expect to see a wide range of pre-built servers and integrations that will make it easier to connect AI assistants to the systems where data lives.

## 10. References

- [Official MCP Documentation](https://modelcontextprotocol.io/)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)
