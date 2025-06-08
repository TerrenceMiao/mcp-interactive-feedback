#!/usr/bin/env node

/**
 * MCP Feedback Collector - CLI Entry
 */

import { program } from 'commander';
import fetch from 'node-fetch';
import { getConfig, displayConfig } from './config/index.js';
import { logger } from './utils/logger.js';
import { MCPServer } from './server/mcp-server.js';
import { MCPError } from './types/index.js';

// Version information
const VERSION = '2.0.8';

// Detect MCP mode at the beginning and set log level
// Improved MCP mode detection: check multiple conditions
const isMCPMode = !process.stdin.isTTY ||
                  process.env['NODE_ENV'] === 'mcp' ||
                  process.argv.includes('--mcp-mode');

if (isMCPMode) {
  logger.disableColors();
  logger.setLevel('silent' as any);
}

/**
 * Display welcome message
 */
function showWelcome(): void {
  console.log('🎯 MCP Feedback Collector v' + VERSION);
  console.log('Modern Node.js-based feedback collector\n');
}

/**
 * Start MCP server
 */
async function startMCPServer(options: {
  port?: number;
  web?: boolean;
  config?: string;
  debug?: boolean;
}): Promise<void> {
  try {
    // Load configuration
    const config = getConfig();

    if (!isMCPMode) {
      // Interactive mode: display welcome message and set log level
      showWelcome();
      logger.setLevel(config.logLevel as any);
    }

    // Apply command line parameters
    if (options.port) {
      config.webPort = options.port;
    }

    // Set debug mode (only in non-MCP mode)
    if (!isMCPMode && (options.debug || process.env['LOG_LEVEL'] === 'debug')) {
      config.logLevel = 'debug';

      // Enable file logging
      logger.enableFileLogging();
      logger.setLevel('debug');
      logger.debug('🐛 Debug mode enabled, logs will be saved to file');
    }
    
    // Display configuration information
    if (logger.getLevel() === 'debug') {
      displayConfig(config);
      console.log('');
    }
    
    // Create and start MCP server
    const server = new MCPServer(config);
    
    if (options.web) {
      // Web-only mode
      logger.info('Starting Web mode...');
      await server.startWebOnly();
    } else {
      // Full MCP mode
      logger.info('Starting MCP server...');
      await server.start();
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT signal, shutting down server...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM signal, shutting down server...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    if (error instanceof MCPError) {
      logger.error(`MCP error [${error.code}]: ${error.message}`);
      if (error.details) {
        logger.debug('Error details:', error.details);
      }
    } else if (error instanceof Error) {
      logger.error('Startup failed:', error.message);
      logger.debug('Error stack:', error.stack);
    } else {
      logger.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

/**
 * Display health check information
 */
async function healthCheck(): Promise<void> {
  try {
    const config = getConfig();
    console.log('✅ Configuration validation passed');
    console.log(`📡 API endpoint: ${config.apiBaseUrl}`);
    console.log(`🔑 API key: ${config.apiKey ? 'configured' : 'not configured'}`);
    console.log(`🌐 Web port: ${config.webPort}`);
    console.log(`⏱️ Timeout: ${config.dialogTimeout} seconds`);
    
    // TODO: Add more health check items
    // - Port availability check
    // - API connection test
    // - Dependencies check
    
  } catch (error) {
    if (error instanceof MCPError) {
      console.error(`❌ Configuration error [${error.code}]: ${error.message}`);
    } else {
      console.error('❌ Health check failed:', error);
    }
    process.exit(1);
  }
}

// Configure CLI commands
program
  .name('mcp-interactive-feedback')
  .description('Node.js based MCP feedback collector')
  .version(VERSION);

// Main command - Start server
program
  .command('start', { isDefault: true })
  .description('Start MCP Feedback Collector')
  .option('-p, --port <number>', 'Specify web server port', parseInt)
  .option('-w, --web', 'Start web mode only (without MCP server)')
  .option('-c, --config <path>', 'Specify configuration file path')
  .option('-d, --debug', 'Enable debug mode (show detailed MCP communication logs)')
  .option('--mcp-mode', 'Force enable MCP mode (for debugging)')
  .action(startMCPServer);

// Health check command
program
  .command('health')
  .description('Check configuration and system status')
  .action(healthCheck);

// Configuration display command
program
  .command('config')
  .description('Display current configuration')
  .action(() => {
    try {
      const config = getConfig();
      displayConfig(config);
    } catch (error) {
      console.error('Configuration loading failed:', error);
      process.exit(1);
    }
  });

// Performance monitoring command
program
  .command('metrics')
  .description('Display performance metrics')
  .option('-f, --format <format>', 'Output format (json|text)', 'text')
  .action(async (options) => {
    try {
      showWelcome();

      const config = getConfig();
      logger.setLevel('error'); // Reduce log output

      logger.info('🔍 Getting performance metrics...');

      // Create MCP server instance
      const server = new MCPServer(config);

      // Start web server
      await server.startWebOnly();

      // Wait for server to fully start
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const response = await fetch(`http://localhost:${server.getStatus().webPort}/api/metrics`);
        const metrics = await response.json();

        if (options.format === 'json') {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          const reportResponse = await fetch(`http://localhost:${server.getStatus().webPort}/api/performance-report`);
          const report = await reportResponse.text();
          console.log(report);
        }

      } catch (error) {
        logger.error('❌ Failed to get performance metrics:', error);
      }

      await server.stop();

    } catch (error) {
      logger.error('Performance monitoring failed:', error);
      process.exit(1);
    }
  });

// Test MCP tool function command
program
  .command('test-feedback')
  .description('Test interactive-feedback tool function')
  .option('-m, --message <message>', 'Test work report content', 'This is a test work report to verify if the interactive-feedback function is working properly.')
  .action(async (options) => {
    try {
      showWelcome();

      const config = getConfig();
      logger.setLevel(config.logLevel as any);

      logger.info('🧪 Starting test of interactive-feedback tool function...');

      // Create MCP server instance
      const server = new MCPServer(config);

      // Start web server
      await server.startWebOnly();

      // Wait for server to fully start
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create test session
      logger.info('📋 Creating test session...');

      const testParams = {
        work_summary: options.message
      };

      try {
        const response = await fetch(`http://localhost:${server.getStatus().webPort}/api/test-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testParams)
        });

        const result = await response.json() as any;

        if (result.success) {
          logger.info('✅ Test session created successfully');
          logger.info(`📋 Session ID: ${result.session_id}`);
          logger.info(`🌐 Feedback page: ${result.feedback_url}`);

          // Automatically open browser
          try {
            const open = await import('open');
            await open.default(result.feedback_url);
            logger.info('🚀 Browser automatically opened feedback page');
          } catch (error) {
            logger.warn('Unable to automatically open browser, please manually visit above URL');
          }

          logger.info('💡 You can now test the complete feedback process in the browser');
          logger.info(`⏱️ Session will timeout in ${config.dialogTimeout} seconds`);

        } else {
          logger.error('❌ Test session creation failed:', result.error);
        }
      } catch (error) {
        logger.error('❌ Error creating test session:', error);
      }

      // Keep process running
      process.stdin.resume();

    } catch (error) {
      logger.error('Test failed:', error);
      if (error instanceof Error) {
        logger.error('Error details:', error.message);
        logger.error('Error stack:', error.stack);
      }
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
