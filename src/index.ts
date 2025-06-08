/**
 * MCP Feedback Collector - Main Entry File
 */

// Export main classes and functions
export { MCPServer } from './server/mcp-server.js';
export { getConfig, createDefaultConfig, validateConfig } from './config/index.js';
export { logger } from './utils/logger.js';

// Export type definitions
export * from './types/index.js';

// Export version information
export const VERSION = '2.0.8';
