/**
 * Basic Validation Tests for the Mortgage Calculator Engine
 * 
 * These tests verify the core functionality of the mortgage calculator
 * using standard scenarios and fixed-rate mortgages.
 */

import { calculateLoanDetails, } from '../calculationEngine';
import { roundToCents } from '../utils';

// calculationEngine.test.ts
import * as engine from '../calculationEngine';
import { PaymentData, OverpaymentDetails } from '../types';

describe('Core calculation functions', () => {
  test('roundToCents rounds to two decimal places', () => {
    expect(roundToCents(123.456)).toBe(123.46);
    expect(roundToCents(123.454)).toBe(123.45);
    expect(roundToCents(0.001)).toBe(0);
    expect(roundToCents(-5.555)).toBe(-5.55);
  });

  test('calculateMonthlyPaymentInternal calculates correct payment', () => {
    // $300,000 loan at 5% for 30 years
    const principal = 300000;
    const monthlyRate = 0.05 / 12;
    const months = 30 * 12;
    
    const payment = engine.calculateMonthlyPaymentInternal(principal, monthlyRate, months);
    
    // Expected monthly payment should be about $1,610.46
    expect(payment).toBeCloseTo(1610.46, 2);
  });
});

describe('Schedule calculations', () => {
  test('recalculateScheduleWithNewRate creates a valid schedule', () => {
    const schedule = engine.recalculateScheduleWithNewRate(200000, 5, 15);
    
    // First payment
    expect(schedule[0].payment).toBe(1);
    expect(schedule[0].balance).toBeLessThan(200000);
    expect(schedule[0].interestPayment).toBeCloseTo(200000 * 0.05 / 12, 2);
    
    // Last payment
    const lastPayment = schedule[schedule.length - 1];
    expect(lastPayment.balance).toBe(0);
    
    // Schedule length should be about 15 years (180 months)
    expect(schedule.length).toBeGreaterThanOrEqual(175);
    expect(schedule.length).toBeLessThanOrEqual(182);
  });
  
  test('aggregateYearlyData converts monthly data to yearly summaries', () => {
    // Create 24 months of sample data
    const sampleData: PaymentData[] = [];
    let balance = 100000;
    
    for (let i = 0; i < 24; i++) {
      const interestPayment = balance * 0.05 / 12;
      const principalPayment = 1000 - interestPayment;
      balance -= principalPayment;
      
      sampleData.push({
        payment: i + 1,
        monthlyPayment: 1000,
        principalPayment,
        interestPayment,
        balance,
        isOverpayment: false,
        overpaymentAmount: 0,
        totalInterest: 0,
        totalPayment: 1000
      });
    }
    
    const yearlyData = engine.aggregateYearlyData(sampleData);
    
    // Should have 2 years of data
    expect(yearlyData.length).toBe(2);
    
    // First year
    expect(yearlyData[0].year).toBe(1);
    expect(yearlyData[0].payment).toBeCloseTo(12000, 2);
    
    // Second year
    expect(yearlyData[1].year).toBe(2);
    expect(yearlyData[1].balance).toBe(sampleData[23].balance);
  });
});

describe('Overpayment handling', () => {
  // Helper to create a sample schedule
  function createSampleSchedule(months: number = 120): PaymentData[] {
    const schedule: PaymentData[] = [];
    let balance = 100000;
    let totalInterest = 0;
    
    for (let i = 0; i < months; i++) {
      const interestPayment = roundToCents(balance * 0.05 / 12);
      totalInterest += interestPayment;
      
      const principalPayment = 1000 - interestPayment;
      balance = roundToCents(balance - principalPayment);
      
      schedule.push({
        payment: i + 1,
        monthlyPayment: 1000,
        principalPayment,
        interestPayment,
        balance,
        isOverpayment: false,
        overpaymentAmount: 0,
        totalInterest: roundToCents(totalInterest),
        totalPayment: 1000
      });
    }
    
    return schedule;
  }
  
  test('isOverpaymentApplicable correctly identifies applicable overpayments', () => {
    const monthlyOp: OverpaymentDetails = {
      amount: 100,
      startMonth: 13,
      endMonth: 48,
      isRecurring: true,
      frequency: "monthly",
      effect: "reduceTerm"
    };
    
    const quarterlyOp: OverpaymentDetails = {
      amount: 200,
      startMonth: 13,
      endMonth: 48,
      isRecurring: true,
      frequency: "quarterly",
      effect: "reduceTerm"
    };
    
    const annualOp: OverpaymentDetails = {
      amount: 500,
      startMonth: 13,
      endMonth: 48,
      isRecurring: true,
      frequency: "annual",
      effect: "reduceTerm"
    };
    
    const oneTimeOp: OverpaymentDetails = {
      amount: 1000,
      startMonth: 13,
      isRecurring: false,
      effect: "reduceTerm",
      endMonth: 0,
      frequency: 'monthly'
    };
    
    // Test monthly recurring
    expect(engine.isOverpaymentApplicable(monthlyOp, 12)).toBe(false);
    expect(engine.isOverpaymentApplicable(monthlyOp, 13)).toBe(true);
    expect(engine.isOverpaymentApplicable(monthlyOp, 14)).toBe(true);
    expect(engine.isOverpaymentApplicable(monthlyOp, 48)).toBe(true);
    expect(engine.isOverpaymentApplicable(monthlyOp, 49)).toBe(false);
    
    // Test quarterly recurring
    expect(engine.isOverpaymentApplicable(quarterlyOp, 13)).toBe(true);
    expect(engine.isOverpaymentApplicable(quarterlyOp, 14)).toBe(false);
    expect(engine.isOverpaymentApplicable(quarterlyOp, 16)).toBe(true);
    
    // Test annual recurring
    expect(engine.isOverpaymentApplicable(annualOp, 13)).toBe(true);
    expect(engine.isOverpaymentApplicable(annualOp, 14)).toBe(false);
    expect(engine.isOverpaymentApplicable(annualOp, 25)).toBe(true);
    
    // Test one-time
    expect(engine.isOverpaymentApplicable(oneTimeOp, 12)).toBe(false);
    expect(engine.isOverpaymentApplicable(oneTimeOp, 13)).toBe(true);
    expect(engine.isOverpaymentApplicable(oneTimeOp, 14)).toBe(false);
  });
  
  test('applyOverpayment with reduceTerm effect shortens the loan', async () => {
    const schedule = createSampleSchedule(120);
    const overpaymentAmount = 10000;
    const afterPayment = 24;
    
    const result = await engine.applyOverpayment(
      schedule, 
      overpaymentAmount, 
      afterPayment, 
      'reduceTerm'
    );
    
    // Original total payments would be 120
    expect(result.amortizationSchedule.length).toBeLessThan(120);
    
    // Payment amount should remain the same
    expect(result.monthlyPayment).toBe(1000);
    
    // Check if the overpayment is marked
    const overpaymentMonth = result.amortizationSchedule[afterPayment - 1];
    expect(overpaymentMonth.isOverpayment).toBe(true);
    expect(overpaymentMonth.overpaymentAmount).toBe(overpaymentAmount);
    
    // Final balance should be 0
    const lastMonth = result.amortizationSchedule[
      result.amortizationSchedule.length - 1
    ];
    expect(lastMonth.balance).toBe(0);
  });
  
  test('applyOverpayment with reducePayment effect lowers the payment', () => {
    const schedule = createSampleSchedule(120);
    const overpaymentAmount = 10000;
    const afterPayment = 24;
    
    const result = engine.applyOverpayment(
      schedule, 
      overpaymentAmount, 
      afterPayment, 
      'reducePayment'
    );
    
    // Schedule length should remain the same
    expect(result.amortizationSchedule.length).toBe(120);
    
    // Payment amount should be lower
    expect(result.monthlyPayment).toBeLessThan(1000);
    
    // Check if the overpayment is marked
    const overpaymentMonth = result.amortizationSchedule[afterPayment - 1];
    expect(overpaymentMonth.isOverpayment).toBe(true);
    expect(overpaymentMonth.overpaymentAmount).toBe(overpaymentAmount);
    
    // Final balance should be 0
    const lastMonth = result.amortizationSchedule[
      result.amortizationSchedule.length - 1
    ];
    expect(lastMonth.balance).toBe(0);
  });
});

describe('Basic Mortgage Calculation Validation', () => {
  // Test B1: Standard Fixed-Rate Mortgage Calculation
  test('B1: Standard Fixed-Rate Mortgage Calculation', async () => {
    // Inputs
    const principal = 300000;
    const termYears = 30;
    const interestRate = 4.5;
    
    // Calculate
    const expectedMonthlyPayment = 1520;
    const expectedTotalInterest = 247219.93;
    const expectedTotalPaid = principal + expectedTotalInterest;
    
    // Get calculation results
    const results = await calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    
    // Validate monthly payment
    expect(results.monthlyPayment).toBeCloseTo(expectedMonthlyPayment, 0);
    
    // Validate total interest paid
    expect(results.totalInterest).toBeCloseTo(expectedTotalInterest, 0);
    
    // Validate total amount paid
    const calculatedTotalPaid = principal + results.totalInterest;
    expect(calculatedTotalPaid).toBeCloseTo(expectedTotalPaid, 0);
    
    // Validate number of payments
    expect(results.amortizationSchedule.length).toBe(termYears * 12);
    
    // Validate last payment pays off the loan
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBeCloseTo(0, 0);
  });

  // Test B3: Short-Term High-Interest Loan
  test('B3: Short-Term High-Interest Loan', async () => {
    // Inputs
    const principal = 50000;
    const termYears = 5;
    const interestRate = 12;
    
    // Expected values
    const expectedMonthlyPayment = 1112.22;
    const expectedTotalInterest = 16733.20;
    const expectedTotalPaid = principal + expectedTotalInterest;
    
    // Get calculation results
    const results = await calculateLoanDetails(principal, [{ startMonth: 1, interestRate: interestRate }], termYears);
    
    // Validate monthly payment
    expect(results.monthlyPayment).toBeCloseTo(1112, 0);
    
    // Validate total interest paid
    expect(results.totalInterest).toBeCloseTo(16733, 0);
    
    // Validate total amount paid
    const calculatedTotalPaid = principal + results.totalInterest;
    expect(calculatedTotalPaid).toBeCloseTo(expectedTotalPaid, 0);
    
    // Validate number of payments
    expect(results.amortizationSchedule.length).toBe(termYears * 12);
    
    // Validate last payment pays off the loan
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance).toBeCloseTo(0, 0);
  });

  // Test E3: Near-Zero Interest Rate
  test('E3: Near-Zero Interest Rate', async () => {
    const principal = 300000;
    const termYears = 30;
    const interestRate = 0.1; // 0.1%
    
    // Calculate pure principal-only payment as baseline
    const baselinePayment = roundToCents(principal / (termYears * 12));
    
    const results = await calculateLoanDetails(
      principal, 
      [{ startMonth: 1, interestRate: interestRate }], 
      termYears
    );
    
    // For very low rates, payment should be very close to principal-only payment
    const maxAllowedDifference = baselinePayment * 0.002; // 0.2% tolerance
    const paymentDifference = Math.abs(results.monthlyPayment - baselinePayment);
    
    expect(paymentDifference).toBeLessThan(maxAllowedDifference);
    
    // Fix: More accurate approximation for very low rates
    // For 0.1% annual rate, total interest should be approximately:
    // principal * (interestRate/100) * termYears * 0.52
    // The 0.52 factor accounts for declining balance
    const expectedMaxInterest = principal * (interestRate/100) * termYears * 0.52;
    expect(results.totalInterest).toBeLessThan(expectedMaxInterest);
    
    // Validate term and final balance
    expect(results.amortizationSchedule.length).toBe(termYears * 12);
    expect(results.amortizationSchedule[results.amortizationSchedule.length - 1].balance)
      .toBeCloseTo(0, 0);
  });
  
  test('E4: Interest Rate Threshold Behavior', () => {
    const principal = 100000;
    const termYears = 10;
    
    // Test various small interest rates
    const rates = [0, 0.001, 0.01, 0.1, 0.5];
    
    rates.forEach(rate => {
      const results = calculateLoanDetails(
        principal,
        [{ startMonth: 1, interestRate: rate }],
        termYears
      );
      
      // Round both values to same precision before comparison
      const minimumPayment = roundToCents(principal / (termYears * 12));
      const actualPayment = roundToCents(results.monthlyPayment);
      
      // Use more appropriate comparison for floating point
      expect(actualPayment).toBeGreaterThanOrEqual(minimumPayment - 0.01);
      
      // For very low rates, check payment isn't too high
      if (rate < 0.1) {
        expect(actualPayment).toBeLessThanOrEqual(minimumPayment * 1.05);
      }
    });
  });
});