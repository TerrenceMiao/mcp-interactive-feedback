/**
 * MCP Feedback Collector - MCP Server Implementation
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolResult, TextContent, ImageContent } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Config, CollectFeedbackParams, MCPError, FeedbackData, ImageData } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { WebServer } from './web-server.js';

/**
 * MCP Server Class
 */
export class MCPServer {
  private mcpServer: McpServer;
  private webServer: WebServer;
  private config: Config;
  private isRunning = false;

  constructor(config: Config) {
    this.config = config;

    // Create MCP server instance
    this.mcpServer = new McpServer({
      name: 'mcp-interactive-feedback',
      version: '2.0.8'
    }, {
      capabilities: {
        tools: {}
      }
    });

    // Set initialization complete callback
    this.mcpServer.server.oninitialized = () => {
      logger.info('✅ MCP initialization complete');
    };

    // Create Web server instance
    this.webServer = new WebServer(config);

    // Register MCP tool functions
    this.registerTools();
  }

  /**
   * Register MCP tool functions
   */
  private registerTools(): void {
    // Register interactive-feedback tool - using new registerTool method
    this.mcpServer.registerTool(
      'interactive-feedback',
      {
        description: 'Collect feedback from users about AI work summary. This tool opens a web interface for users to provide feedback on the AI\'s work.',
        inputSchema: {
          work_summary: z.string().describe('AI work report content, describing the work completed and results by AI')
        }
      },
      async (args: { work_summary: string }): Promise<CallToolResult> => {
        const params: CollectFeedbackParams = {
          work_summary: args.work_summary
        };

        logger.mcp('interactive-feedback', params);

        try {
          const result = await this.collectFeedback(params);
          logger.mcp('interactive-feedback', params, result);
          return result;
        } catch (error) {
          logger.error('interactive-feedback tool call failed:', error);

          if (error instanceof MCPError) {
            throw error;
          }

          throw new MCPError(
            'Failed to collect feedback',
            'interactive-feedback_ERROR',
            error
          );
        }
      }
    );

    if (logger.getLevel() !== 'silent') {
      logger.info('MCP tool functions registration complete');
    }
  }

  /**
   * Implement interactive-feedback functionality
   */
  private async collectFeedback(params: CollectFeedbackParams): Promise<CallToolResult> {
    const { work_summary } = params;
    const timeout_seconds = this.config.dialogTimeout;

    logger.info(`Starting to collect feedback, work report length: ${work_summary.length} characters, timeout: ${timeout_seconds} seconds`);

    try {
      // Start Web server (if not running)
      if (!this.webServer.isRunning()) {
        await this.webServer.start();
      }

      // Collect user feedback
      const feedback = await this.webServer.collectFeedback(work_summary, timeout_seconds);

      logger.info(`Feedback collection complete, received ${feedback.length} feedback items`);

      // Format feedback data for MCP content (supports images)
      const content = this.formatFeedbackForMCP(feedback);

      return {
        content,
        isError: false
      };

    } catch (error) {
      logger.error('Feedback collection failed:', error);

      const errorMessage = error instanceof MCPError ? error.message : 'Failed to collect user feedback';

      return {
        content: [{
          type: 'text',
          text: `Error: ${errorMessage}`
        }],
        isError: true
      };
    }
  }

  /**
   * Format feedback data for MCP content (supports image display)
   */
  private formatFeedbackForMCP(feedback: FeedbackData[]): (TextContent | ImageContent)[] {
    if (feedback.length === 0) {
      return [{
        type: 'text',
        text: 'No user feedback received'
      }];
    }

    const content: (TextContent | ImageContent)[] = [];

    // Add summary text
    content.push({
      type: 'text',
      text: `Received ${feedback.length} user feedback items:\n`
    });

    feedback.forEach((item, index) => {
      // Add feedback title
      content.push({
        type: 'text',
        text: `\n--- Feedback ${index + 1} ---`
      });

      // Add text feedback
      if (item.text) {
        content.push({
          type: 'text',
          text: `Text feedback: ${item.text}`
        });
      }

      // Add images (converted to base64 format)
      if (item.images && item.images.length > 0) {
        content.push({
          type: 'text',
          text: `Number of images: ${item.images.length}`
        });

        item.images.forEach((img: ImageData, imgIndex: number) => {
          // Add image information
          content.push({
            type: 'text',
            text: `Image ${imgIndex + 1}: ${img.name} (${img.type}, ${(img.size / 1024).toFixed(1)}KB)`
          });

          // Add image content (Cursor format)
          if (img.data) {
            // Ensure pure base64 data (remove data:image/...;base64, prefix)
            const base64Data = img.data.replace(/^data:image\/[^;]+;base64,/, '');

            content.push({
              type: 'image',
              data: base64Data, // Pure base64 string
              mimeType: img.type
            });
          }
        });
      }

      // Add timestamp
      content.push({
        type: 'text',
        text: `Submission time: ${new Date(item.timestamp).toLocaleString()}\n`
      });
    });

    return content;
  }

  /**
   * Format feedback data as text (preserved for other purposes)
   */
  private formatFeedbackAsText(feedback: FeedbackData[]): string {
    if (feedback.length === 0) {
      return 'No user feedback received';
    }
    
    const parts: string[] = [];
    
    // Add summary text
    parts.push(`Received ${feedback.length} user feedback items:\n`);
    
    feedback.forEach((item, index) => {
      parts.push(`--- Feedback ${index + 1} ---`);
      
      if (item.text) {
        parts.push(`Text feedback: ${item.text}`);
      }
      
      if (item.images && item.images.length > 0) {
        parts.push(`Number of images: ${item.images.length}`);
        item.images.forEach((img, imgIndex) => {
          parts.push(`  Image ${imgIndex + 1}: ${img.name} (${img.type}, ${(img.size / 1024).toFixed(1)}KB)`);
        });
      }
      
      parts.push(`Submission time: ${new Date(item.timestamp).toLocaleString()}`);
      parts.push('');
    });
    
    return parts.join('\n');
  }

  /**
   * Start MCP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('MCP server is already running');
      return;
    }
    
    try {
      logger.info('Starting MCP server...');
      
      // Start Web server
      await this.webServer.start();
      
      // Connect MCP transport
      const transport = new StdioServerTransport();
      
      // Set transport error handler
      transport.onerror = (error) => {
        logger.error('MCP transport error:', error);
      };
      
      transport.onclose = () => {
        logger.info('MCP transport connection closed');
        this.isRunning = false;
      };
      
      // Add message debugging
      const originalOnMessage = transport.onmessage;
      transport.onmessage = (message) => {
        logger.debug('📥 Received MCP message:', JSON.stringify(message, null, 2));
        if (originalOnMessage) {
          originalOnMessage(message);
        }
      };

      const originalSend = transport.send.bind(transport);
      transport.send = (message) => {
        logger.debug('📤 Sending MCP message:', JSON.stringify(message, null, 2));
        return originalSend(message);
      };

      await this.mcpServer.connect(transport);
      
      this.isRunning = true;
      logger.info('✅ MCP server started successfully');
      
    } catch (error) {
      logger.error('MCP server start failed:', error);
      throw new MCPError(
        'Failed to start MCP server',
        'SERVER_START_ERROR',
        error
      );
    }
  }

  /**
   * Start Web mode only
   */
  async startWebOnly(): Promise<void> {
    try {
      logger.info('Starting Web mode...');
      
      // Start Web server only
      await this.webServer.start();
      
      this.isRunning = true;
      logger.info('✅ Web server started successfully');
      
      // Keep process running
      process.stdin.resume();
      
    } catch (error) {
      logger.error('Web server start failed:', error);
      throw new MCPError(
        'Failed to start web server',
        'WEB_SERVER_START_ERROR',
        error
      );
    }
  }

  /**
   * Stop server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      logger.info('Stopping server...');
      
      // Stop Web server
      await this.webServer.stop();
      
      // Close MCP server
      if (this.mcpServer) {
        await this.mcpServer.close();
      }
      
      this.isRunning = false;
      logger.info('✅ Server stopped');
      
    } catch (error) {
      logger.error('Error stopping server:', error);
      throw new MCPError(
        'Failed to stop server',
        'SERVER_STOP_ERROR',
        error
      );
    }
  }

  /**
   * Get server status
   */
  getStatus(): { running: boolean; webPort?: number | undefined } {
    return {
      running: this.isRunning,
      webPort: this.webServer.isRunning() ? this.webServer.getPort() : undefined
    };
  }
}
