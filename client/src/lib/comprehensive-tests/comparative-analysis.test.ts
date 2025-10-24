import { compareScenarios, calculateBreakEvenPoint, calculateCumulativeCostDifference, calculateMonthlyPaymentDifference } from '../comparisonEngine';
import { LoanDetails, ScenarioComparison } from '../types';

describe('Comparative Analysis Tests', () => {
  // Test data setup
  const scenario1: LoanDetails = {
    principal: 200000,
    interestRatePeriods: [{ startMonth: 1, interestRate: 4.5 }],
    loanTerm: 30,
    overpaymentPlans: [],
    startDate: new Date('2025-01-01'),
    name: 'Base Scenario',
    currency: 'USD'
  };

  const scenario2: LoanDetails = {
    principal: 200000,
    interestRatePeriods: [{ startMonth: 1, interestRate: 4.0 }],
    loanTerm: 30,
    overpaymentPlans: [],
    startDate: new Date('2025-01-01'),
    name: 'Lower Rate Scenario',
    currency: 'USD'
  };

  const scenario3: LoanDetails = {
    principal: 200000,
    interestRatePeriods: [{ startMonth: 1, interestRate: 4.5 }],
    loanTerm: 15,
    overpaymentPlans: [],
    startDate: new Date('2025-01-01'),
    name: 'Shorter Term Scenario',
    currency: 'USD'
  };

  test('CA1: Basic Scenario Comparison', () => {
    // Compare two scenarios with different interest rates
    const result = compareScenarios([
      { id: '1', name: 'Base Scenario', loanDetails: scenario1 },
      { id: '2', name: 'Lower Rate Scenario', loanDetails: scenario2 }
    ]);

    // Verify the comparison results
    expect(result.scenarios.length).toBe(2);
    expect(result.differences.length).toBe(1);
    
    // Lower rate should result in lower total interest
    expect(result.differences[0].totalInterestDiff).toBeGreaterThan(0);
    
    // Lower rate should result in lower monthly payment
    expect(result.differences[0].monthlyPaymentDiff).toBeGreaterThan(0);
  });

  test('CA2: Term Comparison', () => {
    // Compare scenarios with different terms
    const result = compareScenarios([
      { id: '1', name: 'Base Scenario', loanDetails: scenario1 },
      { id: '3', name: 'Shorter Term Scenario', loanDetails: scenario3 }
    ]);

    // Verify the comparison results
    expect(result.scenarios.length).toBe(2);
    expect(result.differences.length).toBe(1);
    
    // Shorter term should result in less total interest
    expect(result.differences[0].totalInterestDiff).toBeGreaterThan(0);
    
    // Shorter term should result in higher monthly payment
    expect(result.differences[0].monthlyPaymentDiff).toBeLessThan(0);
    
    // Term difference should be 15 years
    expect(result.differences[0].termDiff).toBeCloseTo(15, 0);
  });

  test('CA3: Break-even Point Calculation', () => {
    // Create two payment schedules with different characteristics
    const schedule1 = [
      { monthlyPayment: 1000, fees: 100 },
      { monthlyPayment: 1000, fees: 100 },
      { monthlyPayment: 1000, fees: 100 },
      { monthlyPayment: 1000, fees: 100 }
    ];
    
    const schedule2 = [
      { monthlyPayment: 1200, fees: 50 },
      { monthlyPayment: 1200, fees: 50 },
      { monthlyPayment: 1200, fees: 50 },
      { monthlyPayment: 1200, fees: 50 }
    ];
    
    // Calculate break-even point
    const breakEvenPoint = calculateBreakEvenPoint(schedule1, schedule2);
    
    // The break-even point should be at month 3
    // Schedule 1: (1100 + 1100 + 1100) = 3300
    // Schedule 2: (1250 + 1250 + 1250) = 3750
    // At month 3, schedule 1 is cheaper in total
    expect(breakEvenPoint).toBe(3);
  });

  test('CA4: Cumulative Cost Difference Calculation', () => {
    // Create two payment schedules
    const schedule1 = [
      { monthlyPayment: 1000, fees: 100 },
      { monthlyPayment: 1000, fees: 100 },
      { monthlyPayment: 1000, fees: 100 }
    ];
    
    const schedule2 = [
      { monthlyPayment: 1200, fees: 50 },
      { monthlyPayment: 1200, fees: 50 },
      { monthlyPayment: 1200, fees: 50 }
    ];
    
    // Calculate cumulative cost differences
    const differences = calculateCumulativeCostDifference(schedule1, schedule2);
    
    // Verify the differences
    expect(differences.length).toBe(3);
    
    // Month 1: (1000 + 100) - (1200 + 50) = -150
    expect(differences[0]).toBe(-150);
    
    // Month 2: (1000 + 100 + 1000 + 100) - (1200 + 50 + 1200 + 50) = -300
    expect(differences[1]).toBe(-300);
    
    // Month 3: (1000 + 100 + 1000 + 100 + 1000 + 100) - (1200 + 50 + 1200 + 50 + 1200 + 50) = -450
    expect(differences[2]).toBe(-450);
  });

  test('CA5: Monthly Payment Difference Calculation', () => {
    // Create two payment schedules
    const schedule1 = [
      { monthlyPayment: 1000, fees: 100 },
      { monthlyPayment: 1000, fees: 100 },
      { monthlyPayment: 1000, fees: 100 }
    ];
    
    const schedule2 = [
      { monthlyPayment: 1200, fees: 50 },
      { monthlyPayment: 1200, fees: 50 },
      { monthlyPayment: 1200, fees: 50 }
    ];
    
    // Calculate monthly payment differences
    const differences = calculateMonthlyPaymentDifference(schedule1, schedule2);
    
    // Verify the differences
    expect(differences.length).toBe(3);
    
    // Month 1: (1000 + 100) - (1200 + 50) = -150
    expect(differences[0]).toBe(-150);
    
    // Month 2: (1000 + 100) - (1200 + 50) = -150
    expect(differences[1]).toBe(-150);
    
    // Month 3: (1000 + 100) - (1200 + 50) = -150
    expect(differences[2]).toBe(-150);
  });

  test('CA6: Multiple Scenario Comparison', () => {
    // Compare three scenarios
    const result = compareScenarios([
      { id: '1', name: 'Base Scenario', loanDetails: scenario1 },
      { id: '2', name: 'Lower Rate Scenario', loanDetails: scenario2 },
      { id: '3', name: 'Shorter Term Scenario', loanDetails: scenario3 }
    ]);

    // Verify the comparison results
    expect(result.scenarios.length).toBe(3);
    expect(result.differences.length).toBe(2);
    
    // First difference is between Base and Lower Rate
    expect(result.differences[0].totalInterestDiff).toBeGreaterThan(0);
    
    // Second difference is between Base and Shorter Term
    expect(result.differences[1].termDiff).toBeGreaterThan(0);
  });
});