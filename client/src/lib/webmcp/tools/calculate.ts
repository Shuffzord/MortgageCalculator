import { z } from 'zod';
import { calculateLoanDetails } from '@/lib/calculationEngine';
import type { LoanCalculationParams, CalculationResults } from '@/lib/types';
import { type ModelContextTool, type JSONSchema, type ToolResponse, toolName, type CalculateMortgageOutput } from '@/lib/webmcp';

/**
 * JSON Schema for WebMCP tool registration
 */
export const inputSchema: JSONSchema = {
  type: 'object',
  properties: {
    principal: {
      type: 'number',
      description: 'Loan amount',
      minimum: 0.01
    },
    annualInterestRate: {
      type: 'number',
      description: 'Annual rate as percentage (6.5 = 6.5%)',
      minimum: 0,
      maximum: 100
    },
    loanTermYears: {
      type: 'number',
      description: 'Loan term in years',
      minimum: 1,
      maximum: 50
    },
    currency: {
      type: 'string',
      description: 'Currency code',
      enum: ['USD', 'EUR', 'GBP', 'PLN']
    },
    repaymentModel: {
      type: 'string',
      enum: ['equalInstallments', 'decreasingInstallments']
    }
  },
  required: ['principal', 'annualInterestRate', 'loanTermYears']
};

/**
 * Zod schema for runtime validation with defensive type coercion
 */
const zodSchema = z.object({
  principal: z.coerce.number().min(0.01, 'Principal must be at least 0.01'),
  annualInterestRate: z.coerce.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%'),
  loanTermYears: z.coerce.number().int('Loan term must be a whole number').min(1, 'Loan term must be at least 1 year').max(50, 'Loan term cannot exceed 50 years'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'PLN']).default('USD'),
  repaymentModel: z.enum(['equalInstallments', 'decreasingInstallments']).default('equalInstallments')
});

/**
 * Map validated input to LoanCalculationParams
 */
function mapInputToLoanCalculationParams(
  input: z.infer<typeof zodSchema>
): LoanCalculationParams {
  return {
    principal: input.principal,
    interestRatePeriods: [{ startMonth: 1, interestRate: input.annualInterestRate }],
    loanTerm: input.loanTermYears,
    repaymentModel: input.repaymentModel,
    overpaymentPlans: [],
    startDate: new Date()
  };
}

/**
 * Format calculation results to CalculateMortgageOutput
 * Returns raw numeric values only - no formatted strings
 */
function formatResponse(
  results: CalculationResults,
  currency: string,
  repaymentModel: 'equalInstallments' | 'decreasingInstallments'
): CalculateMortgageOutput {
  return {
    monthlyPayment: results.monthlyPayment,
    totalInterest: results.totalInterest,
    totalCost: results.totalCost || (results.amortizationSchedule[results.amortizationSchedule.length - 1]?.totalPayment || 0),
    termMonths: results.amortizationSchedule.length,
    amortizationSchedule: results.amortizationSchedule.map(payment => ({
      payment: payment.payment,
      monthlyPayment: payment.monthlyPayment,
      principalPayment: payment.principalPayment,
      interestPayment: payment.interestPayment,
      balance: payment.balance,
      totalInterest: payment.totalInterest,
      totalPayment: payment.totalPayment
    })),
    yearlyData: results.yearlyData.map(year => ({
      year: year.year,
      principal: year.principal,
      interest: year.interest,
      payment: year.payment,
      balance: year.balance,
      totalInterest: year.totalInterest
    })),
    metadata: {
      currency,
      repaymentModel,
      calculatedAt: new Date().toISOString()
    }
  };
}

/**
 * Execute the calculateMortgage tool
 */
async function execute(args: unknown): Promise<ToolResponse> {
  // Validate input using Zod safeParse (non-throwing)
  const parseResult = zodSchema.safeParse(args);

  if (!parseResult.success) {
    // Return first error only with field path
    const firstError = parseResult.error.errors[0];
    const field = firstError.path.join('.');
    const message = firstError.message;

    return {
      content: [{
        type: 'error',
        text: JSON.stringify({ field, message })
      }],
      error: 'VALIDATION_ERROR'
    };
  }

  try {
    // Map input to calculation params
    const params = mapInputToLoanCalculationParams(parseResult.data);

    // Calculate loan details
    const results = calculateLoanDetails(params);

    // Format response with raw numeric values
    const output = formatResponse(
      results,
      parseResult.data.currency,
      parseResult.data.repaymentModel
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(output)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'error',
        text: error instanceof Error ? error.message : 'Calculation failed'
      }],
      error: 'CALCULATION_ERROR'
    };
  }
}

/**
 * calculateMortgage WebMCP tool definition
 */
export const calculateMortgageTool: ModelContextTool = {
  name: toolName('calculateMortgage'),
  description: 'Calculate mortgage payments, total interest, and amortization schedule',
  inputSchema,
  readOnlyHint: true,
  execute
};
