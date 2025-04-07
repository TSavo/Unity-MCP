# This script runs the development runner

# Install dependencies if needed
if (-not (Test-Path -Path "node_modules")) {
  Write-Host "Installing dependencies..."
  npm install
}

# Run the development runner
Write-Host "Starting development runner..."
npm run dev:runner
