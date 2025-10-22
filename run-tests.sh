#!/bin/bash
# Script to run various test scenarios with appropriate timeouts

# Display help menu
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo "Mortgage Calculator Test Runner"
  echo "---------------------------"
  echo "Usage: ./run-tests.sh [test-type]"
  echo ""
  echo "Available test types:"
  echo "  basic       - Run basic mortgage calculator tests"
  echo "  direct      - Run direct calculation script (no Jest)"
  echo "  precision   - Run precision test for yearly data aggregation"
  echo "  payment     - Run monthly payment calculation test"
  echo "  all         - Run all tests"
  echo ""
  exit 0
fi

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to run a test and display its result
run_test() {
  echo -e "${YELLOW}Running $1...${NC}"
  eval "$2"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test passed${NC}"
  else
    echo -e "${RED}✗ Test failed${NC}"
  fi
  echo ""
}

# Basic mortgage calculator tests
if [ "$1" == "basic" ] || [ "$1" == "all" ]; then
  run_test "Basic mortgage calculator tests" "npx jest client/src/lib/mortgage-calculator.test.ts"
fi

# Direct calculation script
if [ "$1" == "direct" ] || [ "$1" == "all" ]; then
  run_test "Direct calculation script" "npx tsx client/src/lib/calculate-payment.script.ts"
fi

# Precision test for yearly data aggregation
if [ "$1" == "precision" ] || [ "$1" == "all" ]; then
  run_test "Precision test for yearly data" "npx jest --testTimeout=30000 -t \"should calculate total interest correctly for each year\" client/src/lib/calculationEngine.test.ts"
fi

# Monthly payment calculation test
if [ "$1" == "payment" ] || [ "$1" == "all" ]; then
  run_test "Monthly payment calculation" "npx jest --testTimeout=30000 -t \"should calculate monthly payment correctly for standard case\" client/src/lib/calculationEngine.test.ts"
fi

# If no argument provided, show help
if [ $# -eq 0 ]; then
  echo "Please specify which tests to run. Use --help for available options."
  exit 1
fi