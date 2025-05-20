/**
 * Type definitions for the MCP Puppeteer client
 */

// Response type for MCP Puppeteer operations
export interface MCPResponse {
  success: boolean;
  result?: any;
  error?: string;
}

// MCP Puppeteer screenshot options
export interface ScreenshotOptions {
  name: string;
  selector?: string;
  width?: number;
  height?: number;
  encoded?: boolean;
}

// MCP Puppeteer client interface
export interface MCPPuppeteerClient {
  // Navigate to a URL
  navigate: (url: string, options?: { launchOptions?: any, allowDangerous?: boolean }) => Promise<MCPResponse>;
  
  // Take a screenshot
  screenshot: (options: ScreenshotOptions) => Promise<MCPResponse>;
  
  // Click an element
  click: (selector: string) => Promise<MCPResponse>;
  
  // Fill a form field
  fill: (selector: string, value: string) => Promise<MCPResponse>;
  
  // Select an option from a dropdown
  select: (selector: string, value: string) => Promise<MCPResponse>;
  
  // Hover over an element
  hover: (selector: string) => Promise<MCPResponse>;
  
  // Execute JavaScript in the browser
  evaluate: (script: string) => Promise<MCPResponse>;
}