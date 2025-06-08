/**
 * MCP Feedback Collector - Port Management Tool
 */

import { createServer } from 'net';
import { MCPError, PortInfo } from '../types/index.js';
import { logger } from './logger.js';
import { processManager } from './process-manager.js';

/**
 * Port Manager
 */
export class PortManager {
  private readonly PORT_RANGE_START = 5000;
  private readonly PORT_RANGE_END = 5019;
  private readonly MAX_RETRIES = 20;

  /**
   * Check if port is available (enhanced version)
   */
  async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer();
      let resolved = false;

      // Set timeout to avoid long waits
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          server.close(() => {
            resolve(false);
          });
        }
      }, 1000);

      server.listen(port, () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          // Port is available, close test server immediately
          server.close(() => {
            resolve(true);
          });
        }
      });

      server.on('error', (err: any) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          // Port is not available
          resolve(false);
        }
      });
    });
  }

  /**
   * Deep check if port is truly available (including process detection)
   */
  async isPortTrulyAvailable(port: number): Promise<boolean> {
    // First perform basic check
    const basicCheck = await this.isPortAvailable(port);
    if (!basicCheck) {
      return false;
    }

    // Check if any process is using this port
    const processInfo = await processManager.getPortProcess(port);
    if (processInfo) {
      logger.debug(`Port ${port} is occupied by process:`, processInfo);
      return false;
    }

    return true;
  }

  /**
   * Find available port
   */
  async findAvailablePort(preferredPort?: number): Promise<number> {
    // If preferred port is specified, try it first
    if (preferredPort) {
      logger.debug(`Checking preferred port: ${preferredPort}`);
      const available = await this.isPortAvailable(preferredPort);
      if (available) {
        logger.info(`Using preferred port: ${preferredPort}`);
        return preferredPort;
      } else {
        logger.warn(`Preferred port ${preferredPort} is not available, looking for others...`);
      }
    }

    // Look for available port within range
    for (let port = this.PORT_RANGE_START; port <= this.PORT_RANGE_END; port++) {
      logger.debug(`Checking port: ${port}`);
      if (await this.isPortAvailable(port)) {
        logger.info(`Found available port: ${port}`);
        return port;
      }
    }

    // If no ports available in range, try random ports
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      const randomPort = Math.floor(Math.random() * (65535 - 1024) + 1024);
      logger.debug(`Trying random port: ${randomPort}`);
      if (await this.isPortAvailable(randomPort)) {
        logger.info(`Found random available port: ${randomPort}`);
        return randomPort;
      }
    }

    throw new MCPError(
      'No available ports found',
      'NO_AVAILABLE_PORTS',
      { 
        preferredPort,
        rangeStart: this.PORT_RANGE_START,
        rangeEnd: this.PORT_RANGE_END,
        maxRetries: this.MAX_RETRIES
      }
    );
  }

  /**
   * Get port information
   */
  async getPortInfo(port: number): Promise<PortInfo> {
    const available = await this.isPortAvailable(port);
    
    return {
      port,
      available,
      // TODO: Add PID detection (need cross-platform implementation)
      pid: undefined
    };
  }

  /**
   * Get status of all ports in range
   */
  async getPortRangeStatus(): Promise<PortInfo[]> {
    const results: PortInfo[] = [];
    
    for (let port = this.PORT_RANGE_START; port <= this.PORT_RANGE_END; port++) {
      const info = await this.getPortInfo(port);
      results.push(info);
    }
    
    return results;
  }

  /**
   * Clean up zombie processes (cross-platform implementation)
   */
  async cleanupZombieProcesses(): Promise<void> {
    logger.info('Starting zombie process cleanup...');
    
    try {
      // TODO: Implement cross-platform process cleanup
      // Windows: tasklist, taskkill
      // Unix/Linux: ps, kill
      
      logger.info('Zombie process cleanup completed');
    } catch (error) {
      logger.warn('Error cleaning up zombie processes:', error);
    }
  }

  /**
   * Force use of specified port
   */
  async forcePort(port: number, killProcess: boolean = false): Promise<number> {
    logger.info(`Forcing use of port: ${port}`);

    // Check if port is available
    const available = await this.isPortAvailable(port);
    if (available) {
      logger.info(`Port ${port} is available, using directly`);
      return port;
    }

    if (!killProcess) {
      throw new MCPError(
        `Port ${port} is occupied and killProcess is disabled`,
        'PORT_OCCUPIED',
        { port, killProcess }
      );
    }

    // Try to force release port
    logger.warn(`Port ${port} is occupied, attempting to force release...`);
    const released = await processManager.forceReleasePort(port);

    if (!released) {
      throw new MCPError(
        `Failed to force release port ${port}`,
        'PORT_FORCE_RELEASE_FAILED',
        { port }
      );
    }

    // Check port availability again
    const finalCheck = await this.isPortAvailable(port);
    if (!finalCheck) {
      throw new MCPError(
        `Port ${port} is still occupied after force release`,
        'PORT_STILL_OCCUPIED',
        { port }
      );
    }

    logger.info(`Port ${port} successfully force released`);
    return port;
  }

  /**
   * Wait for port release (enhanced version)
   */
  async waitForPortRelease(port: number, timeoutMs: number = 10000): Promise<void> {
    const startTime = Date.now();
    logger.info(`Waiting for port ${port} to be released, timeout: ${timeoutMs}ms`);

    while (Date.now() - startTime < timeoutMs) {
      // Use deep check to ensure port is truly available
      if (await this.isPortTrulyAvailable(port)) {
        logger.info(`Port ${port} has been fully released`);
        return;
      }

      // Wait 200ms before retrying (increased wait time)
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    throw new MCPError(
      `Port ${port} was not released within ${timeoutMs}ms`,
      'PORT_RELEASE_TIMEOUT',
      { port, timeoutMs }
    );
  }

  /**
   * Clean up specified port (force release and wait)
   */
  async cleanupPort(port: number): Promise<void> {
    logger.info(`Starting port cleanup: ${port}`);

    // Check if port is occupied
    const processInfo = await processManager.getPortProcess(port);
    if (!processInfo) {
      logger.info(`Port ${port} is not occupied, no cleanup needed`);
      return;
    }

    logger.info(`Found process occupying port ${port}:`, {
      pid: processInfo.pid,
      name: processInfo.name,
      command: processInfo.command
    });

    // Check if it's a safe process to kill
    if (!processManager.isSafeToKill(processInfo)) {
      logger.warn(`Port ${port} is occupied by an unsafe process, skipping cleanup: ${processInfo.name}`);
      return;
    }

    // Try to terminate process
    logger.info(`Attempting to terminate process ${processInfo.pid} occupying port ${port}`);
    const killed = await processManager.killProcess(processInfo.pid, false);

    if (killed) {
      // Wait for port to be released
      try {
        await this.waitForPortRelease(port, 5000);
        logger.info(`Port ${port} cleanup successful`);
      } catch (error) {
        logger.warn(`Port ${port} still not released after cleanup, may need more time`);
      }
    } else {
      logger.warn(`Unable to terminate process ${processInfo.pid} occupying port ${port}`);
    }
  }

  /**
   * Force release port (kill occupying process)
   */
  async forceReleasePort(port: number): Promise<void> {
    logger.warn(`Force releasing port: ${port}`);
    
    try {
      // TODO: Implement cross-platform process killing
      // 1. Find process PID occupying the port
      // 2. Kill that process
      // 3. Wait for port to be released
      
      await this.waitForPortRelease(port, 3000);
      logger.info(`Port ${port} successfully force released`);
      
    } catch (error) {
      logger.error(`Failed to force release port ${port}:`, error);
      throw new MCPError(
        `Failed to force release port ${port}`,
        'FORCE_RELEASE_FAILED',
        error
      );
    }
  }
}
