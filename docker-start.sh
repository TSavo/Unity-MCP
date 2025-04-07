#!/bin/bash

# Stop any running containers
docker-compose down

# Build and start the containers
docker-compose up --build -d

# Show logs
docker-compose logs -f
