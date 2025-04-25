import { CalculationResults, MonthlyData, OverpaymentDetails, YearlyData, CalculationPeriod } from "./types";
import { validateInputs } from "./validation";
import { calculateMonthlyPayment, generateAmortizationSchedule } from "./utils";

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
 * Generate amortization schedule with recurring overpayments
 */
export function generateScheduleWithRecurringOverpayments(
  principal: number,
  interestRate: number,
  loanTerm: number,
  overpaymentPlan: OverpaymentDetails
): MonthlyData[] {
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  const baseMonthlyPayment = calculateMonthlyPayment(principal, interestRate, loanTerm);
  
  let balance = principal;
  const schedule: MonthlyData[] = [];
  
  // Pre-calculate frequency multiplier
  const frequencyMultiplier = overpaymentPlan.frequency === 'monthly' ? 1 :
    overpaymentPlan.frequency === 'quarterly' ? 3 :
    overpaymentPlan.frequency === 'annual' ? 12 : 0;

  const MAX_PAYMENTS = 600; // 50 years
  for (let i = 1; i <= numberOfPayments && balance > 0; i++) {
    if (i > MAX_PAYMENTS) {
      throw new Error('Maximum payment limit exceeded');
    }
    const interestPayment = balance * monthlyRate;
    let principalPayment = baseMonthlyPayment - interestPayment;
    let totalPayment = baseMonthlyPayment;
    let overpaymentAmount = 0;
    
    // Optimized overpayment check
    const isOverpaymentPeriod = i >= overpaymentPlan.startMonth && 
      (!overpaymentPlan.endMonth || i <= overpaymentPlan.endMonth);
      
    const isFrequencyMatch = overpaymentPlan.frequency === 'monthly' || 
      (i - overpaymentPlan.startMonth) % frequencyMultiplier === 0;
    
    if (isOverpaymentPeriod && isFrequencyMatch) {
      overpaymentAmount = overpaymentPlan.amount;
      principalPayment += overpaymentAmount;
      totalPayment += overpaymentAmount;
    }
    
    // Handle final payment
    if (principalPayment >= balance) {
      principalPayment = balance;
      totalPayment = balance + interestPayment;
      overpaymentAmount = Math.max(0, principalPayment - (baseMonthlyPayment - interestPayment));
    }
    
    balance = Math.max(0, balance - principalPayment);
    
    schedule.push({
      payment: i,
      monthlyPayment: totalPayment,
      principalPayment,
      interestPayment,
      balance,
      isOverpayment: overpaymentAmount > 0,
      overpaymentAmount,
      totalInterest: schedule.reduce((sum, item) => sum + item.interestPayment, 0) + interestPayment,
      totalPayment: totalPayment
    });
    
    if (balance === 0) break;
  }
  
  return schedule;
}

/**
 * Aggregate monthly payment data into yearly summaries for display
 */
export function aggregateYearlyData(schedule: MonthlyData[]): YearlyData[] {
  if (!schedule || schedule.length === 0) {
    return [];
  }

  return schedule.reduce((acc: YearlyData[], month: MonthlyData, index: number) => {
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
 * Calculate all loan details in a single function
 */
export function calculateLoanDetails(
  principal: number,
  interestRate: number,
  loanTerm: number,
  overpaymentPlan?: OverpaymentDetails
): CalculationResults {
  if (!validateInputs(principal, interestRate, loanTerm, overpaymentPlan)) {
    throw new Error('Invalid input parameters');
  }

  const schedule = overpaymentPlan && overpaymentPlan.isRecurring
    ? generateScheduleWithRecurringOverpayments(principal, interestRate, loanTerm, overpaymentPlan)
    : generateAmortizationSchedule(principal, interestRate, loanTerm);
    
  const yearlyData = aggregateYearlyData(schedule);
  const totalInterest = schedule.reduce((total, month) => total + month.interestPayment, 0);
  
  return {
    monthlyPayment: schedule[0].monthlyPayment,
    totalInterest,
    amortizationSchedule: schedule,
    yearlyData,
    originalTerm: loanTerm,
    actualTerm: schedule.length / 12
  };
}

/**
 * Apply a one-time overpayment and recalculate the amortization schedule
 */
export function applyOverpayment(
  schedule: MonthlyData[],
  overpaymentAmount: number,
  afterPayment: number,
  effect: 'reduceTerm' | 'reducePayment'
): { 
  newCalculation: CalculationResults,
  timeOrPaymentSaved: number 
} {
  if (overpaymentAmount <= 0 || afterPayment <= 0 || afterPayment > schedule.length) {
    throw new Error("Invalid overpayment parameters");
  }
  
  // Clone the schedule up to the overpayment point
  const newSchedule = schedule.slice(0, afterPayment);
  
  // Calculate remaining balance after overpayment
  let remainingBalance = schedule[afterPayment - 1].balance - overpaymentAmount;
  
  if (remainingBalance <= 0) {
    // Loan fully paid
    return {
      newCalculation: {
        monthlyPayment: schedule[0].monthlyPayment,
        totalInterest: newSchedule.reduce((total, month) => total + month.interestPayment, 0),
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
          totalInterest: newSchedule.reduce((sum, item) => sum + item.interestPayment, 0) + interestPayment,
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
        totalInterest: newSchedule.reduce((sum, item) => sum + item.interestPayment, 0) + interestPayment,
        totalPayment: currentPayment
      });
    }
  } 
  // Reduced payment: same term, lower payment
  else {
    // Recalculate monthly payment for the remaining balance and term
    const remainingMonths = schedule.length - afterPayment;
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
          totalInterest: newSchedule.reduce((sum, item) => sum + item.interestPayment, 0) + interestPayment,
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
        totalInterest: newSchedule.reduce((sum, item) => sum + item.interestPayment, 0) + interestPayment,
        totalPayment: newMonthlyPayment
        });
      }
    }
    
    return {
      newCalculation: {
        monthlyPayment: effect === 'reduceTerm' ? originalMonthlyPayment : newMonthlyPayment,
        totalInterest: newSchedule.reduce((total, month) => total + month.interestPayment, 0),
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
  export function applyRateChange(
    originalSchedule: MonthlyData[],
    changeAtMonth: number,
    newRate: number,
    remainingTerm?: number
  ): MonthlyData[] {
    if (changeAtMonth <= 0 || changeAtMonth >= originalSchedule.length) {
      throw new Error('Invalid month for rate change');
    }
    
    // Get the remaining balance at the change point
    const remainingBalance = originalSchedule[changeAtMonth - 1].balance;
    
    // Calculate remaining term if not provided
    const defaultRemainingTerm = (originalSchedule.length - changeAtMonth) / 12;
    const termToUse = remainingTerm || defaultRemainingTerm;
    
    // Generate a new schedule with the new rate
    const newSchedule = generateAmortizationSchedule(
      remainingBalance,
      newRate,
      termToUse
    );
    
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
  export function applyMultipleOverpayments(
    schedule: MonthlyData[],
    overpayments: OverpaymentDetails[]
  ): MonthlyData[] {
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
  export function calculateComplexScenario(
    principal: number,
    interestRate: number,
    loanTerm: number,
    overpayments: OverpaymentDetails[],
    rateChanges: { month: number; newRate: number }[]
  ): CalculationResults {
    let initialSchedule = generateAmortizationSchedule(principal, interestRate, loanTerm);
    
    // Apply rate changes
    let modifiedSchedule = [...initialSchedule];
    rateChanges.forEach(change => {
      modifiedSchedule = applyRateChange(modifiedSchedule, change.month, change.newRate);
    });
    
    // Apply overpayments
    modifiedSchedule = applyMultipleOverpayments(modifiedSchedule, overpayments);
    
    const totalInterest = modifiedSchedule.reduce((total, month) => total + month.interestPayment, 0);
    
    return {
      monthlyPayment: modifiedSchedule[0].monthlyPayment,
      totalInterest,
      amortizationSchedule: modifiedSchedule,
      yearlyData: aggregateYearlyData(modifiedSchedule),
      originalTerm: loanTerm,
      actualTerm: modifiedSchedule.length / 12
    };
  }
