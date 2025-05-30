import { firestore } from '../config/firebase';
import { 
  Calculation, 
  CreateCalculationData, 
  UpdateCalculationData, 
  CalculationResults,
  CalculationListResponse,
  ShareCalculationResponse,
  ExtraPayment,
  AmortizationEntry,
  CALCULATION_VALIDATION_RULES
} from '../types/calculation';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export class CalculationService {
  private static readonly COLLECTION_NAME = 'calculations';

  static validateCalculationData(data: CreateCalculationData | UpdateCalculationData): void {
    const rules = CALCULATION_VALIDATION_RULES;

    if ('title' in data && data.title !== undefined) {
      if (data.title.length < rules.title.minLength || data.title.length > rules.title.maxLength) {
        throw new AppError(
          `Title must be between ${rules.title.minLength} and ${rules.title.maxLength} characters`,
          400,
          'INVALID_TITLE'
        );
      }
    }

    if ('loanAmount' in data && data.loanAmount !== undefined) {
      if (data.loanAmount < rules.loanAmount.min || data.loanAmount > rules.loanAmount.max) {
        throw new AppError(
          `Loan amount must be between $${rules.loanAmount.min.toLocaleString()} and $${rules.loanAmount.max.toLocaleString()}`,
          400,
          'INVALID_LOAN_AMOUNT'
        );
      }
    }

    if ('interestRate' in data && data.interestRate !== undefined) {
      if (data.interestRate < rules.interestRate.min || data.interestRate > rules.interestRate.max) {
        throw new AppError(
          `Interest rate must be between ${rules.interestRate.min}% and ${rules.interestRate.max}%`,
          400,
          'INVALID_INTEREST_RATE'
        );
      }
    }

    if ('loanTerm' in data && data.loanTerm !== undefined) {
      if (data.loanTerm < rules.loanTerm.min || data.loanTerm > rules.loanTerm.max) {
        throw new AppError(
          `Loan term must be between ${rules.loanTerm.min} and ${rules.loanTerm.max} years`,
          400,
          'INVALID_LOAN_TERM'
        );
      }
    }

    if ('downPayment' in data && data.downPayment !== undefined) {
      if (data.downPayment < rules.downPayment.min || data.downPayment > rules.downPayment.max) {
        throw new AppError(
          `Down payment must be between $${rules.downPayment.min.toLocaleString()} and $${rules.downPayment.max.toLocaleString()}`,
          400,
          'INVALID_DOWN_PAYMENT'
        );
      }
    }
  }

  static calculateMortgage(
    loanAmount: number,
    interestRate: number,
    loanTerm: number,
    downPayment: number = 0,
    extraPayments: ExtraPayment[] = []
  ): CalculationResults {
    const principal = loanAmount - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    // Calculate base monthly payment
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    // Generate amortization schedule with extra payments
    const schedule: AmortizationEntry[] = [];
    let remainingBalance = principal;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let month = 1;

    // Create a map of extra payments by month for quick lookup
    const extraPaymentMap = new Map<number, number>();
    extraPayments.forEach(payment => {
      if (payment.type === 'monthly') {
        // Apply monthly extra payments to all months
        for (let i = 1; i <= numberOfPayments; i++) {
          extraPaymentMap.set(i, (extraPaymentMap.get(i) || 0) + payment.amount);
        }
      } else if (payment.type === 'yearly') {
        // Apply yearly extra payments to specific months
        for (let year = 1; year <= loanTerm; year++) {
          const targetMonth = payment.month + (year - 1) * 12;
          if (targetMonth <= numberOfPayments) {
            extraPaymentMap.set(targetMonth, (extraPaymentMap.get(targetMonth) || 0) + payment.amount);
          }
        }
      } else if (payment.type === 'one-time') {
        // Apply one-time extra payment to specific month
        if (payment.month <= numberOfPayments) {
          extraPaymentMap.set(payment.month, (extraPaymentMap.get(payment.month) || 0) + payment.amount);
        }
      }
    });

    while (remainingBalance > 0.01 && month <= numberOfPayments * 2) { // Safety limit
      const interestPayment = remainingBalance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;
      
      // Apply extra payment if any
      const extraPayment = extraPaymentMap.get(month) || 0;
      
      // Ensure we don't overpay
      if (principalPayment + extraPayment > remainingBalance) {
        principalPayment = remainingBalance;
      } else {
        principalPayment += extraPayment;
      }

      const totalPayment = interestPayment + principalPayment;
      remainingBalance -= principalPayment;
      
      totalInterestPaid += interestPayment;
      totalPrincipalPaid += principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment - extraPayment,
        interest: interestPayment,
        balance: Math.max(0, remainingBalance),
        extraPayment: extraPayment > 0 ? extraPayment : undefined,
        totalPayment
      });

      month++;
    }

    // Calculate payoff date
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + schedule.length);

    // Calculate original totals for comparison
    const originalTotalInterest = (monthlyPayment * numberOfPayments) - principal;
    const interestSaved = Math.max(0, originalTotalInterest - totalInterestPaid);
    const monthsSaved = Math.max(0, numberOfPayments - schedule.length);

    return {
      monthlyPayment,
      totalInterest: totalInterestPaid,
      totalAmount: principal + totalInterestPaid,
      payoffDate: payoffDate.toISOString(),
      amortizationSchedule: schedule,
      summary: {
        principalPaid: totalPrincipalPaid,
        interestPaid: totalInterestPaid,
        totalPayments: schedule.length,
        interestSaved: extraPayments.length > 0 ? interestSaved : undefined,
        timeSaved: extraPayments.length > 0 && monthsSaved > 0 
          ? `${Math.floor(monthsSaved / 12)} years ${monthsSaved % 12} months`
          : undefined
      }
    };
  }

  static async createCalculation(userId: string, data: CreateCalculationData): Promise<Calculation> {
    try {
      this.validateCalculationData(data);

      const results = this.calculateMortgage(
        data.loanAmount,
        data.interestRate,
        data.loanTerm,
        data.downPayment || 0,
        data.extraPayments || []
      );

      const calculation: Calculation = {
        id: uuidv4(),
        userId,
        title: data.title,
        loanAmount: data.loanAmount,
        interestRate: data.interestRate,
        loanTerm: data.loanTerm,
        downPayment: data.downPayment,
        extraPayments: data.extraPayments,
        results,
        isPublic: data.isPublic || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await firestore.collection(this.COLLECTION_NAME).doc(calculation.id).set(calculation);
      
      logger.info(`Created calculation ${calculation.id} for user ${userId}`);
      return calculation;
    } catch (error) {
      logger.error('Error creating calculation:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create calculation', 500);
    }
  }

  static async getCalculation(calculationId: string, userId?: string): Promise<Calculation> {
    try {
      const doc = await firestore.collection(this.COLLECTION_NAME).doc(calculationId).get();
      
      if (!doc.exists) {
        throw new AppError('Calculation not found', 404, 'CALCULATION_NOT_FOUND');
      }

      const calculation = doc.data() as Calculation;
      
      // Check access permissions
      if (userId && calculation.userId !== userId && !calculation.isPublic) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      return calculation;
    } catch (error) {
      logger.error('Error getting calculation:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve calculation', 500);
    }
  }

  static async getCalculationByPublicToken(publicToken: string): Promise<Calculation> {
    try {
      const snapshot = await firestore
        .collection(this.COLLECTION_NAME)
        .where('publicToken', '==', publicToken)
        .where('isPublic', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new AppError('Public calculation not found', 404, 'PUBLIC_CALCULATION_NOT_FOUND');
      }

      return snapshot.docs[0].data() as Calculation;
    } catch (error) {
      logger.error('Error getting public calculation:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve public calculation', 500);
    }
  }

  static async getUserCalculations(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<CalculationListResponse> {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countSnapshot = await firestore
        .collection(this.COLLECTION_NAME)
        .where('userId', '==', userId)
        .get();
      
      const total = countSnapshot.size;

      // Get paginated results
      const snapshot = await firestore
        .collection(this.COLLECTION_NAME)
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .offset(offset)
        .limit(limit)
        .get();

      const calculations = snapshot.docs.map(doc => doc.data() as Calculation);
      
      return {
        calculations,
        total,
        page,
        limit,
        hasMore: offset + calculations.length < total
      };
    } catch (error) {
      logger.error('Error getting user calculations:', error);
      throw new AppError('Failed to retrieve calculations', 500);
    }
  }

  static async updateCalculation(
    calculationId: string, 
    userId: string, 
    data: UpdateCalculationData
  ): Promise<Calculation> {
    try {
      this.validateCalculationData(data);

      const existingCalculation = await this.getCalculation(calculationId, userId);
      
      if (existingCalculation.userId !== userId) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      // Recalculate if financial data changed
      let results = existingCalculation.results;
      if (
        data.loanAmount !== undefined ||
        data.interestRate !== undefined ||
        data.loanTerm !== undefined ||
        data.downPayment !== undefined ||
        data.extraPayments !== undefined
      ) {
        results = this.calculateMortgage(
          data.loanAmount ?? existingCalculation.loanAmount,
          data.interestRate ?? existingCalculation.interestRate,
          data.loanTerm ?? existingCalculation.loanTerm,
          data.downPayment ?? existingCalculation.downPayment ?? 0,
          data.extraPayments ?? existingCalculation.extraPayments ?? []
        );
      }

      const updatedCalculation: Calculation = {
        ...existingCalculation,
        ...data,
        results,
        updatedAt: new Date()
      };

      await firestore.collection(this.COLLECTION_NAME).doc(calculationId).set(updatedCalculation);
      
      logger.info(`Updated calculation ${calculationId} for user ${userId}`);
      return updatedCalculation;
    } catch (error) {
      logger.error('Error updating calculation:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update calculation', 500);
    }
  }

  static async deleteCalculation(calculationId: string, userId: string): Promise<void> {
    try {
      const calculation = await this.getCalculation(calculationId, userId);
      
      if (calculation.userId !== userId) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      await firestore.collection(this.COLLECTION_NAME).doc(calculationId).delete();
      
      logger.info(`Deleted calculation ${calculationId} for user ${userId}`);
    } catch (error) {
      logger.error('Error deleting calculation:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete calculation', 500);
    }
  }

  static async shareCalculation(calculationId: string, userId: string): Promise<ShareCalculationResponse> {
    try {
      const calculation = await this.getCalculation(calculationId, userId);
      
      if (calculation.userId !== userId) {
        throw new AppError('Access denied', 403, 'ACCESS_DENIED');
      }

      // Generate secure public token if not exists
      let publicToken = calculation.publicToken;
      if (!publicToken) {
        publicToken = crypto.randomBytes(32).toString('hex');
      }

      const updatedCalculation: Calculation = {
        ...calculation,
        isPublic: true,
        publicToken,
        updatedAt: new Date()
      };

      await firestore.collection(this.COLLECTION_NAME).doc(calculationId).set(updatedCalculation);
      
      const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/shared/${publicToken}`;
      
      logger.info(`Shared calculation ${calculationId} with token ${publicToken}`);
      
      return {
        publicToken,
        shareUrl
      };
    } catch (error) {
      logger.error('Error sharing calculation:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to share calculation', 500);
    }
  }
}