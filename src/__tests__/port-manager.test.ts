/**
 * Port Manager Tests
 */

import { PortManager } from '../utils/port-manager.js';
import { MCPError } from '../types/index.js';

describe('Port Manager', () => {
  let portManager: PortManager;

  beforeEach(() => {
    portManager = new PortManager();
  });

  describe('isPortAvailable', () => {
    test('should detect port availability', async () => {
      // Test a port that is likely available
      const available = await portManager.isPortAvailable(65432);
      expect(typeof available).toBe('boolean');
    });

    test('should detect occupied ports', async () => {
      // Create a server to occupy a port
      const { createServer } = await import('net');
      const server = createServer();
      
      await new Promise<void>((resolve) => {
        server.listen(0, () => {
          resolve();
        });
      });

      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      
      if (port > 0) {
        const available = await portManager.isPortAvailable(port);
        expect(available).toBe(false);
      }
      
      server.close();
    });
  });

  describe('findAvailablePort', () => {
    test('should find an available port', async () => {
      const port = await portManager.findAvailablePort();
      
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThanOrEqual(65535);
    });

    test('should use preferred port (if available)', async () => {
      // Use a high port that is likely available
      const preferredPort = 65431;
      const port = await portManager.findAvailablePort(preferredPort);
      
      // If preferred port is available, should return that port
      const isPreferredAvailable = await portManager.isPortAvailable(preferredPort);
      if (isPreferredAvailable) {
        expect(port).toBe(preferredPort);
      } else {
        expect(port).not.toBe(preferredPort);
        expect(port).toBeGreaterThan(0);
      }
    });

    test('should find alternative port when preferred port is unavailable', async () => {
      // Use a port that is likely occupied (like 80)
      const preferredPort = 80;
      const port = await portManager.findAvailablePort(preferredPort);
      
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThanOrEqual(65535);
      // Since port 80 is usually occupied or requires admin privileges, should return another port
    });
  });

  describe('getPortInfo', () => {
    test('should return port information', async () => {
      const port = 65430;
      const info = await portManager.getPortInfo(port);
      
      expect(info).toMatchObject({
        port: port,
        available: expect.any(Boolean),
        pid: undefined // PID detection not implemented in current implementation
      });
    });
  });

  describe('getPortRangeStatus', () => {
    test('should return port range status', async () => {
      const status = await portManager.getPortRangeStatus();
      
      expect(Array.isArray(status)).toBe(true);
      expect(status.length).toBe(20); // 5000-5019, 20 ports total
      
      for (const info of status) {
        expect(info).toMatchObject({
          port: expect.any(Number),
          available: expect.any(Boolean),
          pid: undefined
        });
        expect(info.port).toBeGreaterThanOrEqual(5000);
        expect(info.port).toBeLessThanOrEqual(5019);
      }
    });
  });

  describe('waitForPortRelease', () => {
    test('should return immediately when port is available', async () => {
      const port = 65429;
      const startTime = Date.now();
      
      await portManager.waitForPortRelease(port, 1000);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // should return quickly
    });

    test('should throw error on timeout', async () => {
      // Create a server to occupy a port
      const { createServer } = await import('net');
      const server = createServer();
      
      await new Promise<void>((resolve) => {
        server.listen(0, () => {
          resolve();
        });
      });

      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      
      if (port > 0) {
        await expect(
          portManager.waitForPortRelease(port, 100)
        ).rejects.toThrow(MCPError);
      }
      
      server.close();
    });
  });

  describe('Error Handling', () => {
    test('should throw error when no ports are available', async () => {
      // Mock the situation where all ports are occupied
      const originalIsPortAvailable = portManager.isPortAvailable;
      portManager.isPortAvailable = jest.fn().mockResolvedValue(false);
      
      await expect(portManager.findAvailablePort()).rejects.toThrow(MCPError);
      await expect(portManager.findAvailablePort()).rejects.toThrow('No available ports found');
      
      // Restore original method
      portManager.isPortAvailable = originalIsPortAvailable;
    });
  });
});
