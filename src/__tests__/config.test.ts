/**
 * Configuration Management Module Tests
 */

import { createDefaultConfig, validateConfig } from '../config/index.js';
import { MCPError } from '../types/index.js';

describe('Configuration Management', () => {
  beforeEach(() => {
    // Clean up environment variables
    delete process.env.MCP_WEB_PORT;
    delete process.env.MCP_DIALOG_TIMEOUT;
    delete process.env.MCP_API_BASE_URL;
    delete process.env.LOG_LEVEL;
  });

  describe('createDefaultConfig', () => {
    test('should create default configuration', () => {
      const config = createDefaultConfig();
      
      expect(config).toMatchObject({
        apiBaseUrl: 'https://api.ssopen.top',
        defaultModel: 'gpt-4o-mini',
        webPort: 5000,
        dialogTimeout: 60000,
        enableChat: true,
        corsOrigin: '*',
        maxFileSize: 10485760,
        logLevel: 'info'
      });
      
      expect(config.apiKey).toBeUndefined();
    });

    test('should override default values with environment variables', () => {
      process.env.MCP_WEB_PORT = '8080';
      process.env.MCP_DIALOG_TIMEOUT = '600';
      process.env.MCP_API_BASE_URL = 'https://custom.api.com';
      process.env.LOG_LEVEL = 'debug';
      
      const config = createDefaultConfig();
      
      expect(config.webPort).toBe(8080);
      expect(config.dialogTimeout).toBe(600);
      expect(config.apiBaseUrl).toBe('https://custom.api.com');
      expect(config.logLevel).toBe('debug');
    });

    test('should handle invalid numeric environment variables', () => {
      process.env.MCP_WEB_PORT = 'invalid';
      process.env.MCP_DIALOG_TIMEOUT = 'not-a-number';
      
      const config = createDefaultConfig();
      
      expect(config.webPort).toBe(5000); // fall back to default value
      expect(config.dialogTimeout).toBe(60000); // fall back to default value
    });
  });

  describe('validateConfig', () => {
    test('should validate valid configuration', () => {
      const config = createDefaultConfig();
      
      expect(() => validateConfig(config)).not.toThrow();
    });

    test('should reject invalid port', () => {
      const config = createDefaultConfig();
      config.webPort = 80; // less than 1024
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid port number');
    });

    test('should reject too large port', () => {
      const config = createDefaultConfig();
      config.webPort = 70000; // greater than 65535
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid port number');
    });

    test('should reject invalid timeout', () => {
      const config = createDefaultConfig();
      config.dialogTimeout = 5; // less than 10 seconds
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid timeout');
    });

    test('should reject too long timeout', () => {
      const config = createDefaultConfig();
      config.dialogTimeout = 70000; // greater than 60000 seconds

      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid timeout');
    });

    test('should reject invalid file size', () => {
      const config = createDefaultConfig();
      config.maxFileSize = 500; // less than 1KB
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid max file size');
    });

    test('should reject too large file size', () => {
      const config = createDefaultConfig();
      config.maxFileSize = 200 * 1024 * 1024; // greater than 100MB
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid max file size');
    });

    test('should reject invalid API URL', () => {
      const config = createDefaultConfig();
      config.apiBaseUrl = 'not-a-valid-url';
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid API base URL');
    });

    test('should reject invalid log level', () => {
      const config = createDefaultConfig();
      config.logLevel = 'invalid-level';
      
      expect(() => validateConfig(config)).toThrow(MCPError);
      expect(() => validateConfig(config)).toThrow('Invalid log level');
    });

    test('should accept valid log levels', () => {
      const config = createDefaultConfig();
      const validLevels = ['error', 'warn', 'info', 'debug'];
      
      for (const level of validLevels) {
        config.logLevel = level;
        expect(() => validateConfig(config)).not.toThrow();
      }
    });
  });
});
