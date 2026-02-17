import type { JSONSchema, ToolResponse } from './context';

// Branded type for tool names (compile-time safety, zero runtime cost)
declare const toolNameBrand: unique symbol;
export type ToolName = string & { readonly [toolNameBrand]: 'ToolName' };

/**
 * Factory function to create validated ToolName
 */
export function toolName(name: string): ToolName {
  if (!name || name.length < 3 || name.length > 50) {
    throw new Error('Tool name must be 3-50 characters');
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error('Tool name must start with letter, contain only alphanumeric and underscore');
  }
  return name as ToolName;
}

/**
 * WebMCP Tool Definition
 */
export interface ModelContextTool {
  readonly name: ToolName;
  readonly description: string;
  readonly inputSchema: JSONSchema;
  readonly readOnlyHint?: boolean;
  execute(args: unknown): Promise<ToolResponse>;
}

/**
 * calculateMortgage tool input type
 */
export interface CalculateMortgageInput {
  readonly principal: number;
  readonly annualInterestRate: number;
  readonly loanTermYears: number;
  readonly currency?: string;
  readonly repaymentModel?: 'equalInstallments' | 'decreasingInstallments';
}

/**
 * calculateMortgage tool output type
 * Raw numeric values only - agent formats for user presentation
 */
export interface CalculateMortgageOutput {
  readonly monthlyPayment: number;
  readonly totalInterest: number;
  readonly totalCost: number;
  readonly termMonths: number;
  readonly amortizationSchedule: ReadonlyArray<{
    readonly payment: number;           // Payment number (1-based)
    readonly monthlyPayment: number;
    readonly principalPayment: number;
    readonly interestPayment: number;
    readonly balance: number;
    readonly totalInterest: number;     // Cumulative
    readonly totalPayment: number;      // Cumulative
  }>;
  readonly yearlyData: ReadonlyArray<{
    readonly year: number;
    readonly principal: number;
    readonly interest: number;
    readonly payment: number;
    readonly balance: number;
    readonly totalInterest: number;
  }>;
  readonly metadata?: {
    readonly currency: string;
    readonly repaymentModel: 'equalInstallments' | 'decreasingInstallments';
    readonly calculatedAt: string;      // ISO timestamp
  };
}
