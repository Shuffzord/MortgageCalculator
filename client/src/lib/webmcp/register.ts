/**
 * WebMCP Tool Registration
 *
 * Handles registration and unregistration of WebMCP tools with navigator.modelContext.
 * Includes feature detection for graceful degradation in browsers without WebMCP support.
 *
 * @module register
 */

import { allTools } from '@/lib/webmcp/tools';

/**
 * Type guard to check if navigator.modelContext exists
 */
function hasModelContext(
  navigator: Navigator
): navigator is Navigator & { modelContext: any } {
  return 'modelContext' in navigator;
}

/**
 * Register all WebMCP tools with navigator.modelContext
 *
 * Silently skips registration if WebMCP is unavailable (feature detection).
 * Logs warnings in development mode when WebMCP is unavailable or registration fails.
 *
 * @example
 * ```typescript
 * // Call on app initialization
 * registerWebMCPTools();
 * ```
 */
export function registerWebMCPTools(): void {
  // Feature detection: check if browser supports WebMCP
  if (!hasModelContext(navigator)) {
    if (import.meta.env.DEV) {
      console.warn(
        '[WebMCP] navigator.modelContext unavailable - WebMCP tools not registered. ' +
          'Enable chrome://flags/#enable-webmcp-testing in Chrome 146+ to use WebMCP features.'
      );
    }
    return;
  }

  // Register each tool with the browser API
  for (const tool of allTools) {
    try {
      navigator.modelContext.registerTool(tool);
      if (import.meta.env.DEV) {
        console.log(`[WebMCP] Registered tool: ${tool.name}`);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          `[WebMCP] Failed to register tool "${tool.name}":`,
          error
        );
      }
      // Silent failure in production - graceful degradation
    }
  }
}

/**
 * Unregister all WebMCP tools from navigator.modelContext
 *
 * Silently skips unregistration if WebMCP is unavailable (feature detection).
 * Logs warnings in development mode when WebMCP is unavailable or unregistration fails.
 *
 * Useful for cleanup during HMR (Hot Module Replacement) or app teardown.
 *
 * @example
 * ```typescript
 * // Call on cleanup/teardown
 * unregisterWebMCPTools();
 * ```
 */
export function unregisterWebMCPTools(): void {
  // Feature detection: check if browser supports WebMCP
  if (!hasModelContext(navigator)) {
    if (import.meta.env.DEV) {
      console.warn(
        '[WebMCP] navigator.modelContext unavailable - cannot unregister tools.'
      );
    }
    return;
  }

  // Unregister each tool from the browser API
  for (const tool of allTools) {
    try {
      navigator.modelContext.unregisterTool(tool.name);
      if (import.meta.env.DEV) {
        console.log(`[WebMCP] Unregistered tool: ${tool.name}`);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          `[WebMCP] Failed to unregister tool "${tool.name}":`,
          error
        );
      }
      // Silent failure in production - graceful degradation
    }
  }
}
