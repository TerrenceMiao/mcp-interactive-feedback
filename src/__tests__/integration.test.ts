/**
 * Integration Tests - Complete Feedback Collection Process
 */

import { MCPServer } from '../server/mcp-server.js';
import { createDefaultConfig } from '../config/index.js';
import { ImageData } from '../types/index.js';

describe('Integration Tests', () => {
  let mcpServer: MCPServer;
  let config: any;

  beforeAll(async () => {
    config = createDefaultConfig();
    config.webPort = 0; // Use random port
    config.logLevel = 'error'; // Reduce test logs
    mcpServer = new MCPServer(config);
  });

  afterAll(async () => {
    if (mcpServer) {
      await mcpServer.stop();
    }
  });

  describe('Web Server Startup', () => {
    test('should be able to start web server', async () => {
      await mcpServer.startWebOnly();
      
      const status = mcpServer.getStatus();
      expect(status.webRunning).toBe(true);
      expect(status.webPort).toBeGreaterThan(0);
    }, 10000);

    test('should be able to get server status', () => {
      const status = mcpServer.getStatus();
      
      expect(status).toMatchObject({
        webRunning: true,
        webPort: expect.any(Number),
        mcpRunning: false
      });
    });
  });

  describe('API Endpoint Tests', () => {
    test('health check endpoint should work properly', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });
    });

    test('config endpoint should return configuration information', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/api/config`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        api_key: null,
        api_base_url: expect.any(String),
        model: expect.any(String),
        enable_chat: expect.any(Boolean),
        max_file_size: expect.any(Number)
      });
    });

    test('test session creation endpoint', async () => {
      const status = mcpServer.getStatus();
      const testData = {
        work_summary: 'This is a work report for integration testing',
        timeout_seconds: 60
      };
      
      const response = await fetch(`http://localhost:${status.webPort}/api/test-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        session_id: expect.any(String),
        feedback_url: expect.any(String)
      });
      
      // Verify session ID format
      expect(data.session_id).toMatch(/^feedback_\d+_[a-z0-9]+$/);
      
      // Verify feedback URL format
      expect(data.feedback_url).toContain(`localhost:${status.webPort}`);
      expect(data.feedback_url).toContain(`session=${data.session_id}`);
    });
  });

  describe('Static File Service', () => {
    test('should be able to access home page', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });

    test('should be able to access JavaScript files', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/app.js`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('javascript');
    });

    test('should be able to access CSS files', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/style.css`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('css');
    });

    test('should be able to access test page', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/test.html`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });
  });

  describe('Error Handling', () => {
    test('non-existent paths should return 404', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/nonexistent`);
      
      expect(response.status).toBe(404);
    });

    test('invalid API requests should return error', async () => {
      const status = mcpServer.getStatus();
      const response = await fetch(`http://localhost:${status.webPort}/api/test-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Missing required fields
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        error: expect.any(String)
      });
    });
  });

  describe('Performance Tests', () => {
    test('server startup time should be reasonable', async () => {
      const startTime = Date.now();
      
      const newConfig = createDefaultConfig();
      newConfig.webPort = 0;
      newConfig.logLevel = 'error';
      const testServer = new MCPServer(newConfig);
      
      await testServer.startWebOnly();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Start within 5 seconds
      
      await testServer.stop();
    }, 10000);

    test('API response time should be reasonable', async () => {
      const status = mcpServer.getStatus();
      const startTime = Date.now();
      
      const response = await fetch(`http://localhost:${status.webPort}/health`);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Respond within 1 second
      expect(response.status).toBe(200);
    });

    test('concurrent request handling', async () => {
      const status = mcpServer.getStatus();
      const requests = [];
      
      // Create 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          fetch(`http://localhost:${status.webPort}/health`)
        );
      }
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed
      for (const response of responses) {
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Memory and Resource Management', () => {
    test('multiple start/stop cycles should not cause memory leaks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Multiple server start/stop cycles
      for (let i = 0; i < 3; i++) {
        const testConfig = createDefaultConfig();
        testConfig.webPort = 0;
        testConfig.logLevel = 'error';
        const testServer = new MCPServer(testConfig);
        
        await testServer.startWebOnly();
        await testServer.stop();
      }
      
      // Force garbage collection (if available)
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory growth should be within reasonable range (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, 30000);
  });
});
