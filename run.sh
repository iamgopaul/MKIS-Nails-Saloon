#!/bin/bash
set -e

# Install dependencies if node_modules is missing or package-lock has changed.
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

npm run dev
