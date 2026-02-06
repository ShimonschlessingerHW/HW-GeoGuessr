#!/bin/bash

# Kill any running Vite dev server processes
echo "Killing any running Vite processes..."
pkill -f "vite" 2>/dev/null || true

# Give processes time to terminate
sleep 1

# Navigate to the react-vite-app directory
cd "$(dirname "$0")/react-vite-app"

# Start the dev server
echo "Starting Vite dev server..."
npm run dev
