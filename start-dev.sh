#!/bin/bash

# This script starts the development environment

# Stop any running containers
docker-compose -f docker-compose.dev.yml down

# Build and start the containers
docker-compose -f docker-compose.dev.yml up --build -d

# Start TypeScript compiler in watch mode in a new terminal
echo "Starting TypeScript compiler in watch mode..."
gnome-terminal -- ./watch-typescript.sh || xterm -e ./watch-typescript.sh || ./watch-typescript.sh &

# Show logs
docker-compose -f docker-compose.dev.yml logs -f
