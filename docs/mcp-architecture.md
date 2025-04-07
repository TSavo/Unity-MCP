# MCP Architecture

This document provides an overview of the Model Context Protocol (MCP) architecture used in the Unity-MCP project.

## Overview

The MCP system consists of two main components:

1. **MCP Server**: A Node.js server that provides a REST API for interacting with Unity
2. **MCP STDIO Client**: A command-line interface that allows Claude to interact with the MCP Server

The MCP system is designed to be modular and extensible, with a clean separation of concerns between different components.

## Namespaces

The MCP system is organized into two main namespaces:

### 1. Executions Namespace

The Executions namespace is responsible for executing code in Unity and retrieving the results. It is managed by the AsyncExecutionSystem and provides the following functionality:

- Execute C# code in Unity
- Query Unity objects using dot notation
- Retrieve the results of previous executions

#### API Endpoints

- `POST /tools` - Execute a tool (execute_code, query, etc.)
- `GET /results/{logId}` - Get the result of a previous execution
- `GET /operations` - List all operations

#### MCP Tools

- `execute_code` - Execute C# code in Unity
- `query` - Query Unity objects using dot notation
- `get_result` - Get the result of a previous execution by log ID

### 2. Logs Namespace

The Logs namespace is responsible for storing and retrieving log entries. It is completely separate from the Executions namespace and provides the following functionality:

- Append entries to a log
- Retrieve entries from a log
- Delete logs

#### API Endpoints

- `POST /logs/{logName}` - Overwrite a log with new content
- `PATCH /logs/{logName}` - Append entries to a log
- `GET /logs/{logName}` - Retrieve all entries from a log
- `DELETE /logs/{logName}` - Delete a log

#### MCP Tools

- `get_logs` - Get a list of all logs
- `get_log_by_name` - Get a single log by its name

## Data Flow

1. Claude sends a request to the MCP STDIO Client
2. The MCP STDIO Client forwards the request to the MCP Server
3. The MCP Server processes the request and interacts with Unity if necessary
4. The MCP Server returns the result to the MCP STDIO Client
5. The MCP STDIO Client returns the result to Claude

## Components

### AsyncExecutionSystem

The AsyncExecutionSystem is responsible for executing code in Unity and managing the results. It provides the following functionality:

- Execute operations asynchronously
- Store operation results
- Retrieve operation results
- Cancel operations
- Clean up completed operations

### LoggingSystem

The LoggingSystem is responsible for storing and retrieving log entries. It provides the following functionality:

- Append entries to a log
- Retrieve entries from a log
- Delete logs

### MCP STDIO Client

The MCP STDIO Client is a command-line interface that allows Claude to interact with the MCP Server. It provides the following functionality:

- Parse JSON-RPC requests from Claude
- Forward requests to the MCP Server
- Return results to Claude

### MCP Server

The MCP Server is a Node.js server that provides a REST API for interacting with Unity. It provides the following functionality:

- Execute tools
- Store and retrieve operation results
- Store and retrieve log entries
- Interact with Unity

## Security

The MCP system is designed to be secure, with the following security measures:

- Input validation for all API endpoints
- Rate limiting to prevent abuse
- Error handling to prevent information leakage
- Logging for audit purposes

## Configuration

The MCP system can be configured using environment variables or a configuration file. The following configuration options are available:

- `PORT` - The port to listen on (default: 8080)
- `UNITY_HOST` - The hostname of the Unity client (default: localhost)
- `UNITY_PORT` - The port of the Unity client (default: 8081)
- `LOG_LEVEL` - The log level (default: info)
- `NODE_ENV` - The environment (development, production, test)

## Deployment

The MCP system can be deployed using Docker or as a standalone Node.js application. See the [deployment documentation](deployment.md) for more information.
