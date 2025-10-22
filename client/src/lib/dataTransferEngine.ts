import { LoanDetails, CalculationResults, ExportOptions, ScenarioComparison, PaymentData } from './types';
import { formatCurrency } from './formatters';

/**
 * Export loan data to CSV format
 */
export function exportToCSV(
  loanDetails: LoanDetails,
  results: CalculationResults,
  options: ExportOptions,
  comparisonData?: ScenarioComparison
): string {
  let csv = '';
  const currency = loanDetails.currency || 'USD';
  
  // Add summary
  if (options.includeSummary) {
    csv += 'Loan Summary\n';
    csv += `Principal,${formatCurrency(loanDetails.principal, undefined, currency)}\n`;
    csv += `Interest Rate,${loanDetails.interestRatePeriods[0].interestRate}%\n`;
    csv += `Loan Term,${loanDetails.loanTerm} years\n`;
    csv += `Monthly Payment,${formatCurrency(results.monthlyPayment, undefined, currency)}\n`;
    csv += `Total Interest,${formatCurrency(results.totalInterest, undefined, currency)}\n`;
    csv += `Total Cost,${formatCurrency(loanDetails.principal + results.totalInterest, undefined, currency)}\n`;
    
    if (results.oneTimeFees || results.recurringFees) {
      csv += `One-time Fees,${formatCurrency(results.oneTimeFees || 0, undefined, currency)}\n`;
      csv += `Recurring Fees,${formatCurrency(results.recurringFees || 0, undefined, currency)}\n`;
      csv += `APR,${results.apr || 0}%\n`;
    }
    
    csv += '\n';
  }
  
  // Add amortization schedule
  if (options.includeAmortizationSchedule) {
    csv += 'Amortization Schedule\n';
    
    // Determine which columns to include
    const columns = options.selectedColumns || [
      'payment', 'date', 'monthlyPayment', 'principalPayment', 
      'interestPayment', 'balance', 'totalInterest'
    ];
    
    // Create header row
    const headerMap: Record<string, string> = {
      'payment': 'Payment',
      'date': 'Date',
      'monthlyPayment': 'Payment Amount',
      'principalPayment': 'Principal',
      'interestPayment': 'Interest',
      'balance': 'Balance',
      'totalInterest': 'Total Interest',
      'overpaymentAmount': 'Overpayment',
      'fees': 'Fees'
    };
    
    csv += columns.map(col => headerMap[col] || col).join(',') + '\n';
    
    // Filter schedule based on date range if specified
    let scheduleToExport = results.amortizationSchedule;
    if (options.dateRange) {
      scheduleToExport = scheduleToExport.filter(
        payment => payment.payment >= options.dateRange!.startMonth && 
                  payment.payment <= options.dateRange!.endMonth
      );
    }
    
    // Add data rows
    scheduleToExport.forEach(payment => {
      const date = payment.paymentDate ? 
        payment.paymentDate.toISOString().split('T')[0] : 
        '';
      
      const row = columns.map(col => {
        switch(col) {
          case 'payment': return payment.payment;
          case 'date': return date;
          case 'monthlyPayment': return formatCurrency(payment.monthlyPayment, undefined, currency);
          case 'principalPayment': return formatCurrency(payment.principalPayment, undefined, currency);
          case 'interestPayment': return formatCurrency(payment.interestPayment, undefined, currency);
          case 'balance': return formatCurrency(payment.balance, undefined, currency);
          case 'totalInterest': return formatCurrency(payment.totalInterest, undefined, currency);
          case 'overpaymentAmount': return formatCurrency(payment.overpaymentAmount || 0, undefined, currency);
          case 'fees': return formatCurrency(payment.fees || 0, undefined, currency);
          default: return '';
        }
      });
      
      csv += row.join(',') + '\n';
    });
  }
  
  // Add comparison data if available and requested
  if (options.includeComparisonData && comparisonData) {
    csv += '\nScenario Comparison\n';
    csv += 'Scenario,Monthly Payment,Total Interest,Term,Total Cost\n';
    
    comparisonData.scenarios.forEach(scenario => {
      const scenarioCurrency = scenario.loanDetails.currency || currency;
      const totalCost = scenario.loanDetails.principal + 
        scenario.results.totalInterest + 
        (scenario.results.oneTimeFees || 0) + 
        (scenario.results.recurringFees || 0);
        
      csv += `${scenario.name},${formatCurrency(scenario.results.monthlyPayment, undefined, scenarioCurrency)},`;
      csv += `${formatCurrency(scenario.results.totalInterest, undefined, scenarioCurrency)},`;
      csv += `${scenario.results.actualTerm},`;
      csv += `${formatCurrency(totalCost, undefined, scenarioCurrency)}\n`;
    });
    
    if (comparisonData.differences.length > 0) {
      csv += '\nDifferences\n';
      csv += 'Monthly Payment Difference,Total Interest Difference,Term Difference,Total Cost Difference\n';
      
      const diff = comparisonData.differences[0];
      csv += `${formatCurrency(diff.monthlyPaymentDiff, undefined, currency)},`;
      csv += `${formatCurrency(diff.totalInterestDiff, undefined, currency)},`;
      csv += `${diff.termDiff},`;
      csv += `${formatCurrency(diff.totalCostDiff, undefined, currency)}\n`;
    }
    
    if (comparisonData.breakEvenPoint) {
      csv += `\nBreak-even Point,Month ${comparisonData.breakEvenPoint}\n`;
    }
  }
  
  return csv;
}

/**
 * Export loan data to JSON format
 */
export function exportToJSON(
  loanDetails: LoanDetails,
  results: CalculationResults,
  options: ExportOptions,
  comparisonData?: ScenarioComparison
): string {
  const currency = loanDetails.currency || 'USD';
  const exportData: any = {
    loanDetails: { ...loanDetails },
    summary: {
      monthlyPayment: results.monthlyPayment,
      totalInterest: results.totalInterest,
      totalCost: loanDetails.principal + results.totalInterest,
      originalTerm: results.originalTerm,
      actualTerm: results.actualTerm,
      formattedValues: {
        monthlyPayment: formatCurrency(results.monthlyPayment, undefined, currency),
        totalInterest: formatCurrency(results.totalInterest, undefined, currency),
        totalCost: formatCurrency(loanDetails.principal + results.totalInterest, undefined, currency)
      }
    }
  };
  
  if (results.oneTimeFees || results.recurringFees) {
    exportData.summary.oneTimeFees = results.oneTimeFees || 0;
    exportData.summary.recurringFees = results.recurringFees || 0;
    exportData.summary.apr = results.apr || 0;
    exportData.summary.formattedValues.oneTimeFees = formatCurrency(results.oneTimeFees || 0, undefined, currency);
    exportData.summary.formattedValues.recurringFees = formatCurrency(results.recurringFees || 0, undefined, currency);
  }
  
  if (options.includeAmortizationSchedule) {
    // Filter schedule based on date range if specified
    let scheduleToExport = results.amortizationSchedule;
    if (options.dateRange) {
      scheduleToExport = scheduleToExport.filter(
        payment => payment.payment >= options.dateRange!.startMonth && 
                  payment.payment <= options.dateRange!.endMonth
      );
    }
    
    // Add formatted values to each payment
    scheduleToExport = scheduleToExport.map(payment => ({
      ...payment,
      formattedValues: {
        monthlyPayment: formatCurrency(payment.monthlyPayment, undefined, currency),
        principalPayment: formatCurrency(payment.principalPayment, undefined, currency),
        interestPayment: formatCurrency(payment.interestPayment, undefined, currency),
        balance: formatCurrency(payment.balance, undefined, currency),
        totalInterest: formatCurrency(payment.totalInterest, undefined, currency),
        overpaymentAmount: payment.overpaymentAmount ? formatCurrency(payment.overpaymentAmount, undefined, currency) : '',
        fees: payment.fees ? formatCurrency(payment.fees, undefined, currency) : ''
      }
    }));
    
    // Filter columns if specified
    if (options.selectedColumns && options.selectedColumns.length > 0) {
      scheduleToExport = scheduleToExport.map(payment => {
        const filteredPayment: any = {};
        options.selectedColumns!.forEach(col => {
          if (col in payment) {
            filteredPayment[col] = payment[col as keyof typeof payment];
          }
        });
        // Always include formatted values for selected columns
        filteredPayment.formattedValues = {};
        options.selectedColumns!.forEach(col => {
          if (col in payment && payment.formattedValues && payment.formattedValues[col as keyof typeof payment.formattedValues]) {
            filteredPayment.formattedValues[col] = payment.formattedValues[col as keyof typeof payment.formattedValues];
          }
        });
        return filteredPayment;
      });
    }
    
    exportData.amortizationSchedule = scheduleToExport;
  }
  
  if (options.includeComparisonData && comparisonData) {
    exportData.comparison = {
      ...comparisonData,
      scenarios: comparisonData.scenarios.map(scenario => ({
        ...scenario,
        formattedValues: {
          monthlyPayment: formatCurrency(scenario.results.monthlyPayment, undefined, scenario.loanDetails.currency || currency),
          totalInterest: formatCurrency(scenario.results.totalInterest, undefined, scenario.loanDetails.currency || currency),
          totalCost: formatCurrency(
            scenario.loanDetails.principal + 
            scenario.results.totalInterest + 
            (scenario.results.oneTimeFees || 0) + 
            (scenario.results.recurringFees || 0),
            undefined,
            scenario.loanDetails.currency || currency
          )
        }
      }))
    };
  }
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate PDF export
 * This is a placeholder implementation that returns a simple PDF blob
 * In a real implementation, you would use a PDF generation library like jsPDF
 */
export async function exportToPDF(
  loanDetails: LoanDetails,
  results: CalculationResults,
  options: ExportOptions,
  comparisonData?: ScenarioComparison
): Promise<Blob> {
  const currency = loanDetails.currency || 'USD';
  let content = '';
  
  if (options.includeSummary) {
    content += 'LOAN SUMMARY\n\n';
    content += `Principal: ${formatCurrency(loanDetails.principal, undefined, currency)}\n`;
    content += `Interest Rate: ${loanDetails.interestRatePeriods[0].interestRate}%\n`;
    content += `Loan Term: ${loanDetails.loanTerm} years\n`;
    content += `Monthly Payment: ${formatCurrency(results.monthlyPayment, undefined, currency)}\n`;
    content += `Total Interest: ${formatCurrency(results.totalInterest, undefined, currency)}\n`;
    content += `Total Cost: ${formatCurrency(loanDetails.principal + results.totalInterest, undefined, currency)}\n\n`;
  }
  
  if (options.includeAmortizationSchedule) {
    content += 'AMORTIZATION SCHEDULE\n\n';
    content += 'Payment | Date | Amount | Principal | Interest | Balance | Total Interest\n';
    content += '--------|------|--------|-----------|----------|---------|---------------\n';
    
    // Filter schedule based on date range if specified
    let scheduleToExport = results.amortizationSchedule;
    if (options.dateRange) {
      scheduleToExport = scheduleToExport.filter(
        payment => payment.payment >= options.dateRange!.startMonth && 
                  payment.payment <= options.dateRange!.endMonth
      );
    }
    
    // Limit to first 50 payments to keep the PDF manageable
    const limitedSchedule = scheduleToExport.slice(0, 50);
    
    limitedSchedule.forEach(payment => {
      const date = payment.paymentDate ? 
        payment.paymentDate.toISOString().split('T')[0] : 
        'N/A';
      
      content += `${payment.payment} | ${date} | ${formatCurrency(payment.monthlyPayment, undefined, currency)} | `;
      content += `${formatCurrency(payment.principalPayment, undefined, currency)} | ${formatCurrency(payment.interestPayment, undefined, currency)} | `;
      content += `${formatCurrency(payment.balance, undefined, currency)} | ${formatCurrency(payment.totalInterest, undefined, currency)}\n`;
    });
    
    if (scheduleToExport.length > 50) {
      content += '\n... (truncated for PDF size) ...\n';
    }
  }
  
  if (options.includeComparisonData && comparisonData) {
    content += '\nSCENARIO COMPARISON\n\n';
    content += 'Scenario | Monthly Payment | Total Interest | Term | Total Cost\n';
    content += '---------|----------------|---------------|------|------------\n';
    
    comparisonData.scenarios.forEach(scenario => {
      const scenarioCurrency = scenario.loanDetails.currency || currency;
      const totalCost = scenario.loanDetails.principal + 
        scenario.results.totalInterest + 
        (scenario.results.oneTimeFees || 0) + 
        (scenario.results.recurringFees || 0);
        
      content += `${scenario.name} | ${formatCurrency(scenario.results.monthlyPayment, undefined, scenarioCurrency)} | `;
      content += `${formatCurrency(scenario.results.totalInterest, undefined, scenarioCurrency)} | ${scenario.results.actualTerm} years | `;
      content += `${formatCurrency(totalCost, undefined, scenarioCurrency)}\n`;
    });
  }
  
  return new Blob([content], { type: 'application/pdf' });
}

/**
 * Import loan data from JSON format
 * Parses a JSON string and extracts loan details and calculation results
 */
export function importFromJSON(jsonData: string): {
  loanDetails: LoanDetails;
  results?: Partial<CalculationResults>;
} {
  try {
    const parsed = JSON.parse(jsonData);
    
    // Validate the structure
    if (!parsed.loanDetails) {
      throw new Error('Invalid JSON format: missing loanDetails');
    }
    
    // Convert date strings to Date objects
    const loanDetails: LoanDetails = {
      ...parsed.loanDetails,
      startDate: new Date(parsed.loanDetails.startDate),
      overpaymentPlans: (parsed.loanDetails.overpaymentPlans || []).map((plan: any) => ({
        ...plan,
        startDate: new Date(plan.startDate),
        endDate: plan.endDate ? new Date(plan.endDate) : undefined
      }))
    };
    
    // Extract calculation results if available
    let results: Partial<CalculationResults> | undefined;
    if (parsed.summary) {
      results = {
        monthlyPayment: parsed.summary.monthlyPayment,
        totalInterest: parsed.summary.totalInterest,
        originalTerm: parsed.summary.originalTerm,
        actualTerm: parsed.summary.actualTerm,
        oneTimeFees: parsed.summary.oneTimeFees,
        recurringFees: parsed.summary.recurringFees,
        apr: parsed.summary.apr
      };
      
      // Extract amortization schedule if available
      if (parsed.amortizationSchedule && Array.isArray(parsed.amortizationSchedule)) {
        const amortizationSchedule: PaymentData[] = parsed.amortizationSchedule.map((payment: any) => ({
          ...payment,
          paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : undefined
        }));
        
        results.amortizationSchedule = amortizationSchedule;
      }
    }
    
    return { loanDetails, results };
  } catch (error: any) {
    throw new Error(`Failed to import JSON data: ${error.message}`);
  }
}

/**
 * Helper function to parse values from CSV, handling currency symbols, commas, percentages, etc.
 */
function parseValue(value: string): number | string | Date | undefined {
  if (!value || value.trim() === '') return undefined;
  
  // Try to parse as currency (remove currency symbols and commas)
  if (/^[$€£]/.test(value) || value.includes(',')) {
    const cleanValue = value.replace(/[$€£,]/g, '');
    const num = parseFloat(cleanValue);
    if (!isNaN(num)) return num;
  }
  
  // Try to parse as percentage
  if (value.endsWith('%')) {
    const num = parseFloat(value.replace('%', ''));
    if (!isNaN(num)) return num;
  }
  
  // Try to parse as date
  if (value.includes('-') || value.includes('/')) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try to parse as number
  const num = parseFloat(value);
  if (!isNaN(num)) return num;
  
  // Return as string
  return value.trim();
}

/**
 * Helper function to find a section in the CSV by checking for various possible headers
 */
function findSectionIndex(lines: string[], possibleHeaders: string[]): number {
  return lines.findIndex(line =>
    possibleHeaders.some(header =>
      line.toLowerCase().includes(header.toLowerCase())
    )
  );
}

/**
 * Helper function to calculate principal from monthly payment, interest rate, and term
 */
function calculatePrincipalFromPayment(monthlyPayment: number, interestRate: number, termYears: number): number {
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = termYears * 12;
  return monthlyPayment * (1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate;
}

/**
 * Import loan data from CSV format
 * Parses a CSV string and extracts loan details
 * Note: CSV import is limited compared to JSON as it doesn't contain all the structured data
 */
export function importFromCSV(csvData: string): {
  loanDetails: LoanDetails;
  results?: Partial<CalculationResults>;
} {
  try {
    // Basic validation to check if it's a CSV format
    if (!csvData.includes(',') || !csvData.includes('\n')) {
      throw new Error('Invalid CSV format');
    }
    
    // Parse CSV data
    const lines = csvData.split('\n').map(line => line.trim()).filter(line => line);
    
    // Field mappings for flexibility
    const fieldMappings: Record<string, string> = {
      // Summary section mappings
      'Principal': 'principal',
      'Interest Rate': 'interestRate',
      'Loan Term': 'loanTerm',
      'Monthly Payment': 'monthlyPayment',
      'Total Interest': 'totalInterest',
      'Total Cost': 'totalCost',
      'One-time Fees': 'oneTimeFees',
      'Recurring Fees': 'recurringFees',
      'APR': 'apr',
    };
    
    // Extract loan details from summary section
    const loanDetails: Partial<LoanDetails> = {
      name: "Imported Calculation",
      overpaymentPlans: [],
      startDate: new Date(),
      interestRatePeriods: [{ startMonth: 0, interestRate: 0 }]
    };
    
    // Default values for results
    const results: Partial<CalculationResults> = {};
    
    // Find the Loan Summary section (try different possible headers)
    const summaryStartIndex = findSectionIndex(lines, ['Loan Summary', 'Summary']);
    
    if (summaryStartIndex >= 0) {
      // Process each line in the summary section
      for (let i = summaryStartIndex + 1; i < lines.length; i++) {
        if (lines[i] === '') break; // End of summary section
        
        const parts = lines[i].split(',');
        if (parts.length < 2) continue;
        
        const key = parts[0].trim();
        const value = parts.slice(1).join(',').trim(); // Join remaining parts in case value contains commas
        
        if (!key || !value) continue;
        
        const parsedValue = parseValue(value);
        
        // Map to the appropriate field based on the key
        if (key === 'Principal' && typeof parsedValue === 'number') {
          loanDetails.principal = parsedValue;
        }
        else if (key === 'Interest Rate' && typeof parsedValue === 'number') {
          loanDetails.interestRatePeriods = [{
            startMonth: 0,
            interestRate: parsedValue
          }];
        }
        else if (key === 'Loan Term' && typeof parsedValue === 'number' || typeof parsedValue === 'string') {
          // Handle "30 years" format
          if (typeof parsedValue === 'string') {
            const termParts = parsedValue.split(' ');
            loanDetails.loanTerm = parseInt(termParts[0], 10);
          } else {
            loanDetails.loanTerm = parsedValue;
          }
        }
        else if (key === 'Monthly Payment' && typeof parsedValue === 'number') {
          results.monthlyPayment = parsedValue;
        }
        else if (key === 'Total Interest' && typeof parsedValue === 'number') {
          results.totalInterest = parsedValue;
        }
        else if (key === 'One-time Fees' && typeof parsedValue === 'number') {
          results.oneTimeFees = parsedValue;
        }
        else if (key === 'Recurring Fees' && typeof parsedValue === 'number') {
          results.recurringFees = parsedValue;
        }
        else if (key === 'APR' && typeof parsedValue === 'number') {
          results.apr = parsedValue;
        }
        // Add more mappings as needed
      }
    }
    
    // Try to infer missing values
    if (!loanDetails.principal && results.monthlyPayment &&
        loanDetails.interestRatePeriods &&
        loanDetails.interestRatePeriods[0].interestRate &&
        loanDetails.loanTerm) {
      // Calculate principal from monthly payment, interest rate, and term
      loanDetails.principal = calculatePrincipalFromPayment(
        results.monthlyPayment,
        loanDetails.interestRatePeriods[0].interestRate,
        loanDetails.loanTerm
      );
    }
    
    // Set reasonable defaults for missing required fields
    if (!loanDetails.loanTerm) loanDetails.loanTerm = 30; // Default to 30 years
    if (loanDetails.interestRatePeriods &&
        !loanDetails.interestRatePeriods[0].interestRate) {
      loanDetails.interestRatePeriods[0].interestRate = 4.5; // Default to 4.5%
    }
    
    // Validate we have enough information
    if (!loanDetails.principal) {
      // Use the expected error message for the test
      throw new Error('Missing required loan details in CSV');
    }
    
    // Find the Amortization Schedule section
    const scheduleStartIndex = lines.findIndex(line => line === 'Amortization Schedule');
    if (scheduleStartIndex >= 0 && scheduleStartIndex + 2 < lines.length) {
      // Get headers
      const headers = lines[scheduleStartIndex + 1].split(',');
      
      // Process schedule rows
      const amortizationSchedule: PaymentData[] = [];
      
      for (let i = scheduleStartIndex + 2; i < lines.length; i++) {
        if (lines[i] === '') break; // End of schedule section
        
        const values = lines[i].split(',');
        if (values.length !== headers.length) continue;
        
        const payment: Partial<PaymentData> = {
          isOverpayment: false,
          overpaymentAmount: 0,
          totalPayment: 0
        };
        
        // Map values to payment properties based on headers
        headers.forEach((header, index) => {
          const value = values[index];
          if (!value) return;
          
          const parsedValue = parseValue(value);
          
          switch (header) {
            case 'Payment':
              if (typeof parsedValue === 'number') {
                payment.payment = parsedValue;
              }
              break;
            case 'Date':
              if (parsedValue instanceof Date) {
                payment.paymentDate = parsedValue;
              } else if (typeof parsedValue === 'string') {
                payment.paymentDate = new Date(parsedValue);
              }
              break;
            case 'Payment Amount':
              if (typeof parsedValue === 'number') {
                payment.monthlyPayment = parsedValue;
              }
              break;
            case 'Principal':
              if (typeof parsedValue === 'number') {
                payment.principalPayment = parsedValue;
              }
              break;
            case 'Interest':
              if (typeof parsedValue === 'number') {
                payment.interestPayment = parsedValue;
              }
              break;
            case 'Balance':
              if (typeof parsedValue === 'number') {
                payment.balance = parsedValue;
              }
              break;
            case 'Total Interest':
              if (typeof parsedValue === 'number') {
                payment.totalInterest = parsedValue;
              }
              break;
            case 'Overpayment':
              if (typeof parsedValue === 'number') {
                payment.overpaymentAmount = parsedValue;
                payment.isOverpayment = parsedValue > 0;
              }
              break;
            case 'Fees':
              if (typeof parsedValue === 'number') {
                payment.fees = parsedValue;
              }
              break;
          }
        });
        
        // Calculate totalPayment if not provided
        if (payment.monthlyPayment !== undefined) {
          payment.totalPayment = payment.payment === 1 
            ? payment.monthlyPayment 
            : ((amortizationSchedule[amortizationSchedule.length - 1]?.totalPayment || 0) + payment.monthlyPayment);
        }
        
        amortizationSchedule.push(payment as PaymentData);
      }
      
      if (amortizationSchedule.length > 0) {
        results.amortizationSchedule = amortizationSchedule;
      }
    }
    
    return { 
      loanDetails: loanDetails as LoanDetails,
      results: Object.keys(results).length > 0 ? results : undefined
    };
  } catch (error: any) {
    // If it's not our custom error about missing required fields, wrap it
    if (!error.message.includes('Missing required loan details')) {
      throw new Error(`Failed to import CSV data: ${error.message || 'Unknown error'}`);
    } else {
      throw error; // Rethrow our custom errors
    }
  }
}