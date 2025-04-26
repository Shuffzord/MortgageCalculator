import { 
  CalculationResults, 
  PaymentData,
  OverpaymentDetails, 
  YearlyData, 
  LoanDetails 
} from "./types";
import { validateInputs } from "./validation";
import { calculateMonthlyPayment, generateAmortizationSchedule, formatCurrency } from "./utils";
import { convertLegacySchedule } from "./mortgage-calculator";

// Re-export formatCurrency from utils to maintain backwards compatibility
export { formatCurrency };

/**
 * Calculate loan details and generate the amortization schedule
 */
export function calculateLoanDetails(
  principal: number,
  interestRatePeriods: { startMonth: number; interestRate: number; }[],
  loanTerm: number,
  overpaymentPlan?: OverpaymentDetails
): CalculationResults {
  // Handle zero principal case specifically
  if (principal === 0) {
    return {
      monthlyPayment: 0,
      totalInterest: 0,
      amortizationSchedule: [],
      yearlyData: [],
      originalTerm: loanTerm,
      actualTerm: 0
    };
  }
  
  // Validate inputs
  validateInputs(principal, interestRatePeriods, loanTerm, overpaymentPlan);
  
  // Generate raw amortization schedule
  const rawSchedule = generateAmortizationSchedule(
    principal,
    interestRatePeriods,
    loanTerm,
    overpaymentPlan
  );
  
  // Convert and round every monetary field
  const paymentData: PaymentData[] = rawSchedule.map(item => {
    // Convert legacy format
    const converted = convertLegacySchedule(item);

    // Round all money values to cents
    const monthlyPayment   = roundToCents(converted.monthlyPayment);
    const interestPayment  = roundToCents(converted.interestPayment);
    const principalPayment = roundToCents(converted.principalPayment);
    const balance          = roundToCents(converted.balance);
    const totalPayment     = roundToCents(converted.totalPayment ?? monthlyPayment);

    return {
      // non-monetary fields
      payment:          converted.payment || 0,
      isOverpayment:    converted.isOverpayment,
      overpaymentAmount: converted.overpaymentAmount || 0,

      // rounded monetary fields
      monthlyPayment,
      interestPayment,
      principalPayment,
      balance,
      totalPayment,

      // will be accumulated below
      totalInterest: 0
    };
  });
  
  // Calculate cumulative interest
  let cumulativeInterest = 0;
  for (const pd of paymentData) {
    cumulativeInterest += pd.interestPayment;
    pd.totalInterest = roundToCents(cumulativeInterest);
  }
  
  // Yearly summary
  const yearlyData = aggregateYearlyData(paymentData);
  
  return {
    monthlyPayment: paymentData[0].monthlyPayment,
    totalInterest: cumulativeInterest,
    amortizationSchedule: paymentData,
    yearlyData,
    originalTerm: loanTerm,
    actualTerm: paymentData.length / 12
  };
}

/**
 * Round to cents for currency calculations
 */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Aggregate monthly payment data into yearly summaries for display
 */
export function aggregateYearlyData(schedule: PaymentData[]): YearlyData[] {
  if (!schedule.length) return [];

  return schedule.reduce((acc: YearlyData[], month: PaymentData, idx: number) => {
    const yearIndex = Math.floor(idx / 12);
    if (!acc[yearIndex]) {
      acc[yearIndex] = { year: yearIndex + 1, principal: 0, interest: 0, payment: 0, balance: 0, totalInterest: 0 };
    }
    acc[yearIndex].principal    = roundToCents(acc[yearIndex].principal + month.principalPayment);
    acc[yearIndex].interest     = roundToCents(acc[yearIndex].interest + month.interestPayment);
    acc[yearIndex].payment      = roundToCents(acc[yearIndex].payment + month.monthlyPayment);
    acc[yearIndex].balance      = month.balance;
    acc[yearIndex].totalInterest= roundToCents(acc[yearIndex].totalInterest + month.interestPayment);
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
  effect?: 'reduceTerm' | 'reducePayment'
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
  // Calculate monthly rate from existing schedule data
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
    
    // Calculate new monthly payment using proper formula
    newMonthlyPayment = calculateMonthlyPayment(
      remainingBalance,
      monthlyRate * 12 * 100, // Convert to annual percentage rate
      remainingMonths / 12     // Convert to years
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
  
  // Calculate new monthly payment with new rate
  const monthlyRate = newRate / 100 / 12;
  const remainingMonths = termToUse * 12;
  const newMonthlyPayment = calculateMonthlyPayment(remainingBalance, newRate, termToUse);
  
  // Generate a new schedule with the new rate and expected monthly payment
  const newSchedule: PaymentData[] = [];
  let balance = remainingBalance;
  
  for (let i = 0; i < remainingMonths && balance > 0; i++) {
    const payment = i + 1;
    const interestPayment = balance * monthlyRate;
    let principalPayment = newMonthlyPayment - interestPayment;
    let monthlyPayment = newMonthlyPayment;
    
    // Adjust final payment if it's more than remaining principal + interest
    if (principalPayment > balance || i === remainingMonths - 1) {
      principalPayment = balance;
      monthlyPayment = principalPayment + interestPayment;
      balance = 0;
    } else {
      balance -= principalPayment;
    }
    
    newSchedule.push({
      payment,
      monthlyPayment,
      principalPayment,
      interestPayment,
      balance,
      isOverpayment: false,
      overpaymentAmount: 0,
      totalInterest: 0, // Will be calculated later
      totalPayment: monthlyPayment
    });
    
    // Break if balance reaches zero
    if (balance <= 0.01) {
      break;
    }
  }
  
  // Combine the schedules
  const combinedSchedule = [
    ...originalSchedule.slice(0, changeAtMonth),
    ...newSchedule.map(item => ({
      ...item,
      payment: item.payment + changeAtMonth
    }))
  ];
  
  // Recalculate running totals for interest and payments
  let runningTotalInterest = originalSchedule.slice(0, changeAtMonth)
    .reduce((total, month) => total + month.interestPayment, 0);
    
  for (let i = changeAtMonth; i < combinedSchedule.length; i++) {
    runningTotalInterest += combinedSchedule[i].interestPayment;
    combinedSchedule[i].totalInterest = runningTotalInterest;
  }
  
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
      const result = await applyOverpayment(
        modifiedSchedule,
        totalOverpayment,
        month,
        applicableOverpayments[0].effect || 'reduceTerm' // Use the effect type from the first overpayment
      );

      // Update the schedule
      modifiedSchedule = result.newCalculation.amortizationSchedule;
    }
  }
  
  return modifiedSchedule;
}

/**
 * Calculate complex scenario with rate changes and overpayments
 */
export async function calculateComplexScenario(
  loanDetails: LoanDetails,
  rateChanges: Array<{ month: number, newRate: number }>,
  overpayments: OverpaymentDetails[]
): Promise<CalculationResults> {
  // First, calculate the basic amortization schedule
  const results = calculateLoanDetails(
    loanDetails.principal,
    loanDetails.interestRatePeriods,
    loanDetails.loanTerm
  );
  
  let schedule = results.amortizationSchedule;
  
  // Apply rate changes in chronological order
  if (rateChanges && rateChanges.length > 0) {
    const sortedRateChanges = [...rateChanges].sort((a, b) => a.month - b.month);
    
    for (const rateChange of sortedRateChanges) {
      schedule = await applyRateChange(
        schedule,
        rateChange.month,
        rateChange.newRate
      );
    }
  }
  
  // Apply overpayments after rate changes
  if (overpayments && overpayments.length > 0) {
    schedule = await applyMultipleOverpayments(schedule, overpayments);
  }
  
  // Calculate final total interest
  const totalInterest = schedule.reduce((sum, item) => sum + item.interestPayment, 0);
  
  // Return final calculation
  return {
    monthlyPayment: schedule[0].monthlyPayment,
    totalInterest,
    amortizationSchedule: schedule,
    yearlyData: aggregateYearlyData(schedule),
    originalTerm: loanDetails.loanTerm,
    actualTerm: schedule.length / 12
  };
}