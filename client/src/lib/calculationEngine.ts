import { CalculationResults, MonthlyData, YearlyData } from "./types";

/**
 * Calculate monthly payment using the formula: M = P[r(1+r)^n]/[(1+r)^n-1]
 * Where:
 * M = monthly payment
 * P = principal loan amount
 * r = monthly interest rate (annual rate / 12 / 100)
 * n = number of payments (loan term in years * 12)
 */
export function calculateMonthlyPayment(
  principal: number,
  interestRate: number,
  loanTerm: number
): number {
  // Convert annual rate to monthly & decimal
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  
  // Handle edge case of 0% interest rate
  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }
  
  // Mortgage payment formula
  const compoundedRate = Math.pow(1 + monthlyRate, numberOfPayments);
  const monthlyPayment = principal * (monthlyRate * compoundedRate) / (compoundedRate - 1);
  
  return monthlyPayment;
}

/**
 * Generate a complete amortization schedule for the loan
 */
export function generateAmortizationSchedule(
  principal: number,
  interestRate: number,
  loanTerm: number
): MonthlyData[] {
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  const monthlyPayment = calculateMonthlyPayment(principal, interestRate, loanTerm);
  
  let balance = principal;
  const schedule: MonthlyData[] = [];
  
  for (let i = 1; i <= numberOfPayments; i++) {
    const interestPayment = balance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;
    
    // Adjust final payment to handle rounding errors
    if (i === numberOfPayments) {
      principalPayment = balance;
    }
    
    balance -= principalPayment;
    if (balance < 0) balance = 0;
    
    schedule.push({
      payment: i,
      monthlyPayment,
      principalPayment,
      interestPayment,
      balance
    });
  }
  
  return schedule;
}

/**
 * Aggregate monthly payment data into yearly summaries for display
 */
export function aggregateYearlyData(schedule: MonthlyData[]): YearlyData[] {
  const yearlyData: YearlyData[] = [];
  let currentYear = 1;
  let yearlyPrincipal = 0;
  let yearlyInterest = 0;
  let yearlyPayment = 0;
  let currentBalance = 0;
  
  schedule.forEach((month, index) => {
    yearlyPrincipal += month.principalPayment;
    yearlyInterest += month.interestPayment;
    yearlyPayment += month.monthlyPayment;
    currentBalance = month.balance;
    
    // End of year or end of schedule
    if ((index + 1) % 12 === 0 || index === schedule.length - 1) {
      yearlyData.push({
        year: currentYear,
        principal: yearlyPrincipal,
        interest: yearlyInterest,
        payment: yearlyPayment,
        balance: currentBalance
      });
      
      currentYear++;
      yearlyPrincipal = 0;
      yearlyInterest = 0;
      yearlyPayment = 0;
    }
  });
  
  return yearlyData;
}

/**
 * Calculate all loan details in a single function
 */
export function calculateLoanDetails(
  principal: number,
  interestRate: number,
  loanTerm: number
): CalculationResults {
  const monthlyPayment = calculateMonthlyPayment(principal, interestRate, loanTerm);
  const amortizationSchedule = generateAmortizationSchedule(principal, interestRate, loanTerm);
  const yearlyData = aggregateYearlyData(amortizationSchedule);
  
  const totalInterest = amortizationSchedule.reduce(
    (total, month) => total + month.interestPayment, 0
  );
  
  return {
    monthlyPayment,
    totalInterest,
    amortizationSchedule,
    yearlyData
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
        yearlyData: aggregateYearlyData(newSchedule)
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
      
      // Final payment
      if (remainingBalance < originalMonthlyPayment) {
        principalPayment = remainingBalance;
        newSchedule.push({
          payment,
          monthlyPayment: principalPayment + interestPayment,
          principalPayment,
          interestPayment,
          balance: 0
        });
        break;
      }
      
      remainingBalance -= principalPayment;
      
      newSchedule.push({
        payment,
        monthlyPayment: originalMonthlyPayment,
        principalPayment,
        interestPayment,
        balance: remainingBalance
      });
    }
    
    return {
      newCalculation: {
        monthlyPayment: originalMonthlyPayment,
        totalInterest: newSchedule.reduce((total, month) => total + month.interestPayment, 0),
        amortizationSchedule: newSchedule,
        yearlyData: aggregateYearlyData(newSchedule)
      },
      timeOrPaymentSaved: schedule.length - newSchedule.length
    };
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
      
      // Final payment
      if (i === schedule.length - 1 || remainingBalance < newMonthlyPayment) {
        principalPayment = remainingBalance;
        newSchedule.push({
          payment,
          monthlyPayment: principalPayment + interestPayment,
          principalPayment,
          interestPayment,
          balance: 0
        });
        break;
      }
      
      remainingBalance -= principalPayment;
      
      newSchedule.push({
        payment,
        monthlyPayment: newMonthlyPayment,
        principalPayment,
        interestPayment,
        balance: remainingBalance
      });
    }
    
    return {
      newCalculation: {
        monthlyPayment: newMonthlyPayment,
        totalInterest: newSchedule.reduce((total, month) => total + month.interestPayment, 0),
        amortizationSchedule: newSchedule,
        yearlyData: aggregateYearlyData(newSchedule)
      },
      timeOrPaymentSaved: originalMonthlyPayment - newMonthlyPayment
    };
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format time period from months
 */
export function formatTimePeriod(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  let result = '';
  if (years > 0) {
    result += years + (years === 1 ? ' year' : ' years');
  }
  if (remainingMonths > 0) {
    result += (years > 0 ? ' ' : '') + remainingMonths + (remainingMonths === 1 ? ' month' : ' months');
  }
  
  return result || '0 months';
}
