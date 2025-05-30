import { v4 as uuidv4 } from 'uuid';
import { firestore } from '../config/firebase';
import { CustomError } from '../utils/errors';
import { logger } from '../utils/logger';
import { 
  LoanComparison, 
  CreateComparisonData, 
  UpdateComparisonData, 
  ComparisonResults,
  LoanData,
  ComparisonMetrics,
  COMPARISON_VALIDATION_RULES
} from '../types/comparison';
import { CalculationResults, ExtraPayment } from '../types/calculation';

export class ComparisonService {
  private collection = firestore.collection('comparisons');

  // Calculate mortgage payment and amortization
  private calculateMortgage(
    principal: number,
    annualRate: number,
    termYears: number,
    extraPayments: ExtraPayment[] = []
  ): CalculationResults {
    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = termYears * 12;
    
    // Calculate base monthly payment
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
      (Math.pow(1 + monthlyRate, totalPayments) - 1);

    let balance = principal;
    let totalInterest = 0;
    const amortizationSchedule = [];
    
    // Create extra payments map for quick lookup
    const extraPaymentMap = new Map<number, number>();
    extraPayments.forEach(ep => {
      if (ep.type === 'monthly') {
        for (let i = ep.month; i <= totalPayments; i++) {
          extraPaymentMap.set(i, (extraPaymentMap.get(i) || 0) + ep.amount);
        }
      } else if (ep.type === 'yearly') {
        for (let year = Math.ceil(ep.month / 12); year <= termYears; year++) {
          const month = year * 12;
          if (month <= totalPayments) {
            extraPaymentMap.set(month, (extraPaymentMap.get(month) || 0) + ep.amount);
          }
        }
      } else if (ep.type === 'one-time') {
        extraPaymentMap.set(ep.month, (extraPaymentMap.get(ep.month) || 0) + ep.amount);
      }
    });

    let month = 1;
    while (balance > 0.01 && month <= totalPayments * 2) { // Safety limit
      const interestPayment = balance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;
      const extraPayment = extraPaymentMap.get(month) || 0;
      
      // Ensure we don't overpay
      if (principalPayment + extraPayment > balance) {
        principalPayment = balance;
      } else {
        principalPayment += extraPayment;
      }
      
      balance -= principalPayment;
      totalInterest += interestPayment;
      
      amortizationSchedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment - extraPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
        extraPayment: extraPayment > 0 ? extraPayment : undefined,
        totalPayment: monthlyPayment + extraPayment
      });
      
      month++;
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + month - 1);

    return {
      monthlyPayment,
      totalInterest,
      totalAmount: principal + totalInterest,
      payoffDate: payoffDate.toISOString().split('T')[0],
      amortizationSchedule,
      summary: {
        principalPaid: principal,
        interestPaid: totalInterest,
        totalPayments: month - 1,
        interestSaved: extraPayments.length > 0 ? this.calculateInterestSaved(principal, annualRate, termYears, extraPayments) : undefined,
        timeSaved: extraPayments.length > 0 ? this.calculateTimeSaved(termYears, month - 1) : undefined
      }
    };
  }

  private calculateInterestSaved(principal: number, rate: number, originalTerm: number, extraPayments: ExtraPayment[]): number {
    const originalResults = this.calculateMortgage(principal, rate, originalTerm, []);
    const newResults = this.calculateMortgage(principal, rate, originalTerm, extraPayments);
    return originalResults.totalInterest - newResults.totalInterest;
  }

  private calculateTimeSaved(originalTermYears: number, actualMonths: number): string {
    const originalMonths = originalTermYears * 12;
    const savedMonths = originalMonths - actualMonths;
    const years = Math.floor(savedMonths / 12);
    const months = savedMonths % 12;
    
    if (years > 0 && months > 0) {
      return `${years} years, ${months} months`;
    } else if (years > 0) {
      return `${years} years`;
    } else {
      return `${months} months`;
    }
  }

  private calculateComparisonMetrics(loan: LoanData, results: CalculationResults): ComparisonMetrics {
    return {
      totalCost: results.totalAmount,
      monthlyPayment: results.monthlyPayment,
      totalInterest: results.totalInterest,
      interestSavings: 0, // Will be calculated relative to other loans
      payoffDate: results.payoffDate,
      rank: 0 // Will be assigned after all loans are calculated
    };
  }

  private validateComparisonData(data: CreateComparisonData): void {
    const rules = COMPARISON_VALIDATION_RULES;
    
    if (!data.title || data.title.length < rules.title.minLength || data.title.length > rules.title.maxLength) {
      throw new CustomError(`Title must be between ${rules.title.minLength} and ${rules.title.maxLength} characters`, 400);
    }
    
    if (!data.loans || data.loans.length < rules.loans.min || data.loans.length > rules.loans.max) {
      throw new CustomError(`Must compare between ${rules.loans.min} and ${rules.loans.max} loans`, 400);
    }
    
    data.loans.forEach((loan, index) => {
      if (!loan.title || loan.title.trim().length === 0) {
        throw new CustomError(`Loan ${index + 1} must have a title`, 400);
      }
      
      if (loan.loanAmount < rules.loanAmount.min || loan.loanAmount > rules.loanAmount.max) {
        throw new CustomError(`Loan ${index + 1} amount must be between $${rules.loanAmount.min.toLocaleString()} and $${rules.loanAmount.max.toLocaleString()}`, 400);
      }
      
      if (loan.interestRate < rules.interestRate.min || loan.interestRate > rules.interestRate.max) {
        throw new CustomError(`Loan ${index + 1} interest rate must be between ${rules.interestRate.min}% and ${rules.interestRate.max}%`, 400);
      }
      
      if (loan.loanTerm < rules.loanTerm.min || loan.loanTerm > rules.loanTerm.max) {
        throw new CustomError(`Loan ${index + 1} term must be between ${rules.loanTerm.min} and ${rules.loanTerm.max} years`, 400);
      }
    });
  }

  async calculateComparison(data: CreateComparisonData, userId: string): Promise<ComparisonResults> {
    try {
      this.validateComparisonData(data);
      
      // Calculate results for each loan
      const loanResults = data.loans.map(loan => {
        const principal = loan.loanAmount - (loan.downPayment || 0);
        const results = this.calculateMortgage(principal, loan.interestRate, loan.loanTerm, loan.extraPayments);
        const metrics = this.calculateComparisonMetrics(loan, results);
        
        return {
          loan,
          results,
          metrics
        };
      });
      
      // Sort by total cost to assign ranks
      const sortedByTotalCost = [...loanResults].sort((a, b) => a.metrics.totalCost - b.metrics.totalCost);
      
      // Assign ranks and calculate interest savings relative to worst loan
      const worstTotalCost = sortedByTotalCost[sortedByTotalCost.length - 1].metrics.totalCost;
      
      sortedByTotalCost.forEach((result, index) => {
        result.metrics.rank = index + 1;
        result.metrics.interestSavings = worstTotalCost - result.metrics.totalCost;
      });
      
      // Generate summary
      const bestLoan = sortedByTotalCost[0];
      const worstLoan = sortedByTotalCost[sortedByTotalCost.length - 1];
      const totalSavings = worstLoan.metrics.totalCost - bestLoan.metrics.totalCost;
      const averageRate = data.loans.reduce((sum, loan) => sum + loan.interestRate, 0) / data.loans.length;
      
      // Generate chart data
      const charts = {
        monthlyPayments: loanResults.map(result => ({
          loanId: result.loan.id,
          amount: result.metrics.monthlyPayment
        })),
        totalCosts: loanResults.map(result => ({
          loanId: result.loan.id,
          amount: result.metrics.totalCost
        })),
        interestComparison: loanResults.map(result => ({
          loanId: result.loan.id,
          amount: result.metrics.totalInterest
        }))
      };
      
      return {
        loans: loanResults,
        summary: {
          bestLoan: {
            id: bestLoan.loan.id,
            title: bestLoan.loan.title,
            reason: `Lowest total cost: $${bestLoan.metrics.totalCost.toLocaleString()}`
          },
          worstLoan: {
            id: worstLoan.loan.id,
            title: worstLoan.loan.title,
            reason: `Highest total cost: $${worstLoan.metrics.totalCost.toLocaleString()}`
          },
          totalSavings,
          averageRate
        },
        charts
      };
    } catch (error) {
      logger.error('Error calculating comparison:', error);
      throw error;
    }
  }

  async createComparison(data: CreateComparisonData, userId: string): Promise<LoanComparison> {
    try {
      // Add IDs to loans if not present
      const loansWithIds = data.loans.map(loan => ({
        ...loan,
        id: loan.id || uuidv4()
      }));
      
      const dataWithIds = { ...data, loans: loansWithIds };
      const results = await this.calculateComparison(dataWithIds, userId);
      
      const comparison: LoanComparison = {
        id: uuidv4(),
        userId,
        title: data.title,
        loans: loansWithIds,
        results,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await this.collection.doc(comparison.id).set({
        ...comparison,
        createdAt: comparison.createdAt.toISOString(),
        updatedAt: comparison.updatedAt.toISOString()
      });
      
      logger.info(`Comparison created: ${comparison.id} for user: ${userId}`);
      return comparison;
    } catch (error) {
      logger.error('Error creating comparison:', error);
      throw error;
    }
  }

  async getComparison(id: string, userId: string): Promise<LoanComparison> {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        throw new CustomError('Comparison not found', 404);
      }
      
      const data = doc.data();
      if (data?.userId !== userId) {
        throw new CustomError('Access denied', 403);
      }
      
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      } as LoanComparison;
    } catch (error) {
      logger.error('Error getting comparison:', error);
      throw error;
    }
  }

  async updateComparison(id: string, data: UpdateComparisonData, userId: string): Promise<LoanComparison> {
    try {
      const existing = await this.getComparison(id, userId);
      
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };
      
      if (data.title !== undefined) {
        updateData.title = data.title;
      }
      
      if (data.loans !== undefined) {
        const loansWithIds = data.loans.map(loan => ({
          ...loan,
          id: loan.id || uuidv4()
        }));
        
        const comparisonData = { title: data.title || existing.title, loans: loansWithIds };
        const results = await this.calculateComparison(comparisonData, userId);
        
        updateData.loans = loansWithIds;
        updateData.results = results;
      }
      
      await this.collection.doc(id).update(updateData);
      
      return await this.getComparison(id, userId);
    } catch (error) {
      logger.error('Error updating comparison:', error);
      throw error;
    }
  }

  async deleteComparison(id: string, userId: string): Promise<void> {
    try {
      await this.getComparison(id, userId);
      await this.collection.doc(id).delete();
      
      logger.info(`Comparison deleted: ${id} for user: ${userId}`);
    } catch (error) {
      logger.error('Error deleting comparison:', error);
      throw error;
    }
  }

  async getUserComparisons(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ comparisons: LoanComparison[]; total: number; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countSnapshot = await this.collection
        .where('userId', '==', userId)
        .get();
      const total = countSnapshot.size;
      
      // Get paginated results (without orderBy to avoid index issues in emulator)
      const snapshot = await this.collection
        .where('userId', '==', userId)
        .limit(limit)
        .offset(offset)
        .get();
      
      const comparisons = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: new Date(doc.data().createdAt),
        updatedAt: new Date(doc.data().updatedAt)
      })) as LoanComparison[];
      
      return {
        comparisons,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      logger.error('Error getting user comparisons:', error);
      throw error;
    }
  }
}

export const comparisonService = new ComparisonService();