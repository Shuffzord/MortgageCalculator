#!/bin/bash
# generate-build-info.sh - Script to generate build info file

# Get current timestamp in ISO format
TIMESTAMP=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

# Read version from package.json (if available)
if [ -f "package.json" ]; then
  VERSION=$(grep -o '"version": *"[^"]*"' package.json | grep -o '[0-9][^"]*')
else
  VERSION="1.0.0"
fi

# Create the build info file by replacing placeholders
sed "s|BUILD_TIMESTAMP_PLACEHOLDER|$TIMESTAMP|g" build-info.js.template > public/build-info.js
sed -i "s|VERSION_PLACEHOLDER|$VERSION|g" public/build-info.js

echo "Generated build-info.js with timestamp: $TIMESTAMP and version: $VERSION"