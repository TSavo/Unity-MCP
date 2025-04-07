#!/bin/bash

# This script runs the development runner

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the development runner
echo "Starting development runner..."
npm run dev:runner
