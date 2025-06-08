/**
 * MCP Feedback Collector - Configuration Management
 */

import { config as dotenvConfig } from 'dotenv';
import { Config, MCPError } from '../types/index.js';

// Load environment variables
dotenvConfig();

/**
 * Get environment variable value with default fallback
 */
function getEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get optional environment variable value
 */
function getOptionalEnvVar(key: string): string | undefined {
  return process.env[key] || undefined;
}

/**
 * Get numeric environment variable
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Invalid number for ${key}: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }

  return parsed;
}

/**
 * Get boolean environment variable
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;

  return value.toLowerCase() === 'true';
}

/**
 * Create default configuration
 */
export function createDefaultConfig(): Config {
  return {
    apiKey: process.env['MCP_API_KEY'],
    apiBaseUrl: getEnvVar('MCP_API_BASE_URL', 'https://api.ssopen.top'),
    defaultModel: getEnvVar('MCP_DEFAULT_MODEL', 'gpt-4o-mini'),
    webPort: getEnvNumber('MCP_WEB_PORT', 5000),
    dialogTimeout: getEnvNumber('MCP_DIALOG_TIMEOUT', 60000),
    enableChat: getEnvBoolean('MCP_ENABLE_CHAT', true),
    corsOrigin: getEnvVar('MCP_CORS_ORIGIN', '*'),
    maxFileSize: getEnvNumber('MCP_MAX_FILE_SIZE', 10485760), // 10MB
    logLevel: getEnvVar('LOG_LEVEL', 'info'),
    // Added: Server host configuration
    serverHost: getOptionalEnvVar('MCP_SERVER_HOST'),
    serverBaseUrl: getOptionalEnvVar('MCP_SERVER_BASE_URL'),
    // Added: URL and port optimization configuration
    forcePort: getEnvBoolean('MCP_FORCE_PORT', false),
    killProcessOnPortConflict: getEnvBoolean('MCP_KILL_PORT_PROCESS', false),
    useFixedUrl: getEnvBoolean('MCP_USE_FIXED_URL', true),  // Fixed URL enabled by default
    cleanupPortOnStart: getEnvBoolean('MCP_CLEANUP_PORT_ON_START', true)  // Port cleanup enabled by default
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: Config): void {
  // Validate port range
  if (config.webPort < 1024 || config.webPort > 65535) {
    throw new MCPError(
      `Invalid port number: ${config.webPort}. Must be between 1024 and 65535.`,
      'INVALID_PORT'
    );
  }

  // Validate timeout - extended support up to 60000 seconds (approximately 16.7 hours)
  if (config.dialogTimeout < 10 || config.dialogTimeout > 60000) {
    throw new MCPError(
      `Invalid timeout: ${config.dialogTimeout}. Must be between 10 and 60000 seconds.`,
      'INVALID_TIMEOUT'
    );
  }

  // Validate file size limit
  if (config.maxFileSize < 1024 || config.maxFileSize > 104857600) { // 1KB - 100MB
    throw new MCPError(
      `Invalid max file size: ${config.maxFileSize}. Must be between 1KB and 100MB.`,
      'INVALID_FILE_SIZE'
    );
  }

  // Validate API base URL
  try {
    new URL(config.apiBaseUrl);
  } catch {
    throw new MCPError(
      `Invalid API base URL: ${config.apiBaseUrl}`,
      'INVALID_API_URL'
    );
  }

  // Validate log level
  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLogLevels.includes(config.logLevel)) {
    throw new MCPError(
      `Invalid log level: ${config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`,
      'INVALID_LOG_LEVEL'
    );
  }
}

/**
 * Get validated configuration
 */
export function getConfig(): Config {
  const config = createDefaultConfig();
  validateConfig(config);
  return config;
}

/**
 * Display configuration information (hiding sensitive information)
 */
export function displayConfig(config: Config): void {
  console.log('📋 MCP Feedback Collector Configuration:');
  console.log(`  API Base URL: ${config.apiBaseUrl}`);
  console.log(`  Default Model: ${config.defaultModel}`);
  console.log(`  Web Port: ${config.webPort}`);
  console.log(`  Dialog Timeout: ${config.dialogTimeout}s`);
  console.log(`  Enable Chat: ${config.enableChat}`);
  console.log(`  CORS Origin: ${config.corsOrigin}`);
  console.log(`  Max File Size: ${(config.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  Log Level: ${config.logLevel}`);
  console.log(`  API Key: ${config.apiKey ? '***configured***' : 'not set'}`);
  console.log(`  Server Host: ${config.serverHost || 'auto-detect'}`);
  console.log(`  Server Base URL: ${config.serverBaseUrl || 'auto-generate'}`);
  console.log(`  Force Port: ${config.forcePort ? 'enabled' : 'disabled'}`);
  console.log(`  Kill Port Process: ${config.killProcessOnPortConflict ? 'enabled' : 'disabled'}`);
  console.log(`  Use Fixed URL: ${config.useFixedUrl ? 'enabled' : 'disabled'}`);
  console.log(`  Cleanup Port On Start: ${config.cleanupPortOnStart ? 'enabled' : 'disabled'}`);
}
