// Re-export all WebMCP tools
export { calculateMortgageTool, inputSchema as calculateMortgageInputSchema } from './calculate';

// Export array of all available tools for registration
import { calculateMortgageTool } from './calculate';

export const allTools = [calculateMortgageTool] as const;
