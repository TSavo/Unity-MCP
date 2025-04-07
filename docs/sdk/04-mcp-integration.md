# Unity-AI Bridge SDK: MCP Integration

## 1. Introduction

This document describes how the Unity-AI Bridge SDK integrates with the Model Context Protocol (MCP) to enable AI assistants to interact with Unity games.


## 2. MCP Commands

The Unity-AI Bridge exposes the following commands through MCP:

### 2.1 unity_execute_code

Executes arbitrary C# code in Unity.

### 2.2 unity_query

Executes a query using dot notation to access objects and properties.

### 2.3 unity_get_result

Retrieves a result by ID or name.

### 2.4 unity_list_results

Lists all available results.

### 2.5 unity_clear_result

Clears a specific result or all results.
