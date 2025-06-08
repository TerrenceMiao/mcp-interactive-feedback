/**
 * MCP Feedback Collector - Cross-platform Process Management Tool
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';
import { MCPError } from '../types/index.js';

const execAsync = promisify(exec);

export interface ProcessInfo {
  pid: number;
  name: string;
  command: string;
  port?: number;
}

/**
 * Cross-platform Process Manager
 */
export class ProcessManager {
  private readonly isWindows = process.platform === 'win32';

  /**
   * Get process information occupying specified port
   */
  async getPortProcess(port: number): Promise<ProcessInfo | null> {
    try {
      if (this.isWindows) {
        return await this.getPortProcessWindows(port);
      } else {
        return await this.getPortProcessUnix(port);
      }
    } catch (error) {
      logger.debug(`Failed to get port ${port} process information:`, error);
      return null;
    }
  }

  /**
   * Get port process on Windows systems
   */
  private async getPortProcessWindows(port: number): Promise<ProcessInfo | null> {
    try {
      // Use netstat to find port occupation
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1] && parts[1].includes(`:${port}`)) {
          const pidStr = parts[4];
          if (pidStr) {
            const pid = parseInt(pidStr, 10);
            if (!isNaN(pid)) {
              // Get detailed process information
              try {
                const { stdout: processInfo } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV`);
                const processLines = processInfo.trim().split('\n');
                if (processLines.length > 1 && processLines[1]) {
                  const processData = processLines[1].split(',');
                  const name = processData[0]?.replace(/"/g, '') || 'Unknown';
                  return {
                    pid,
                    name,
                    command: name,
                    port
                  };
                }
              } catch (error) {
                logger.debug(`Failed to get PID ${pid} detailed information:`, error);
              }

              return {
                pid,
                name: 'Unknown',
                command: 'Unknown',
                port
              };
            }
          }
        }
      }
    } catch (error) {
      logger.debug('Windows port process query failed:', error);
    }
    
    return null;
  }

  /**
   * Get port process on Unix systems
   */
  private async getPortProcessUnix(port: number): Promise<ProcessInfo | null> {
    try {
      // Use lsof to find port occupation
      const { stdout } = await execAsync(`lsof -i :${port} -t`);
      const pids = stdout.trim().split('\n').filter(pid => pid);
      
      if (pids.length > 0 && pids[0]) {
        const pid = parseInt(pids[0], 10);
        if (!isNaN(pid)) {
          try {
            // Get detailed process information
            const { stdout: processInfo } = await execAsync(`ps -p ${pid} -o comm=,args=`);
            const lines = processInfo.trim().split('\n');
            if (lines.length > 0 && lines[0]) {
              const parts = lines[0].trim().split(/\s+/);
              const name = parts[0] || 'Unknown';
              const command = lines[0] || 'Unknown';
              
              return {
                pid,
                name,
                command,
                port
              };
            }
          } catch (error) {
            logger.debug(`Failed to get PID ${pid} detailed information:`, error);
          }
          
          return {
            pid,
            name: 'Unknown',
            command: 'Unknown',
            port
          };
        }
      }
    } catch (error) {
      logger.debug('Unix port process query failed:', error);
    }
    
    return null;
  }

  /**
   * Terminate process
   */
  async killProcess(pid: number, force: boolean = false): Promise<boolean> {
    try {
      if (this.isWindows) {
        return await this.killProcessWindows(pid, force);
      } else {
        return await this.killProcessUnix(pid, force);
      }
    } catch (error) {
      logger.error(`Failed to terminate process ${pid}:`, error);
      return false;
    }
  }

  /**
   * Terminate process on Windows systems
   */
  private async killProcessWindows(pid: number, force: boolean): Promise<boolean> {
    try {
      const command = force ? `taskkill /F /PID ${pid}` : `taskkill /PID ${pid}`;
      await execAsync(command);
      logger.info(`Terminated Windows process: ${pid}`);
      return true;
    } catch (error) {
      logger.error(`Windows process termination failed (PID: ${pid}):`, error);
      return false;
    }
  }

  /**
   * Terminate process on Unix systems
   */
  private async killProcessUnix(pid: number, force: boolean): Promise<boolean> {
    try {
      const signal = force ? '9' : '15';  // SIGKILL=9, SIGTERM=15
      await execAsync(`kill -${signal} ${pid}`);
      logger.info(`Terminated Unix process: ${pid} (signal ${signal})`);
      return true;
    } catch (error) {
      logger.error(`Unix process termination failed (PID: ${pid}):`, error);
      return false;
    }
  }

  /**
   * Check if process is safe to terminate
   */
  isSafeToKill(processInfo: ProcessInfo): boolean {
    const safePrefixes = [
      'node',
      'npm',
      'npx',
      'mcp-interactive-feedback',
      'tsx'
    ];
    
    const dangerousNames = [
      'system',
      'kernel',
      'init',
      'systemd',
      'explorer.exe',
      'winlogon.exe',
      'csrss.exe',
      'smss.exe',
      'services.exe'
    ];
    
    const processName = processInfo.name.toLowerCase();
    const processCommand = processInfo.command.toLowerCase();
    
    // Check if it's a dangerous process
    for (const dangerous of dangerousNames) {
      if (processName.includes(dangerous) || processCommand.includes(dangerous)) {
        return false;
      }
    }
    
    // Check if it's a safe process
    for (const safe of safePrefixes) {
      if (processName.includes(safe) || processCommand.includes(safe)) {
        return true;
      }
    }
    
    // Default unsafe
    return false;
  }

  /**
   * Force release port (safe version)
   */
  async forceReleasePort(port: number): Promise<boolean> {
    logger.info(`Attempting to force release port: ${port}`);
    
    const processInfo = await this.getPortProcess(port);
    if (!processInfo) {
      logger.info(`Port ${port} is not occupied`);
      return true;
    }
    
    logger.info(`Found process occupying port ${port}:`, {
      pid: processInfo.pid,
      name: processInfo.name,
      command: processInfo.command
    });
    
    // Security check
    if (!this.isSafeToKill(processInfo)) {
      throw new MCPError(
        `Unsafe process, refuse to terminate: ${processInfo.name} (PID: ${processInfo.pid})`,
        'UNSAFE_PROCESS_KILL',
        { processInfo }
      );
    }
    
    // Try graceful termination first
    logger.info(`Try graceful termination process: ${processInfo.pid}`);
    let success = await this.killProcess(processInfo.pid, false);
    
    if (!success) {
      // Wait 2 seconds before forcing termination
      logger.warn(`Graceful termination failed, 2 seconds before forcing termination process: ${processInfo.pid}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      success = await this.killProcess(processInfo.pid, true);
    }
    
    if (success) {
      // Wait for process to exit completely
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify if port is released
      const stillOccupied = await this.getPortProcess(port);
      if (!stillOccupied) {
        logger.info(`Port ${port} released successfully`);
        return true;
      } else {
        logger.error(`Port ${port} still occupied`);
        return false;
      }
    }
    
    return false;
  }
}

// Export singleton instance
export const processManager = new ProcessManager();
