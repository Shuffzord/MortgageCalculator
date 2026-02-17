import type { ModelContextTool, ToolName } from './tools';

/**
 * ModelContext API - Entry point for WebMCP tool registration
 * Available in Chrome 146+ with chrome://flags/#enable-webmcp-testing
 */
export interface ModelContext {
  /**
   * Register a tool that AI agents can discover and invoke
   */
  registerTool(tool: ModelContextTool): Promise<void>;

  /**
   * Unregister a previously registered tool
   */
  unregisterTool(name: ToolName): Promise<void>;
}
