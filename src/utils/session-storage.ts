/**
 * Session Storage Manager
 * Provides in-memory storage and optional persistent storage
 */

import { logger } from './logger.js';
import { MCPError, FeedbackData } from '../types/index.js';

export interface SessionData {
  workSummary: string;
  feedback: FeedbackData[];
  startTime: number;
  timeout: number;
  resolve?: (feedback: FeedbackData[]) => void;
  reject?: (error: Error) => void;
}

export class SessionStorage {
  private sessions = new Map<string, SessionData>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private cleanupIntervalMs: number = 60000) { // Clean up every 1 minute
    this.startCleanupTimer();
  }

  /**
   * Create session
   */
  createSession(sessionId: string, data: SessionData): void {
    this.sessions.set(sessionId, data);
    logger.debug(`Session created: ${sessionId}`);
  }

  /**
   * Get session
   */
  getSession(sessionId: string): SessionData | undefined {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      // Check if session has expired
      const now = Date.now();
      const elapsed = now - session.startTime;
      
      if (elapsed > session.timeout) {
        logger.debug(`Session expired: ${sessionId}`);
        this.deleteSession(sessionId);
        return undefined;
      }
    }
    
    return session;
  }

  /**
   * Update session
   */
  updateSession(sessionId: string, updates: Partial<SessionData>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    Object.assign(session, updates);
    this.sessions.set(sessionId, session);
    logger.debug(`Session updated: ${sessionId}`);
    return true;
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      logger.debug(`Session deleted: ${sessionId}`);
    }
    return deleted;
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): Map<string, SessionData> {
    return new Map(this.sessions);
  }

  /**
   * Get active session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions) {
      const elapsed = now - session.startTime;
      
      if (elapsed > session.timeout) {
        // Notify session timeout
        if (session.reject) {
          session.reject(new MCPError(
            `Session timeout after ${session.timeout / 1000} seconds`,
            'SESSION_TIMEOUT'
          ));
        }
        
        this.sessions.delete(sessionId);
        cleanedCount++;
        logger.debug(`Cleaned up expired session: ${sessionId}`);
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    // Notify all sessions to close
    for (const [sessionId, session] of this.sessions) {
      if (session.reject) {
        session.reject(new MCPError('Server is shutting down', 'SERVER_SHUTDOWN'));
      }
    }
    
    this.sessions.clear();
    logger.info('All sessions cleared');
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
  } {
    const now = Date.now();
    let activeSessions = 0;
    let expiredSessions = 0;

    for (const session of this.sessions.values()) {
      const elapsed = now - session.startTime;
      if (elapsed > session.timeout) {
        expiredSessions++;
      } else {
        activeSessions++;
      }
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      expiredSessions
    };
  }
}
