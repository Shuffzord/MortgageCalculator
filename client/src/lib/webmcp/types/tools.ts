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
 */
export interface CalculateMortgageOutput {
  readonly summary: {
    readonly monthlyPayment: string;
    readonly totalInterest: string;
    readonly totalCost: string;
    readonly termLength: string;
  };
  readonly details: {
    readonly monthlyPaymentRaw: number;
    readonly totalInterestRaw: number;
    readonly termMonths: number;
  };
  readonly yearlyBreakdown: ReadonlyArray<{
    readonly year: number;
    readonly principalPaid: string;
    readonly interestPaid: string;
    readonly balance: string;
  }>;
  readonly naturalLanguageSummary: string;
}
