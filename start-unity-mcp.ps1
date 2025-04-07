# Unity-MCP Startup Script
# This script starts both the TypeScript MCP server and the C# Unity client

# Define colors for output
$Green = [ConsoleColor]::Green
$Cyan = [ConsoleColor]::Cyan
$Yellow = [ConsoleColor]::Yellow
$Red = [ConsoleColor]::Red

# Print banner
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║                      Unity-MCP Bridge                      ║" -ForegroundColor $Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""

# Get the directory of the script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define paths
$tsServerDir = $scriptDir
$csharpClientDir = Join-Path $scriptDir "unity-client"
$mcpConfigPath = Join-Path $scriptDir "mcp-config.json"

# Check if the TypeScript server is built
if (-not (Test-Path (Join-Path $tsServerDir "dist"))) {
    Write-Host "Building TypeScript server..." -ForegroundColor $Yellow
    Push-Location $tsServerDir
    npm run build
    Pop-Location
}

# Function to check if a port is in use
function Test-PortInUse {
    param (
        [int]$Port
    )
    
    $connections = netstat -ano | Select-String -Pattern "TCP.*:$Port.*LISTENING"
    return $connections.Count -gt 0
}

# Check if ports are available
$tsPort = 8080
$csPort = 8081

if (Test-PortInUse -Port $tsPort) {
    Write-Host "Error: Port $tsPort is already in use. The TypeScript MCP server cannot start." -ForegroundColor $Red
    Write-Host "Please close the application using this port and try again." -ForegroundColor $Red
    exit 1
}

if (Test-PortInUse -Port $csPort) {
    Write-Host "Error: Port $csPort is already in use. The C# Unity client cannot start." -ForegroundColor $Red
    Write-Host "Please close the application using this port and try again." -ForegroundColor $Red
    exit 1
}

# Create the MCP configuration file if it doesn't exist
if (-not (Test-Path $mcpConfigPath)) {
    Write-Host "Creating MCP configuration file..." -ForegroundColor $Yellow
    $mcpConfig = @{
        mcpServers = @{
            "unity-ai-bridge" = @{
                url = "http://localhost:$tsPort/sse"
            }
        }
    }
    $mcpConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $mcpConfigPath
    Write-Host "Created MCP configuration file at: $mcpConfigPath" -ForegroundColor $Green
}

# Start the TypeScript MCP server
Write-Host "Starting TypeScript MCP server on port $tsPort..." -ForegroundColor $Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd $tsServerDir && npm start" -NoNewWindow

# Wait for the TypeScript server to start
Write-Host "Waiting for TypeScript server to start..." -ForegroundColor $Yellow
Start-Sleep -Seconds 5

# Start the C# Unity client
Write-Host "Starting C# Unity client on port $csPort..." -ForegroundColor $Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd $csharpClientDir && dotnet run" -NoNewWindow

# Wait for the C# client to start
Write-Host "Waiting for C# client to start..." -ForegroundColor $Yellow
Start-Sleep -Seconds 5

# Print success message
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "║                Unity-MCP Bridge is running!                ║" -ForegroundColor $Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor $Green
Write-Host ""
Write-Host "TypeScript MCP Server: http://localhost:$tsPort" -ForegroundColor $Cyan
Write-Host "C# Unity Client: http://localhost:$csPort" -ForegroundColor $Cyan
Write-Host "MCP Configuration: $mcpConfigPath" -ForegroundColor $Cyan
Write-Host ""
Write-Host "To connect to an AI assistant, copy the MCP configuration file to the appropriate location." -ForegroundColor $Yellow
Write-Host "For Claude Desktop App:" -ForegroundColor $Yellow
Write-Host "  Windows: %APPDATA%\Claude\mcp-config.json" -ForegroundColor $Cyan
Write-Host "  macOS: ~/Library/Application Support/Claude/mcp-config.json" -ForegroundColor $Cyan
Write-Host "  Linux: ~/.config/Claude/mcp-config.json" -ForegroundColor $Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the servers." -ForegroundColor $Yellow

# Keep the script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "Stopping servers..." -ForegroundColor $Yellow
    # Add cleanup code here if needed
}
