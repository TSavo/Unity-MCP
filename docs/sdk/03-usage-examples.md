# Unity-AI Bridge SDK Usage Examples


This document provides examples of how to use the Unity-AI Bridge SDK in various scenarios.


## 1. Basic Usage

### 1.1 Writing Data to a Result

`csharp
// Example code for writing data to a result
AI.Result(" player_stats\).Write(playerData);
`


### 1.2 Reading Data from a Result

`csharp
// Example code for reading data from a result
var data = AI.Result(" ai_suggestions\).Read();
`


### 1.3 Clearing a Result

`csharp
// Example code for clearing a result
AI.Result(" game_log\).Clear();
`


## 2. Logging and Debugging

### 2.1 Creating a Game Log

`csharp
// Example code for creating a game log
AI.Result(" game_log\).Append(logEntry);
`


### 2.2 Error Logging

`csharp
// Example code for error logging
AI.Result(" error_log\).WriteError(exception);
`
