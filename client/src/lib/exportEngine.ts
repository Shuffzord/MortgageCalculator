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
  
  // Add summary
  if (options.includeSummary) {
    csv += 'Loan Summary\n';
    csv += `Principal,${loanDetails.principal}\n`;
    csv += `Interest Rate,${loanDetails.interestRatePeriods[0].interestRate}%\n`;
    csv += `Loan Term,${loanDetails.loanTerm} years\n`;
    csv += `Monthly Payment,${results.monthlyPayment}\n`;
    csv += `Total Interest,${results.totalInterest}\n`;
    csv += `Total Cost,${loanDetails.principal + results.totalInterest}\n`;
    
    if (results.oneTimeFees || results.recurringFees) {
      csv += `One-time Fees,${results.oneTimeFees || 0}\n`;
      csv += `Recurring Fees,${results.recurringFees || 0}\n`;
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
          case 'monthlyPayment': return payment.monthlyPayment;
          case 'principalPayment': return payment.principalPayment;
          case 'interestPayment': return payment.interestPayment;
          case 'balance': return payment.balance;
          case 'totalInterest': return payment.totalInterest;
          case 'overpaymentAmount': return payment.overpaymentAmount;
          case 'fees': return payment.fees || 0;
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
      const totalCost = scenario.loanDetails.principal + 
        scenario.results.totalInterest + 
        (scenario.results.oneTimeFees || 0) + 
        (scenario.results.recurringFees || 0);
        
      csv += `${scenario.name},${scenario.results.monthlyPayment},${scenario.results.totalInterest},${scenario.results.actualTerm},${totalCost}\n`;
    });
    
    if (comparisonData.differences.length > 0) {
      csv += '\nDifferences\n';
      csv += 'Monthly Payment Difference,Total Interest Difference,Term Difference,Total Cost Difference\n';
      
      const diff = comparisonData.differences[0];
      csv += `${diff.monthlyPaymentDiff},${diff.totalInterestDiff},${diff.termDiff},${diff.totalCostDiff}\n`;
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
  const exportData: any = {
    loanDetails: { ...loanDetails },
    summary: {
      monthlyPayment: results.monthlyPayment,
      totalInterest: results.totalInterest,
      totalCost: loanDetails.principal + results.totalInterest,
      originalTerm: results.originalTerm,
      actualTerm: results.actualTerm
    }
  };
  
  if (results.oneTimeFees || results.recurringFees) {
    exportData.summary.oneTimeFees = results.oneTimeFees || 0;
    exportData.summary.recurringFees = results.recurringFees || 0;
    exportData.summary.apr = results.apr || 0;
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
    
    // Filter columns if specified
    if (options.selectedColumns && options.selectedColumns.length > 0) {
      scheduleToExport = scheduleToExport.map(payment => {
        const filteredPayment: any = {};
        options.selectedColumns!.forEach(col => {
          if (col in payment) {
            filteredPayment[col] = (payment as any)[col];
          }
        });
        return filteredPayment;
      });
    }
    
    exportData.amortizationSchedule = scheduleToExport;
  }
  
  if (options.includeComparisonData && comparisonData) {
    exportData.comparison = comparisonData;
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
  // This is a placeholder implementation
  // In a real implementation, you would use a PDF generation library
  
  // For now, we'll create a simple text representation and convert it to a PDF blob
  let content = '';
  
  if (options.includeSummary) {
    content += 'LOAN SUMMARY\n\n';
    content += `Principal: ${formatCurrency(loanDetails.principal)}\n`;
    content += `Interest Rate: ${loanDetails.interestRatePeriods[0].interestRate}%\n`;
    content += `Loan Term: ${loanDetails.loanTerm} years\n`;
    content += `Monthly Payment: ${formatCurrency(results.monthlyPayment)}\n`;
    content += `Total Interest: ${formatCurrency(results.totalInterest)}\n`;
    content += `Total Cost: ${formatCurrency(loanDetails.principal + results.totalInterest)}\n\n`;
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
      
      content += `${payment.payment} | ${date} | ${formatCurrency(payment.monthlyPayment)} | `;
      content += `${formatCurrency(payment.principalPayment)} | ${formatCurrency(payment.interestPayment)} | `;
      content += `${formatCurrency(payment.balance)} | ${formatCurrency(payment.totalInterest)}\n`;
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
      const totalCost = scenario.loanDetails.principal + 
        scenario.results.totalInterest + 
        (scenario.results.oneTimeFees || 0) + 
        (scenario.results.recurringFees || 0);
        
      content += `${scenario.name} | ${formatCurrency(scenario.results.monthlyPayment)} | `;
      content += `${formatCurrency(scenario.results.totalInterest)} | ${scenario.results.actualTerm} years | `;
      content += `${formatCurrency(totalCost)}\n`;
    });
  }
  
  // In a real implementation, you would convert this content to a PDF
  // For now, we'll just return it as a text blob with a PDF mime type
  return new Blob([content], { type: 'application/pdf' });
}