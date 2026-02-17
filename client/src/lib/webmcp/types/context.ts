/**
 * JSON Schema type (simplified for WebMCP inputSchema)
 */
export type JSONSchema = {
  readonly type: 'object' | 'string' | 'number' | 'boolean' | 'array' | 'null';
  readonly properties?: Readonly<Record<string, JSONSchema>>;
  readonly required?: ReadonlyArray<string>;
  readonly description?: string;
  readonly items?: JSONSchema;
  readonly enum?: ReadonlyArray<string | number>;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly [key: string]: unknown;
};

/**
 * Content block in tool response
 */
export interface Content {
  readonly type: 'text' | 'image' | 'error';
  readonly text?: string;
  readonly data?: string;
  readonly mimeType?: string;
}

/**
 * Tool execution response
 */
export interface ToolResponse {
  readonly content: ReadonlyArray<Content>;
  readonly error?: string;
  readonly code?: string;
}
