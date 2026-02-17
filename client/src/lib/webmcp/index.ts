/**
 * WebMCP Integration Module
 *
 * Provides types and utilities for WebMCP tool registration.
 * Import types from '@/lib/webmcp' for clean imports.
 *
 * @example
 * import type { ModelContext, ModelContextTool, ToolName } from '@/lib/webmcp';
 * import { toolName } from '@/lib/webmcp';
 */

// Re-export all types from types barrel
export type {
  ModelContext,
  ModelContextTool,
  ToolName,
  CalculateMortgageInput,
  CalculateMortgageOutput,
  JSONSchema,
  Content,
  ToolResponse,
} from './types';

// Re-export factory functions
export { toolName } from './types';

// Tools
export { calculateMortgageTool, calculateMortgageInputSchema, allTools } from './tools';
