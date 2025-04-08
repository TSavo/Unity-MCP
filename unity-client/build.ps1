# Build script for Unity-MCP client

# Define colors for output
$Green = [ConsoleColor]::Green
$Cyan = [ConsoleColor]::Cyan
$Yellow = [ConsoleColor]::Yellow
$Red = [ConsoleColor]::Red

# Print banner
Write-Host ""
Write-Host "============================================================" -ForegroundColor $Cyan
Write-Host "                Unity-MCP Client Build Script               " -ForegroundColor $Cyan
Write-Host "============================================================" -ForegroundColor $Cyan
Write-Host ""

# Get the directory of the script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define paths
$projectPath = Join-Path $scriptDir "UnityMCP.Editor.csproj"
$outputDir = Join-Path $scriptDir "bin\Debug"

# Check if the project file exists
if (-not (Test-Path $projectPath)) {
    Write-Host "Error: Project file not found at: $projectPath" -ForegroundColor $Red
    exit 1
}

# Build the project
Write-Host "Building Unity-MCP client..." -ForegroundColor $Yellow
dotnet build $projectPath -c Debug

# Check if the build was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed with exit code $LASTEXITCODE" -ForegroundColor $Red
    exit $LASTEXITCODE
}

Write-Host "Build completed successfully!" -ForegroundColor $Green
Write-Host "Output directory: $outputDir" -ForegroundColor $Cyan
