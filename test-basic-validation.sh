#!/bin/bash

# Run just the basic validation tests
echo "Running basic validation tests..."
npx jest --testPathPattern=client/src/lib/comprehensive-tests/basic-validation.test.ts --testTimeout=60000

# Check if tests passed
if [ $? -eq 0 ]; then
  echo "Basic validation tests passed successfully!"
else
  echo "Some tests failed. See the output above for details."
fi