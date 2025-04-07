/**
 * MCP Server Manifest
 */
export interface MCPServerManifest {
  schema_version: string;
  name: string;
  description: string;
  tools: MCPTool[];
  resources?: MCPResource[];
}

/**
 * MCP Tool Definition
 */
export interface MCPTool {
  id: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, MCPParameter>;
    required?: string[];
  };
}

/**
 * MCP Resource Definition
 */
export interface MCPResource {
  id: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, MCPParameter>;
    required?: string[];
  };
}

/**
 * MCP Parameter Definition
 */
export interface MCPParameter {
  type: string;
  description: string;
  default?: any;
}

/**
 * MCP Tool Request
 */
export interface MCPToolRequest {
  tool_id: string;
  parameters: Record<string, any>;
}

/**
 * MCP Tool Response
 */
export interface MCPToolResponse {
  status: 'success' | 'error' | 'timeout';
  result?: any;
  error?: string;
  log_id?: string;
  partial_result?: any;
  is_complete?: boolean;
  message?: string;
}

/**
 * MCP Resource Request
 */
export interface MCPResourceRequest {
  resource_id: string;
  parameters: Record<string, any>;
}

/**
 * MCP Resource Response
 */
export interface MCPResourceResponse {
  status: 'success' | 'error';
  content?: any;
  metadata?: Record<string, any>;
  error?: string;
}
