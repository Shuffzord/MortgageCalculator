/**
 * WebMCP Navigator Augmentation
 * Extends the global Navigator interface to include modelContext API
 *
 * @see https://webmcp.link/
 * @requires Chrome 146+ with chrome://flags/#enable-webmcp-testing
 */

import type { ModelContext } from '@/lib/webmcp/types';

export {}; // Required: marks file as module for declare global

declare global {
  interface Navigator {
    /**
     * WebMCP Model Context API
     * Available in Chrome 146+ with WebMCP flag enabled
     * @see https://webmcp.link/
     */
    readonly modelContext?: ModelContext;
  }
}
