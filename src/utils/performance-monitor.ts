/**
 * MCP Feedback Collector - Performance Monitoring Tool
 */

import { logger } from './logger.js';

/**
 * Performance Metrics Interface
 */
export interface PerformanceMetrics {
  // Memory Usage
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  
  // CPU Usage
  cpuUsage: {
    user: number;
    system: number;
  };
  
  // Runtime
  uptime: number;
  
  // Request Statistics
  requestStats: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  
  // WebSocket Connections
  websocketStats: {
    activeConnections: number;
    totalConnections: number;
    messagesReceived: number;
    messagesSent: number;
  };
  
  // Session Statistics
  sessionStats: {
    activeSessions: number;
    totalSessions: number;
    completedSessions: number;
    timeoutSessions: number;
  };
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private startTime: number;
  private requestStats = {
    total: 0,
    successful: 0,
    failed: 0,
    responseTimes: [] as number[]
  };
  
  private websocketStats = {
    activeConnections: 0,
    totalConnections: 0,
    messagesReceived: 0,
    messagesSent: 0
  };
  
  private sessionStats = {
    activeSessions: 0,
    totalSessions: 0,
    completedSessions: 0,
    timeoutSessions: 0
  };

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Record HTTP Request
   */
  recordRequest(responseTime: number, success: boolean): void {
    this.requestStats.total++;
    this.requestStats.responseTimes.push(responseTime);
    
    if (success) {
      this.requestStats.successful++;
    } else {
      this.requestStats.failed++;
    }
    
    // Keep only the most recent 1000 response times
    if (this.requestStats.responseTimes.length > 1000) {
      this.requestStats.responseTimes = this.requestStats.responseTimes.slice(-1000);
    }
  }

  /**
   * Record WebSocket Connection
   */
  recordWebSocketConnection(): void {
    this.websocketStats.activeConnections++;
    this.websocketStats.totalConnections++;
  }

  /**
   * Record WebSocket Disconnection
   */
  recordWebSocketDisconnection(): void {
    this.websocketStats.activeConnections = Math.max(0, this.websocketStats.activeConnections - 1);
  }

  /**
   * Record WebSocket Message
   */
  recordWebSocketMessage(direction: 'received' | 'sent'): void {
    if (direction === 'received') {
      this.websocketStats.messagesReceived++;
    } else {
      this.websocketStats.messagesSent++;
    }
  }

  /**
   * Record Session Creation
   */
  recordSessionCreated(): void {
    this.sessionStats.activeSessions++;
    this.sessionStats.totalSessions++;
  }

  /**
   * Record Session Completion
   */
  recordSessionCompleted(): void {
    this.sessionStats.activeSessions = Math.max(0, this.sessionStats.activeSessions - 1);
    this.sessionStats.completedSessions++;
  }

  /**
   * Record Session Timeout
   */
  recordSessionTimeout(): void {
    this.sessionStats.activeSessions = Math.max(0, this.sessionStats.activeSessions - 1);
    this.sessionStats.timeoutSessions++;
  }

  /**
   * Get Current Performance Metrics
   */
  getMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: Date.now() - this.startTime,
      requestStats: {
        total: this.requestStats.total,
        successful: this.requestStats.successful,
        failed: this.requestStats.failed,
        averageResponseTime: this.calculateAverageResponseTime()
      },
      websocketStats: { ...this.websocketStats },
      sessionStats: { ...this.sessionStats }
    };
  }

  /**
   * Calculate Average Response Time
   */
  private calculateAverageResponseTime(): number {
    if (this.requestStats.responseTimes.length === 0) {
      return 0;
    }
    
    const sum = this.requestStats.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.requestStats.responseTimes.length;
  }

  /**
   * Get Formatted Performance Report
   */
  getFormattedReport(): string {
    const metrics = this.getMetrics();
    
    return `
📊 Performance Monitoring Report
================

💾 Memory Usage:
  - Heap Used: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
  - Heap Total: ${(metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
  - External Memory: ${(metrics.memoryUsage.external / 1024 / 1024).toFixed(2)} MB
  - RSS: ${(metrics.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB

⏱️ Uptime: ${(metrics.uptime / 1000).toFixed(2)} seconds

🌐 HTTP Request Statistics:
  - Total Requests: ${metrics.requestStats.total}
  - Successful Requests: ${metrics.requestStats.successful}
  - Failed Requests: ${metrics.requestStats.failed}
  - Average Response Time: ${metrics.requestStats.averageResponseTime.toFixed(2)} ms

🔌 WebSocket Statistics:
  - Active Connections: ${metrics.websocketStats.activeConnections}
  - Total Connections: ${metrics.websocketStats.totalConnections}
  - Messages Received: ${metrics.websocketStats.messagesReceived}
  - Messages Sent: ${metrics.websocketStats.messagesSent}

📋 Session Statistics:
  - Active Sessions: ${metrics.sessionStats.activeSessions}
  - Total Sessions: ${metrics.sessionStats.totalSessions}
  - Completed Sessions: ${metrics.sessionStats.completedSessions}
  - Timeout Sessions: ${metrics.sessionStats.timeoutSessions}
`;
  }

  /**
   * Check Performance Warnings
   */
  checkPerformanceWarnings(): string[] {
    const metrics = this.getMetrics();
    const warnings: string[] = [];
    
    // Memory usage warning
    const heapUsedMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 200) {
      warnings.push(`High memory usage: ${heapUsedMB.toFixed(2)} MB`);
    }
    
    // Response time warning
    if (metrics.requestStats.averageResponseTime > 2000) {
      warnings.push(`Long average response time: ${metrics.requestStats.averageResponseTime.toFixed(2)} ms`);
    }
    
    // Failure rate warning
    const failureRate = metrics.requestStats.total > 0 
      ? (metrics.requestStats.failed / metrics.requestStats.total) * 100 
      : 0;
    if (failureRate > 5) {
      warnings.push(`High request failure rate: ${failureRate.toFixed(2)}%`);
    }
    
    // Session timeout warning
    const timeoutRate = metrics.sessionStats.totalSessions > 0
      ? (metrics.sessionStats.timeoutSessions / metrics.sessionStats.totalSessions) * 100
      : 0;
    if (timeoutRate > 20) {
      warnings.push(`High session timeout rate: ${timeoutRate.toFixed(2)}%`);
    }
    
    return warnings;
  }

  /**
   * Start Periodic Performance Monitoring
   */
  startPeriodicMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      const warnings = this.checkPerformanceWarnings();
      
      if (warnings.length > 0) {
        logger.warn('Performance warnings:', warnings);
      }
      
      // Log performance metrics
      const metrics = this.getMetrics();
      logger.debug('Performance metrics:', {
        memoryMB: (metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        uptime: (metrics.uptime / 1000).toFixed(2),
        requests: metrics.requestStats.total,
        avgResponseTime: metrics.requestStats.averageResponseTime.toFixed(2),
        activeConnections: metrics.websocketStats.activeConnections,
        activeSessions: metrics.sessionStats.activeSessions
      });
    }, intervalMs);
  }

  /**
   * Reset Statistics
   */
  reset(): void {
    this.startTime = Date.now();
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      responseTimes: []
    };
    this.websocketStats = {
      activeConnections: 0,
      totalConnections: 0,
      messagesReceived: 0,
      messagesSent: 0
    };
    this.sessionStats = {
      activeSessions: 0,
      totalSessions: 0,
      completedSessions: 0,
      timeoutSessions: 0
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();
