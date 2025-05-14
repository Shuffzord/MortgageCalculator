# Impact Analysis Testing Plan

Since the impact analysis panel is still not displaying correctly, we need to create a comprehensive testing suite to identify and fix the issues. This document outlines the testing approach.

## Testing Strategy

We'll create a multi-layered testing approach:

1. **Unit Tests**: Test individual functions in isolation
2. **Component Tests**: Test the LoanSummary component rendering
3. **Integration Tests**: Test the interaction between components and services
4. **Manual Verification**: Steps to manually verify the functionality

## Test Suite Structure

### 1. Unit Tests for Impact Analysis Logic

Test the `analyzeOverpaymentImpact` function in isolation:

```typescript
// client/src/lib/optimizationEngine.test.ts
describe('analyzeOverpaymentImpact', () => {
  test('should return impact data for monthly overpayments', () => {
    // Test with monthly overpayments
  });
  
  test('should return impact data for one-time overpayments', () => {
    // Test with one-time overpayments
  });
  
  test('should return impact data for quarterly overpayments', () => {
    // Test with quarterly overpayments
  });
  
  test('should return impact data for annual overpayments', () => {
    // Test with annual overpayments
  });
});
```

### 2. Component Tests for LoanSummary

Test the LoanSummary component with different overpayment scenarios:

```typescript
// client/src/components/LoanSummary.test.tsx
import { render, screen } from '@testing-library/react';
import LoanSummary from './LoanSummary';
import { calculationService } from '@/lib/services/calculationService';

// Mock dependencies
jest.mock('@/lib/services/calculationService');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));
jest.mock('chart.js/auto');

describe('LoanSummary', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock calculationService.analyzeOverpaymentImpact
    calculationService.analyzeOverpaymentImpact.mockReturnValue([
      { amount: 100, interestSaved: 5000, termReduction: 2 },
      { amount: 200, interestSaved: 10000, termReduction: 4 }
    ]);
  });
  
  test('should render impact analysis panel with monthly overpayments', () => {
    // Arrange: Set up props with monthly overpayments
    
    // Act: Render component
    
    // Assert: Check if panel is rendered
  });
  
  test('should render impact analysis panel with one-time overpayments', () => {
    // Arrange: Set up props with one-time overpayments
    
    // Act: Render component
    
    // Assert: Check if panel is rendered
  });
  
  test('should not render impact analysis panel without overpayments', () => {
    // Arrange: Set up props without overpayments
    
    // Act: Render component
    
    // Assert: Check that panel is not rendered
  });
});
```

### 3. Integration Tests

Test the interaction between LoanSummary and calculationService:

```typescript
// client/src/integration/LoanSummary.integration.test.tsx
describe('LoanSummary Integration', () => {
  test('should call analyzeOverpaymentImpact with correct parameters for monthly overpayments', () => {
    // Test integration with monthly overpayments
  });
  
  test('should call analyzeOverpaymentImpact with correct parameters for one-time overpayments', () => {
    // Test integration with one-time overpayments
  });
});
```

## Additional Debugging

To help identify why the panel isn't displaying, we should add more detailed logging:

1. Log the state of `impactData` after it's set
2. Log the chart creation process
3. Check if the chart canvas is being properly referenced
4. Verify that the translation keys are working correctly

## Manual Verification Steps

1. Create a loan with a monthly overpayment
2. Check if the impact analysis panel appears
3. Create a loan with a one-time overpayment
4. Check if the impact analysis panel appears
5. Create a loan with a quarterly overpayment
6. Check if the impact analysis panel appears
7. Create a loan with an annual overpayment
8. Check if the impact analysis panel appears

## Implementation Plan

1. Create unit tests for the `analyzeOverpaymentImpact` function
2. Create component tests for the LoanSummary component
3. Add additional debugging logs to the LoanSummary component
4. Fix any issues identified by the tests
5. Manually verify the functionality