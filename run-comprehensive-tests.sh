#!/bin/bash

# Run comprehensive tests with Jest
# This script runs just the comprehensive tests with a longer timeout

echo "Running comprehensive mortgage calculator tests..."
npx jest --testPathPattern=client/src/lib/comprehensive-tests/ --testTimeout=30000

# Check if tests passed
if [ $? -eq 0 ]; then
  echo "All tests passed successfully!"
else
  echo "Some tests failed. See the output above for details."
fi