# Unity-AI Bridge SDK API Reference

## 1. AI Static Class

The AI static class is the main entry point for the SDK. It provides methods for accessing and manipulating results.

### 1.1 Methods

#### 1.1.1 Result

`csharp
public static Result Result(string name)
`

Access a named result to read from, write to, or clear it.

**Parameters:**
- 
ame: The name of the result to access

**Returns:**
- A Result object representing the named result

**Example:**
`csharp
// Access a named result
var result = AI.Result(" player_stats\);
`

#### 1.1.2 ClearAllResults

`csharp
public static void ClearAllResults()
`

Clear all results (both named and operation results).

**Example:**
`csharp
// Clear all results
AI.ClearAllResults();
`

## 2. Result Class

The Result class represents a named result that can be manipulated.

### 2.1 Methods

#### 2.1.1 Write

`csharp
public void Write(object data)
`

Write data to this result, replacing any existing data.

**Parameters:**
- data: The data to write to the result

**Example:**
`csharp
// Write data to a result
AI.Result(\player_stats\).Write(new {
 Health = 100,
 Level = 5,
 Experience = 1250
});
`

#### 2.1.2 Append

`csharp
public void Append(object data)
`

Append data to this result (adds to existing data rather than replacing).

**Parameters:**
- data: The data to append to the result

**Example:**
`csharp
// Append data to a result
AI.Result(\game_log\).Append(new {
 Event = \Player took damage\,
 Damage = 25,
 Timestamp = DateTime.UtcNow
});
`

#### 2.1.3 WriteError

`csharp
public void WriteError(Exception ex)
`

Write an error to this result.

**Parameters:**
- ex: The exception to write to the result

**Example:**
`csharp
try
{
 // Some code that might throw an exception
}
catch (Exception ex)
{
 // Write the error to a result
 AI.Result(\error_log\).WriteError(ex);
}
`

#### 2.1.4 Clear

`csharp
public void Clear()
`

Clear this result, removing all data.

**Example:**
`csharp
// Clear a result
AI.Result(\game_log\).Clear();
`

#### 2.1.5 Read

`csharp
public object Read()
`

Read the current value of this result.

**Returns:**
- The current value of the result

**Example:**
`csharp
// Read a result
var playerStats = AI.Result(\player_stats\).Read();
`

## 3. MCP Commands

The following MCP commands are available for interacting with the SDK:

### 3.1 unity_execute_code

Execute arbitrary C# code in Unity.

**Parameters:**
- code: The C# code to execute
- imeout: Maximum time to wait in milliseconds (default: 1000)

**Returns:**
- A result containing the output of the code execution
- A log ID for retrieving the result later if the operation times out

### 3.2 unity_query

Execute a query using dot notation to access objects and properties.

**Parameters:**
- query: The query string using dot notation
- imeout: Maximum time to wait in milliseconds (default: 1000)

**Returns:**
- A result containing the output of the query
- A log ID for retrieving the result later if the operation times out

### 3.3 unity_get_result

Retrieve a result by ID or name.

**Parameters:**
- id_or_name: The ID or name of the result to retrieve

**Returns:**
- The result data if found
- An error if the result is not found

### 3.4 unity_list_results

List all available results.

**Returns:**
- A list of available results, including their IDs, names, and timestamps

### 3.5 unity_clear_result

Clear a specific result or all results.

**Parameters:**
- id_or_name: The ID or name of the result to clear, or \all\ to clear all results

**Returns:**
- A confirmation that the result(s) were cleared
