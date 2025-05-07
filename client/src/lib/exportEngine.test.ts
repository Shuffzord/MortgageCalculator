import { exportToCSV, exportToJSON, exportToPDF } from './exportEngine';
import { LoanDetails, CalculationResults, ExportOptions, ScenarioComparison } from './types';

describe('Export Engine', () => {
  // Mock data for testing
  const mockLoanDetails: LoanDetails = {
    principal: 200000,
    interestRatePeriods: [{ startMonth: 0, interestRate: 4.5 }],
    loanTerm: 30,
    overpaymentPlans: [],
    startDate: new Date('2025-01-01'),
    name: 'Test Loan',
    currency: 'USD'
  };
  
  const mockResults: CalculationResults = {
    monthlyPayment: 1013.37,
    totalInterest: 164813.42,
    amortizationSchedule: [
      {
        payment: 1,
        monthlyPayment: 1013.37,
        principalPayment: 263.37,
        interestPayment: 750.00,
        balance: 199736.63,
        totalInterest: 750.00,
        totalPayment: 1013.37,
        isOverpayment: false,
        overpaymentAmount: 0,
        paymentDate: new Date('2025-02-01')
      },
      {
        payment: 2,
        monthlyPayment: 1013.37,
        principalPayment: 264.36,
        interestPayment: 749.01,
        balance: 199472.27,
        totalInterest: 1499.01,
        totalPayment: 2026.74,
        isOverpayment: false,
        overpaymentAmount: 0,
        paymentDate: new Date('2025-03-01')
      }
    ],
    yearlyData: [
      {
        year: 1,
        principal: 3245.54,
        interest: 8915.90,
        payment: 12161.44,
        balance: 196754.46,
        totalInterest: 8915.90
      }
    ],
    originalTerm: 30,
    actualTerm: 30
  };
  
  const mockComparisonData: ScenarioComparison = {
    scenarios: [
      {
        id: '1',
        name: 'Scenario 1',
        loanDetails: mockLoanDetails,
        results: mockResults
      },
      {
        id: '2',
        name: 'Scenario 2',
        loanDetails: {
          ...mockLoanDetails,
          interestRatePeriods: [{ startMonth: 0, interestRate: 4.0 }]
        },
        results: {
          ...mockResults,
          monthlyPayment: 954.83,
          totalInterest: 143739.01
        }
      }
    ],
    differences: [
      {
        monthlyPaymentDiff: 58.54,
        totalInterestDiff: 21074.41,
        termDiff: 0,
        totalCostDiff: 21074.41
      }
    ],
    breakEvenPoint: 120
  };
  
  const baseOptions: ExportOptions = {
    format: 'csv',
    includeAmortizationSchedule: true,
    includeCharts: false,
    includeSummary: true
  };
  
  test('CSV Export - Basic Functionality', () => {
    const csv = exportToCSV(mockLoanDetails, mockResults, baseOptions);
    
    // Check that CSV contains expected headers and data
    expect(csv).toContain('Loan Summary');
    expect(csv).toContain('Principal,200000');
    expect(csv).toContain('Interest Rate,4.5%');
    expect(csv).toContain('Amortization Schedule');
    expect(csv).toContain('Payment,Date,Payment Amount,Principal,Interest,Balance,Total Interest');
    
    // Check that it contains data from the first payment
    expect(csv).toContain('1,2025-02-01,1013.37,263.37,750,199736.63,750');
  });
  
  test('CSV Export - With Comparison Data', () => {
    const options = { ...baseOptions, includeComparisonData: true };
    const csv = exportToCSV(mockLoanDetails, mockResults, options, mockComparisonData);
    
    // Check that CSV contains comparison data
    expect(csv).toContain('Scenario Comparison');
    expect(csv).toContain('Scenario 1');
    expect(csv).toContain('Scenario 2');
    expect(csv).toContain('Differences');
    expect(csv).toContain('Break-even Point');
  });
  
  test('CSV Export - With Date Range', () => {
    const options = { 
      ...baseOptions, 
      dateRange: { startMonth: 2, endMonth: 2 } 
    };
    
    const csv = exportToCSV(mockLoanDetails, mockResults, options);
    
    // Should only include the second payment (payment #2)
    expect(csv).toContain('2,2025-03-01');
    expect(csv).not.toContain('1,2025-02-01');
  });
  
  test('JSON Export - Basic Functionality', () => {
    const json = exportToJSON(mockLoanDetails, mockResults, baseOptions);
    const parsed = JSON.parse(json);
    
    // Check structure and content
    expect(parsed).toHaveProperty('loanDetails');
    expect(parsed).toHaveProperty('summary');
    expect(parsed).toHaveProperty('amortizationSchedule');
    
    expect(parsed.loanDetails.principal).toBe(200000);
    expect(parsed.summary.monthlyPayment).toBe(1013.37);
    expect(parsed.amortizationSchedule.length).toBe(2);
  });
  
  test('JSON Export - With Selected Columns', () => {
    const options = { 
      ...baseOptions, 
      selectedColumns: ['payment', 'monthlyPayment', 'balance'] 
    };
    
    const json = exportToJSON(mockLoanDetails, mockResults, options);
    const parsed = JSON.parse(json);
    
    // Check that only selected columns are included
    const firstPayment = parsed.amortizationSchedule[0];
    expect(firstPayment).toHaveProperty('payment');
    expect(firstPayment).toHaveProperty('monthlyPayment');
    expect(firstPayment).toHaveProperty('balance');
    expect(firstPayment).not.toHaveProperty('principalPayment');
    expect(firstPayment).not.toHaveProperty('interestPayment');
  });
  
  test('PDF Export - Returns Blob', async () => {
    const pdfBlob = await exportToPDF(mockLoanDetails, mockResults, baseOptions);
    
    // Check that it returns a Blob with PDF mime type
    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.type).toBe('application/pdf');
  });
});