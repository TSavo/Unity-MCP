# Unity-MCP Server Startup Script
# This script starts the TypeScript MCP server and generates the MCP configuration file

# Define colors for output
$Green = [ConsoleColor]::Green
$Cyan = [ConsoleColor]::Cyan
$Yellow = [ConsoleColor]::Yellow
$Red = [ConsoleColor]::Red

# Print banner
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
Write-Host "║                      Unity-MCP Server                      ║" -ForegroundColor $Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
Write-Host ""

# Get the directory of the script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define paths
$tsServerDir = $scriptDir
$mcpConfigPath = Join-Path $scriptDir "mcp-config.json"
$claudeConfigPath = "$env:APPDATA\Claude\mcp-config.json"

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

# Check if port is available
$tsPort = 8080

if (Test-PortInUse -Port $tsPort) {
    Write-Host "Error: Port $tsPort is already in use. The TypeScript MCP server cannot start." -ForegroundColor $Red
    Write-Host "Please close the application using this port and try again." -ForegroundColor $Red
    exit 1
}

# Create the MCP configuration file
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

# Ask if the user wants to copy the config to Claude's directory
Write-Host ""
Write-Host "Would you like to copy the MCP configuration to Claude's directory?" -ForegroundColor $Yellow
$copyToClaudeDir = Read-Host "This will enable Claude to access the Unity tools (Y/N)"

if ($copyToClaudeDir -eq "Y" -or $copyToClaudeDir -eq "y") {
    # Create Claude directory if it doesn't exist
    $claudeDir = Split-Path -Parent $claudeConfigPath
    if (-not (Test-Path $claudeDir)) {
        New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
    }
    
    # Copy the config file
    Copy-Item -Path $mcpConfigPath -Destination $claudeConfigPath -Force
    Write-Host "Copied MCP configuration to Claude's directory: $claudeConfigPath" -ForegroundColor $Green
}

# Start the TypeScript MCP server
Write-Host ""
Write-Host "Starting TypeScript MCP server on port $tsPort..." -ForegroundColor $Yellow
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor $Yellow
Write-Host ""

# Start the server in the current window
Push-Location $tsServerDir
npm start
Pop-Location
