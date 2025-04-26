#!/bin/bash

# Run just the simple test
echo "Running simple test..."
npx jest client/src/lib/basic-test.test.ts

# Check if tests passed
if [ $? -eq 0 ]; then
  echo "Simple test passed successfully!"
else
  echo "Test failed. See the output above for details."
fi