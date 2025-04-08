# Unity MCP

A bridge between Unity and AI assistants using the Model Context Protocol (MCP).

## Features

- Execute C# code in Unity from AI assistants
- Query Unity objects and properties
- Control game execution (start, stop, pause)
- Get game state information
- Editor integration for persistent availability

## Installation

### Using Unity Package Manager

1. Open the Package Manager window in Unity (Window > Package Manager)
2. Click the "+" button in the top-left corner
3. Select "Add package from git URL..."
4. Enter the URL: `https://github.com/TSavo/Unity-MCP.git?path=/unity-client`
5. Click "Add"

### Manual Installation

1. Clone the repository: `git clone https://github.com/TSavo/Unity-MCP.git`
2. In Unity, open the Package Manager window
3. Click the "+" button in the top-left corner
4. Select "Add package from disk..."
5. Navigate to the cloned repository and select the `unity-client` folder
6. Click "Open"

## Usage

### Editor Extension

The Unity MCP package includes an Editor extension that runs independently of game execution. This ensures that the MCP service remains available whether the game is running or not.

To access the Editor extension:

1. Open the Unity Editor
2. Go to Window > Unity MCP > Control Panel
3. Use the control panel to start/stop the MCP service and control game execution

### Runtime Client

The Unity MCP package also includes a runtime client that can be added to your scene:

1. Drag the MCPClient prefab from the package into your scene
2. Configure the server URL if needed
3. Use the MCPClient.Instance.SendData method to send data to the MCP server

## API Reference

### Editor Extension

- `UnityMCPEditorExtension.StartGame()`: Start the game (enter play mode)
- `UnityMCPEditorExtension.StopGame()`: Stop the game (exit play mode)
- `UnityMCPEditorExtension.GetGameState()`: Get the current game state

### Runtime Client

- `MCPClient.Instance.SendData(string logName, object data)`: Send data to the MCP server

## License

MIT
