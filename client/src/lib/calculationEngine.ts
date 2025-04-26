import { 
  CalculationResults, 
  PaymentData,
  OverpaymentDetails, 
  YearlyData, 
  CalculationPeriod, 
  LoanDetails 
} from "./types";
import { validateInputs } from "./validation";
import { calculateMonthlyPayment, generateAmortizationSchedule, formatCurrency } from "./utils";
import { convertLegacySchedule } from "./mortgage-calculator";

// Re-export formatCurrency from utils to maintain backwards compatibility
export { formatCurrency };

/**
 * Calculate loan details and generate the amortization schedule
 * @param principal Loan principal amount
 * @param interestRate Annual interest rate (percentage)
 * @param loanTerm Loan term in years
 * @param overpaymentPlan Optional overpayment details
 * @returns Calculation results with payment details and amortization schedule
 */
export function calculateLoanDetails(
  principal: number,
  interestRate: number,
  loanTerm: number,
  overpaymentPlan?: OverpaymentDetails
): CalculationResults {
  // Validate inputs
  validateInputs(principal, interestRate, loanTerm, overpaymentPlan);
  
  // Generate amortization schedule
  const schedule = generateAmortizationSchedule(
    principal, 
    interestRate, 
    loanTerm,
    overpaymentPlan
  );
  
  // Convert to PaymentData format using our conversion helper
  const paymentData: PaymentData[] = schedule.map(item => {
    // Use the shared conversion function
    const converted = convertLegacySchedule(item);
    return {
      ...converted,
      // Ensure required fields are non-undefined
      payment: converted.payment || 0,
      balance: converted.balance || 0,
      overpaymentAmount: 0, // Set default value, will be updated if there's an overpayment
      totalInterest: 0, // Will be calculated below
      totalPayment: converted.monthlyPayment || converted.totalPayment || 0
    };
  });
  
  // Calculate cumulative interest
  let cumulativeInterest = 0;
  for (let i = 0; i < paymentData.length; i++) {
    cumulativeInterest += paymentData[i].interestPayment;
    paymentData[i].totalInterest = cumulativeInterest;
  }
  
  // Calculate yearly data for summary view
  const yearlyData = aggregateYearlyData(paymentData);
  
  return {
    monthlyPayment: paymentData[0].monthlyPayment,
    totalInterest: cumulativeInterest,
    amortizationSchedule: paymentData,
    yearlyData: yearlyData,
    originalTerm: loanTerm,
    actualTerm: paymentData.length / 12
  };
}

/**
 * Calculate monthly payment using the formula: M = P[r(1+r)^n]/[(1+r)^n-1]
 * Where:
 * M = monthly payment
 * P = principal loan amount
 * r = monthly interest rate (annual rate / 12 / 100)
 * n = number of payments (loan term in years * 12)
 */
function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}


/**
 * Generate a complete amortization schedule for the loan
 */

/**
 * Aggregate monthly payment data into yearly summaries for display
 */
export function aggregateYearlyData(schedule: PaymentData[]): YearlyData[] {
  if (!schedule || schedule.length === 0) {
    return [];
  }

  return schedule.reduce((acc: YearlyData[], month: PaymentData, index: number) => {
    const yearIndex = Math.floor(index / 12);
    
    if (!acc[yearIndex]) {
      acc[yearIndex] = {
        year: yearIndex + 1,
        principal: 0,
        interest: 0,
        payment: 0,
        balance: month.balance,
        totalInterest: 0
      };
    }
    
    acc[yearIndex].principal = roundToCents(acc[yearIndex].principal + month.principalPayment);
    acc[yearIndex].interest = roundToCents(acc[yearIndex].interest + month.interestPayment);
    acc[yearIndex].payment = roundToCents(acc[yearIndex].payment + month.monthlyPayment);
    acc[yearIndex].balance = roundToCents(month.balance);
    acc[yearIndex].totalInterest = roundToCents(acc[yearIndex].totalInterest + month.interestPayment);
    
    return acc;
  }, []);
}


/**
 * Apply a one-time overpayment and recalculate the amortization schedule
 */
export async function applyOverpayment(
  schedule: PaymentData[],
  overpaymentAmount: number,
  afterPayment: number,
  effect: 'reduceTerm' | 'reducePayment'
): Promise<{ 
  newCalculation: CalculationResults,
  timeOrPaymentSaved: number 
}> {
  if (overpaymentAmount <= 0 || afterPayment <= 0 || afterPayment > schedule.length) {
    throw new Error("Invalid overpayment parameters");
  }
  
  // Clone the schedule up to the overpayment point
  const newSchedule = schedule.slice(0, afterPayment);
  
  // Calculate remaining balance after overpayment
  let remainingBalance = schedule[afterPayment - 1].balance - overpaymentAmount;
  
  // Pre-calculate total interest and payment up to this point (for efficiency)
  const totalInterestSoFar = newSchedule.reduce((total, month) => total + month.interestPayment, 0);
  
  if (remainingBalance <= 0) {
    // Loan fully paid
    return {
      newCalculation: {
        monthlyPayment: schedule[0].monthlyPayment,
        totalInterest: totalInterestSoFar,
        amortizationSchedule: newSchedule,
        yearlyData: aggregateYearlyData(newSchedule),
        originalTerm: schedule.length / 12,
        actualTerm: newSchedule.length / 12
      },
      timeOrPaymentSaved: schedule.length - afterPayment
    };
  }
  
  const originalMonthlyPayment = schedule[0].monthlyPayment;
  let newMonthlyPayment = originalMonthlyPayment;
  const monthlyRate = schedule[0].interestPayment / schedule[0].balance;
  
  // Reduced term: same payment, shorter term
  if (effect === 'reduceTerm') {
    let payment = afterPayment;
    
    while (remainingBalance > 0) {
      payment++;
      const interestPayment = remainingBalance * monthlyRate;
      let principalPayment = originalMonthlyPayment - interestPayment;
      const currentPayment = originalMonthlyPayment;
      
      if (remainingBalance < originalMonthlyPayment) {
        principalPayment = remainingBalance;
        const finalPayment = principalPayment + interestPayment;
        
        newSchedule.push({
          payment,
          monthlyPayment: finalPayment,
          principalPayment,
          interestPayment,
          balance: 0,
          isOverpayment: false,
          overpaymentAmount: 0,
          totalInterest: 0, // Will recalculate later
          totalPayment: finalPayment
        });
        break;
      }
      
      remainingBalance -= principalPayment;
      
      newSchedule.push({
        payment,
        monthlyPayment: currentPayment,
        principalPayment,
        interestPayment,
        balance: remainingBalance,
        isOverpayment: false,
        overpaymentAmount: 0,
        totalInterest: 0, // Will recalculate later
        totalPayment: currentPayment
      });
    }
  }
  // Reduced payment: same term, lower payment
  else {
    // Recalculate monthly payment for the remaining balance and term
    const remainingMonths = schedule.length - afterPayment;
    // Use imported calculateMonthlyPayment function
    newMonthlyPayment = calculateMonthlyPayment(
      remainingBalance,
      monthlyRate * 12 * 100,
      remainingMonths / 12
    );
    
    for (let i = afterPayment; i < schedule.length; i++) {
      const payment = i + 1;
      const interestPayment = remainingBalance * monthlyRate;
      let principalPayment = newMonthlyPayment - interestPayment;
      
      if (i === schedule.length - 1 || remainingBalance < newMonthlyPayment) {
        principalPayment = remainingBalance;
        const finalPayment = principalPayment + interestPayment;
        
        newSchedule.push({
          payment,
          monthlyPayment: finalPayment,
          principalPayment,
          interestPayment,
          balance: 0,
          isOverpayment: false,
          overpaymentAmount: 0,
          totalInterest: 0, // Will recalculate later
          totalPayment: finalPayment
        });
        break;
      }
      
      remainingBalance -= principalPayment;
      
      newSchedule.push({
        payment,
        monthlyPayment: newMonthlyPayment,
        principalPayment,
        interestPayment,
        balance: remainingBalance,
        isOverpayment: false,
        overpaymentAmount: 0,
        totalInterest: 0, // Will recalculate later
        totalPayment: newMonthlyPayment
      });
    }
    }
    
    // Calculate the total interest using the optimized approach
    // This is more reliable than tracking in separate code paths
    let finalTotalInterest = newSchedule.reduce((total, month) => total + month.interestPayment, 0);
      
    return {
      newCalculation: {
        monthlyPayment: effect === 'reduceTerm' ? originalMonthlyPayment : newMonthlyPayment,
        totalInterest: finalTotalInterest,
        amortizationSchedule: newSchedule,
        yearlyData: aggregateYearlyData(newSchedule),
        originalTerm: schedule.length / 12,
        actualTerm: newSchedule.length / 12
      },
      timeOrPaymentSaved: effect === 'reduceTerm'
      ? schedule.length - newSchedule.length
      : originalMonthlyPayment - newMonthlyPayment
    };
  }
  
/**
 * Handle rate changes during the loan term
 * @param originalSchedule The original amortization schedule
 * @param changeAtMonth The month when the rate change occurs (1-based)
 * @param newRate The new interest rate
 * @param remainingTerm Optional override for the remaining term (in years)
 * @returns A new amortization schedule with the rate change applied
 */
export async function applyRateChange(
    originalSchedule: PaymentData[],
    changeAtMonth: number,
    newRate: number,
    remainingTerm?: number
  ): Promise<PaymentData[]> {
    if (changeAtMonth <= 0 || changeAtMonth >= originalSchedule.length) {
      throw new Error('Invalid month for rate change');
    }
    
    // Get the remaining balance at the change point
    const remainingBalance = originalSchedule[changeAtMonth - 1].balance;
    
    // Calculate remaining term if not provided
    const defaultRemainingTerm = (originalSchedule.length - changeAtMonth) / 12;
    const termToUse = remainingTerm || defaultRemainingTerm;
    
    // Generate a new schedule with the new rate
    // Use imported generateAmortizationSchedule function
    const scheduleItems = generateAmortizationSchedule(
      remainingBalance,
      newRate,
      termToUse
    );
    
    // Convert Schedule to PaymentData 
    const newSchedule: PaymentData[] = scheduleItems.map(item => {
      // Use the shared conversion function
      const converted = convertLegacySchedule(item);
      return {
        ...converted,
        // Ensure required fields are non-undefined
        payment: converted.payment || 0,
        balance: converted.balance || 0,
        overpaymentAmount: 0, // Set default value for overpayment
        totalInterest: 0, // Will be calculated cumulatively later
        totalPayment: converted.monthlyPayment || item.payment || 0
      };
    });
    
    // Combine the schedules
    const combinedSchedule = [
      ...originalSchedule.slice(0, changeAtMonth),
      ...newSchedule.map(item => ({
        ...item,
        payment: item.payment + changeAtMonth
      }))
    ];
    
    return combinedSchedule;
  }
  
  /**
   * Apply multiple overpayments to a schedule
   * @param schedule The original amortization schedule
   * @param overpayments Array of overpayment details
   * @returns A new amortization schedule with all overpayments applied
   */
  export async function applyMultipleOverpayments(
    schedule: PaymentData[],
    overpayments: OverpaymentDetails[]
  ): Promise<PaymentData[]> {
    let modifiedSchedule = [...schedule];
    
    // Process each month
    for (let month = 1; month <= schedule.length; month++) {
      if (month > modifiedSchedule.length) break;
      
      // Check for applicable overpayments
      const applicableOverpayments = overpayments.filter(op => {
        const isAfterStart = month >= op.startMonth;
        const isBeforeEnd = !op.endMonth || month <= op.endMonth;
        
        // Check frequency
        let matchesFrequency = false;
        if (op.frequency === 'monthly' && op.isRecurring) {
          matchesFrequency = true;
        } else if (op.frequency === 'quarterly' && op.isRecurring && (month - op.startMonth) % 3 === 0) {
          matchesFrequency = true;
        } else if (op.frequency === 'annual' && op.isRecurring && (month - op.startMonth) % 12 === 0) {
          matchesFrequency = true;
        } else if (op.frequency === 'one-time' && month === op.startMonth) {
          matchesFrequency = true;
        }
        
        return isAfterStart && isBeforeEnd && matchesFrequency;
      });
      
      if (applicableOverpayments.length > 0) {
        // Calculate total overpayment for this month
        const totalOverpayment = applicableOverpayments.reduce(
          (sum, op) => sum + op.amount, 0
        );
        
        // Apply the overpayment
        const currentBalance = modifiedSchedule[month - 1].balance;
        const monthlyRate = (modifiedSchedule[month - 1].interestPayment / currentBalance);
        const interestPayment = currentBalance * monthlyRate;
        const regularPrincipalPayment = modifiedSchedule[month - 1].monthlyPayment - interestPayment;
        const totalPrincipalPayment = regularPrincipalPayment + totalOverpayment;
        
        // Update the schedule entry
        modifiedSchedule[month - 1] = {
          ...modifiedSchedule[month - 1],
          principalPayment: totalPrincipalPayment,
          overpaymentAmount: totalOverpayment,
          isOverpayment: totalOverpayment > 0,
          monthlyPayment: modifiedSchedule[month - 1].monthlyPayment + totalOverpayment,
          balance: Math.max(0, currentBalance - totalPrincipalPayment)
        };
        
        // Recalculate remaining schedule if balance is not zero
        if (modifiedSchedule[month - 1].balance > 0) {
          const remainingMonths = schedule.length - month;
          // Use imported calculateMonthlyPayment function
          const newMonthlyPayment = calculateMonthlyPayment(
            modifiedSchedule[month - 1].balance,
            monthlyRate * 12 * 100,
            remainingMonths / 12
          );
          
          // Update remaining schedule
          for (let i = month; i < modifiedSchedule.length; i++) {
            const currentBalance = modifiedSchedule[i - 1].balance;
            const interestPayment = currentBalance * monthlyRate;
            let principalPayment = newMonthlyPayment - interestPayment;

            if (principalPayment > currentBalance) {
              principalPayment = currentBalance;
            }
            
            modifiedSchedule[i] = {
              payment: i + 1,
              monthlyPayment: newMonthlyPayment,
              principalPayment: principalPayment,
              interestPayment: interestPayment,
              balance: Math.max(0, currentBalance - principalPayment),
              isOverpayment: modifiedSchedule[i].isOverpayment,
              overpaymentAmount: modifiedSchedule[i].overpaymentAmount,
              totalInterest: modifiedSchedule[i].totalInterest + interestPayment,
              totalPayment: newMonthlyPayment
            };
          }
        }
      }
    }
    
    return modifiedSchedule;
  }
  
  /**
   * Calculate complex scenario with rate changes and overpayments
   */
  export async function calculateComplexScenario(
    principal: number,
    interestRate: number,
    loanTerm: number,
    overpayments: OverpaymentDetails[],
    rateChanges: { month: number; newRate: number }[]
  ): Promise<CalculationResults> {
    // Calculate the initial monthly payment directly
    const initialMonthlyPayment = calculateMonthlyPayment(principal, interestRate, loanTerm);
    
    // Generate the amortization schedule
    let initialSchedule = generateAmortizationSchedule(principal, interestRate, loanTerm);
    
    // Apply rate changes
    // Convert initialSchedule to PaymentData using our unified approach
    const initialPaymentData: PaymentData[] = initialSchedule.map((item, index) => {
      // Use the shared conversion function
      const converted = convertLegacySchedule(item);
      return {
        ...converted,
        // Ensure required fields are non-undefined
        payment: converted.payment || (index + 1),
        balance: converted.balance || 0,
        monthlyPayment: index === 0 ? initialMonthlyPayment : (converted.monthlyPayment || initialMonthlyPayment),
        overpaymentAmount: 0, // Set default value for overpayment
        totalInterest: converted.totalInterest || 0,
        totalPayment: converted.totalPayment || converted.monthlyPayment || initialMonthlyPayment
      };
    });
    
    let modifiedSchedule = [...initialPaymentData];
    
    // Apply rate changes sequentially to ensure correct calculation
    for (const change of rateChanges) {
      modifiedSchedule = await applyRateChange(modifiedSchedule, change.month, change.newRate);
    }
    
    // Apply overpayments
    modifiedSchedule = await applyMultipleOverpayments(modifiedSchedule, overpayments);
    
    const totalInterest = modifiedSchedule.reduce((total, month) => total + month.interestPayment, 0);
    
    return {
      monthlyPayment: initialMonthlyPayment, // Use the correctly calculated initial payment
      totalInterest,
      amortizationSchedule: modifiedSchedule,
      yearlyData: aggregateYearlyData(modifiedSchedule),
      originalTerm: loanTerm,
      actualTerm: modifiedSchedule.length / 12
    };
  }
