import { LoanDetails, CalculationResults, ExportOptions, ScenarioComparison } from './types';
import { formatCurrency } from './utils';

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
    csv += `Principal,${formatCurrency(loanDetails.principal, 'en-US', currency)}\n`;
    csv += `Interest Rate,${loanDetails.interestRatePeriods[0].interestRate}%\n`;
    csv += `Loan Term,${loanDetails.loanTerm} years\n`;
    csv += `Monthly Payment,${formatCurrency(results.monthlyPayment, 'en-US', currency)}\n`;
    csv += `Total Interest,${formatCurrency(results.totalInterest, 'en-US', currency)}\n`;
    csv += `Total Cost,${formatCurrency(loanDetails.principal + results.totalInterest, 'en-US', currency)}\n`;
    
    if (results.oneTimeFees || results.recurringFees) {
      csv += `One-time Fees,${formatCurrency(results.oneTimeFees || 0, 'en-US', currency)}\n`;
      csv += `Recurring Fees,${formatCurrency(results.recurringFees || 0, 'en-US', currency)}\n`;
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
          case 'monthlyPayment': return formatCurrency(payment.monthlyPayment, 'en-US', currency);
          case 'principalPayment': return formatCurrency(payment.principalPayment, 'en-US', currency);
          case 'interestPayment': return formatCurrency(payment.interestPayment, 'en-US', currency);
          case 'balance': return formatCurrency(payment.balance, 'en-US', currency);
          case 'totalInterest': return formatCurrency(payment.totalInterest, 'en-US', currency);
          case 'overpaymentAmount': return formatCurrency(payment.overpaymentAmount || 0, 'en-US', currency);
          case 'fees': return formatCurrency(payment.fees || 0, 'en-US', currency);
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
        
      csv += `${scenario.name},${formatCurrency(scenario.results.monthlyPayment, 'en-US', scenarioCurrency)},`;
      csv += `${formatCurrency(scenario.results.totalInterest, 'en-US', scenarioCurrency)},`;
      csv += `${scenario.results.actualTerm},`;
      csv += `${formatCurrency(totalCost, 'en-US', scenarioCurrency)}\n`;
    });
    
    if (comparisonData.differences.length > 0) {
      csv += '\nDifferences\n';
      csv += 'Monthly Payment Difference,Total Interest Difference,Term Difference,Total Cost Difference\n';
      
      const diff = comparisonData.differences[0];
      csv += `${formatCurrency(diff.monthlyPaymentDiff, 'en-US', currency)},`;
      csv += `${formatCurrency(diff.totalInterestDiff, 'en-US', currency)},`;
      csv += `${diff.termDiff},`;
      csv += `${formatCurrency(diff.totalCostDiff, 'en-US', currency)}\n`;
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
        monthlyPayment: formatCurrency(results.monthlyPayment, 'en-US', currency),
        totalInterest: formatCurrency(results.totalInterest, 'en-US', currency),
        totalCost: formatCurrency(loanDetails.principal + results.totalInterest, 'en-US', currency)
      }
    }
  };
  
  if (results.oneTimeFees || results.recurringFees) {
    exportData.summary.oneTimeFees = results.oneTimeFees || 0;
    exportData.summary.recurringFees = results.recurringFees || 0;
    exportData.summary.apr = results.apr || 0;
    exportData.summary.formattedValues.oneTimeFees = formatCurrency(results.oneTimeFees || 0, 'en-US', currency);
    exportData.summary.formattedValues.recurringFees = formatCurrency(results.recurringFees || 0, 'en-US', currency);
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
        monthlyPayment: formatCurrency(payment.monthlyPayment, 'en-US', currency),
        principalPayment: formatCurrency(payment.principalPayment, 'en-US', currency),
        interestPayment: formatCurrency(payment.interestPayment, 'en-US', currency),
        balance: formatCurrency(payment.balance, 'en-US', currency),
        totalInterest: formatCurrency(payment.totalInterest, 'en-US', currency),
        overpaymentAmount: payment.overpaymentAmount ? formatCurrency(payment.overpaymentAmount, 'en-US', currency) : '',
        fees: payment.fees ? formatCurrency(payment.fees, 'en-US', currency) : ''
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
          monthlyPayment: formatCurrency(scenario.results.monthlyPayment, 'en-US', scenario.loanDetails.currency || currency),
          totalInterest: formatCurrency(scenario.results.totalInterest, 'en-US', scenario.loanDetails.currency || currency),
          totalCost: formatCurrency(
            scenario.loanDetails.principal + 
            scenario.results.totalInterest + 
            (scenario.results.oneTimeFees || 0) + 
            (scenario.results.recurringFees || 0),
            'en-US',
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
    content += `Principal: ${formatCurrency(loanDetails.principal, 'en-US', currency)}\n`;
    content += `Interest Rate: ${loanDetails.interestRatePeriods[0].interestRate}%\n`;
    content += `Loan Term: ${loanDetails.loanTerm} years\n`;
    content += `Monthly Payment: ${formatCurrency(results.monthlyPayment, 'en-US', currency)}\n`;
    content += `Total Interest: ${formatCurrency(results.totalInterest, 'en-US', currency)}\n`;
    content += `Total Cost: ${formatCurrency(loanDetails.principal + results.totalInterest, 'en-US', currency)}\n\n`;
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
      
      content += `${payment.payment} | ${date} | ${formatCurrency(payment.monthlyPayment, 'en-US', currency)} | `;
      content += `${formatCurrency(payment.principalPayment, 'en-US', currency)} | ${formatCurrency(payment.interestPayment, 'en-US', currency)} | `;
      content += `${formatCurrency(payment.balance, 'en-US', currency)} | ${formatCurrency(payment.totalInterest, 'en-US', currency)}\n`;
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
        
      content += `${scenario.name} | ${formatCurrency(scenario.results.monthlyPayment, 'en-US', scenarioCurrency)} | `;
      content += `${formatCurrency(scenario.results.totalInterest, 'en-US', scenarioCurrency)} | ${scenario.results.actualTerm} years | `;
      content += `${formatCurrency(totalCost, 'en-US', scenarioCurrency)}\n`;
    });
  }
  
  return new Blob([content], { type: 'application/pdf' });
}