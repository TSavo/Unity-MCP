# This script starts the development environment

# Stop any running containers
docker-compose -f docker-compose.dev.yml down

# Build and start the containers
docker-compose -f docker-compose.dev.yml up --build -d

# Start TypeScript compiler in watch mode in a new terminal
Write-Host "Starting TypeScript compiler in watch mode..."
Start-Process powershell -ArgumentList "-NoExit", "-File", ".\watch-typescript.ps1"

# Show logs
docker-compose -f docker-compose.dev.yml logs -f
