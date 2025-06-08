/**
 * MCP Feedback Collector - Web Server Implementation
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { Config, FeedbackData, MCPError } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { PortManager } from '../utils/port-manager.js';
import { ImageProcessor } from '../utils/image-processor.js';
import { performanceMonitor } from '../utils/performance-monitor.js';
import { SessionStorage, SessionData } from '../utils/session-storage.js';
import { VERSION } from '../index.js';

/**
 * Web Server Class
 */
export class WebServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private config: Config;
  private port: number = 0;
  private isServerRunning = false;
  private portManager: PortManager;
  private imageProcessor: ImageProcessor;
  private sessionStorage: SessionStorage;

  constructor(config: Config) {
    this.config = config;
    this.portManager = new PortManager();
    this.imageProcessor = new ImageProcessor({
      maxFileSize: config.maxFileSize,
      maxWidth: 2048,
      maxHeight: 2048
    });
    this.sessionStorage = new SessionStorage();

    // Create Express application
    this.app = express();
    
    // Create HTTP server
    this.server = createServer(this.app);
    
    // Create Socket.IO server
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  /**
   * Set up middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false // Allow inline scripts
    }));
    
    // Compression middleware
    this.app.use(compression());
    
    // CORS middleware
    this.app.use(cors({
      origin: this.config.corsOrigin,
      credentials: true
    }));
    
    // JSON parsing middleware
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // Request logging and performance monitoring middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        const success = res.statusCode < 400;

        // Log request
        logger.request(req.method, req.url, res.statusCode, duration);

        // Record performance metrics
        performanceMonitor.recordRequest(duration, success);

        // Log slow requests
        if (duration > 1000) {
          logger.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
        }
      });
      next();
    });
  }

  /**
   * Set up routes
   */
  private setupRoutes(): void {
    // Get current file directory path (ES module compatible)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const staticPath = path.resolve(__dirname, '../static');

    // Static file service - using absolute path
    this.app.use(express.static(staticPath));

    // Home route
    this.app.get('/', (req, res) => {
      res.sendFile('index.html', { root: staticPath });
    });

    // API configuration route
    this.app.get('/api/config', (req, res) => {
      const chatConfig = {
        api_key: this.config.apiKey || '',
        api_base_url: this.config.apiBaseUrl || 'https://api.openai.com/v1',
        model: this.config.defaultModel || 'gpt-4o-mini',
        enable_chat: this.config.enableChat !== false, // Enabled by default
        max_file_size: this.config.maxFileSize,
        temperature: 0.7,
        max_tokens: 2000
      };

      logger.info('Returning chat configuration:', {
        hasApiKey: !!chatConfig.api_key,
        apiBaseUrl: chatConfig.api_base_url,
        model: chatConfig.model,
        enableChat: chatConfig.enable_chat
      });

      res.json(chatConfig);
    });

    // Test session creation route
    this.app.post('/api/test-session', (req, res) => {
      const { work_summary, timeout_seconds = 300 } = req.body;

      if (!work_summary) {
        res.status(400).json({ error: 'Missing work_summary parameter' });
        return;
      }

      const sessionId = this.generateSessionId();

      // Create test session
      const session: SessionData = {
        workSummary: work_summary,
        feedback: [],
        startTime: Date.now(),
        timeout: timeout_seconds * 1000
      };

      this.sessionStorage.createSession(sessionId, session);

      // Record session creation
      performanceMonitor.recordSessionCreated();

      logger.info(`Created test session: ${sessionId}`);

      res.json({
        success: true,
        session_id: sessionId,
        feedback_url: this.generateFeedbackUrl(sessionId)
      });
    });

    // Version information API
    this.app.get('/api/version', (req, res) => {
      res.json({
        version: VERSION,
        timestamp: new Date().toISOString()
      });
    });

    // Health check route
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: VERSION,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        active_sessions: this.sessionStorage.getSessionCount()
      });
    });

    // Performance monitoring route
    this.app.get('/api/metrics', (req, res) => {
      const metrics = performanceMonitor.getMetrics();
      res.json(metrics);
    });

    // Performance report route
    this.app.get('/api/performance-report', (req, res) => {
      const report = performanceMonitor.getFormattedReport();
      res.type('text/plain').send(report);
    });

    // Error handling middleware
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Express error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    });
  }

  /**
   * Set up Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.socket('connect', socket.id);
      logger.info(`✅ New WebSocket connection: ${socket.id}`);

      // Record WebSocket connection
      performanceMonitor.recordWebSocketConnection();

      // Test message handling
      socket.on('test_message', (data: any) => {
        logger.socket('test_message', socket.id, data);
        socket.emit('test_response', { message: 'Test message received!', timestamp: Date.now() });
      });

      // Handle session request (fixed URL pattern)
      socket.on('request_session', () => {
        logger.socket('request_session', socket.id);

        // Find the latest active session
        const activeSessions = this.sessionStorage.getAllSessions();
        let latestSession: { sessionId: string; session: any } | null = null;

        for (const [sessionId, session] of activeSessions) {
          if (!latestSession || session.startTime > latestSession.session.startTime) {
            latestSession = { sessionId, session };
          }
        }

        if (latestSession) {
          // Active session exists, assign to client
          logger.info(`Assigning session to client ${socket.id}: ${latestSession.sessionId}`);
          socket.emit('session_assigned', {
            session_id: latestSession.sessionId,
            work_summary: latestSession.session.workSummary
          });
        } else {
          // No active session
          logger.info(`Client ${socket.id} requested session, but no active session`);
          socket.emit('no_active_session', {
            message: 'No active feedback session'
          });
        }
      });

      // Handle latest work summary request
      socket.on('request_latest_summary', () => {
        logger.socket('request_latest_summary', socket.id);

        // Find the latest active session
        const activeSessions = this.sessionStorage.getAllSessions();
        let latestSession: { sessionId: string; session: any } | null = null;

        for (const [sessionId, session] of activeSessions) {
          if (!latestSession || session.startTime > latestSession.session.startTime) {
            latestSession = { sessionId, session };
          }
        }

        if (latestSession && latestSession.session.workSummary) {
          // Found latest work summary
          logger.info(`Returning latest work summary to client ${socket.id}`);
          socket.emit('latest_summary_response', {
            success: true,
            work_summary: latestSession.session.workSummary,
            session_id: latestSession.sessionId,
            timestamp: latestSession.session.startTime
          });
        } else {
          // No work summary found
          logger.info(`Client ${socket.id} requested latest work summary, but none found`);
          socket.emit('latest_summary_response', {
            success: false,
            message: 'No latest work summary found, please wait for AI to call interactive-feedback tool function'
          });
        }
      });

      // Get work summary data
      socket.on('get_work_summary', (data: { feedback_session_id: string }) => {
        logger.socket('get_work_summary', socket.id, data);

        const session = this.sessionStorage.getSession(data.feedback_session_id);
        if (session) {
          socket.emit('work_summary_data', {
            work_summary: session.workSummary
          });
        } else {
          socket.emit('feedback_error', {
            error: 'Session does not exist or has expired'
          });
        }
      });

      // Submit feedback
      socket.on('submit_feedback', async (data: FeedbackData) => {
        logger.socket('submit_feedback', socket.id, {
          sessionId: data.sessionId,
          textLength: data.text?.length || 0,
          imageCount: data.images?.length || 0
        });

        await this.handleFeedbackSubmission(socket, data);
      });

      // Disconnect
      socket.on('disconnect', (reason) => {
        logger.socket('disconnect', socket.id, { reason });
        logger.info(`❌ WebSocket connection closed: ${socket.id}, Reason: ${reason}`);

        // Record WebSocket disconnection
        performanceMonitor.recordWebSocketDisconnection();
      });
    });
  }

  /**
   * Handle feedback submission
   */
  private async handleFeedbackSubmission(socket: any, feedbackData: FeedbackData): Promise<void> {
    const session = this.sessionStorage.getSession(feedbackData.sessionId);

    if (!session) {
      socket.emit('feedback_error', {
        error: 'Session does not exist or has expired'
      });
      return;
    }

    try {
      // Validate feedback data
      if (!feedbackData.text && (!feedbackData.images || feedbackData.images.length === 0)) {
        socket.emit('feedback_error', {
          error: 'Please provide text feedback or upload images'
        });
        return;
      }

      // Process image data
      let processedFeedback = { ...feedbackData };
      if (feedbackData.images && feedbackData.images.length > 0) {
        logger.info(`Processing ${feedbackData.images.length} images...`);

        try {
          const processedImages = await this.imageProcessor.processImages(feedbackData.images);
          processedFeedback.images = processedImages;

          const stats = this.imageProcessor.getImageStats(processedImages);
          logger.info(`Image processing completed: ${stats.totalCount} images, Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);

        } catch (error) {
          logger.error('Image processing failed:', error);
          socket.emit('feedback_error', {
            error: `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
          return;
        }
      }

      // Add feedback to session
      session.feedback.push(processedFeedback);
      this.sessionStorage.updateSession(feedbackData.sessionId, { feedback: session.feedback });

      // Notify submission success
      socket.emit('feedback_submitted', {
        success: true,
        message: 'Feedback submission successful'
      });

      // Complete feedback collection
      if (session.resolve) {
        session.resolve(session.feedback);
        this.sessionStorage.deleteSession(feedbackData.sessionId);
      }

    } catch (error) {
      logger.error('Error handling feedback submission:', error);
      socket.emit('feedback_error', {
        error: 'Server processing error, please try again later'
      });
    }
  }

  /**
   * Collect user feedback
   */
  async collectFeedback(workSummary: string, timeoutSeconds: number): Promise<FeedbackData[]> {
    const sessionId = this.generateSessionId();
    
    logger.info(`Creating feedback session: ${sessionId}, Timeout: ${timeoutSeconds} seconds`);
    
    return new Promise((resolve, reject) => {
      // Create session
      const session: SessionData = {
        workSummary,
        feedback: [],
        startTime: Date.now(),
        timeout: timeoutSeconds * 1000,
        resolve,
        reject
      };

      this.sessionStorage.createSession(sessionId, session);

      // Set timeout
      const timeoutId = setTimeout(() => {
        this.sessionStorage.deleteSession(sessionId);
        reject(new MCPError(
          `Feedback collection timeout after ${timeoutSeconds} seconds`,
          'FEEDBACK_TIMEOUT'
        ));
      }, timeoutSeconds * 1000);

      // Open browser
      this.openFeedbackPage(sessionId).catch(error => {
        logger.error('Failed to open feedback page:', error);
        clearTimeout(timeoutId);
        this.sessionStorage.deleteSession(sessionId);
        reject(error);
      });
    });
  }

  /**
   * Generate feedback page URL
   */
  private generateFeedbackUrl(sessionId: string): string {
    // If fixed URL mode is enabled, return root path
    if (this.config.useFixedUrl) {
      // Prefer to use configured server base URL
      if (this.config.serverBaseUrl) {
        return this.config.serverBaseUrl;
      }
      // Use configured host name
      const host = this.config.serverHost || 'localhost';
      return `http://${host}:${this.port}`;
    }

    // Traditional mode: include session ID parameter
    if (this.config.serverBaseUrl) {
      return `${this.config.serverBaseUrl}/?mode=feedback&session=${sessionId}`;
    }
    const host = this.config.serverHost || 'localhost';
    return `http://${host}:${this.port}/?mode=feedback&session=${sessionId}`;
  }

  /**
   * Open feedback page
   */
  private async openFeedbackPage(sessionId: string): Promise<void> {
    const url = this.generateFeedbackUrl(sessionId);
    logger.info(`Opening feedback page: ${url}`);

    try {
      const open = await import('open');
      await open.default(url);
      logger.info('Browser opened feedback page');
    } catch (error) {
      logger.warn('Unable to automatically open browser:', error);
      logger.info(`Please manually open browser to access: ${url}`);
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start Web Server
   */
  async start(): Promise<void> {
    if (this.isServerRunning) {
      logger.warn('Web server is already running');
      return;
    }

    try {
      // According to configuration, choose port strategy
      if (this.config.forcePort) {
        // Force port mode
        logger.info(`Force port mode: Attempting to use port ${this.config.webPort}`);

        // According to configuration, decide whether to clean port
        if (this.config.cleanupPortOnStart) {
          logger.info(`Port cleanup enabled at startup, cleaning port ${this.config.webPort}`);
          await this.portManager.cleanupPort(this.config.webPort);
        }

        this.port = await this.portManager.forcePort(
          this.config.webPort,
          this.config.killProcessOnPortConflict || false
        );
      } else {
        // Traditional mode: find available port
        // If port cleanup is enabled and a preferred port is specified, try cleaning first
        if (this.config.cleanupPortOnStart && this.config.webPort) {
          logger.info(`Port cleanup enabled at startup, attempting to clean preferred port ${this.config.webPort}`);
          await this.portManager.cleanupPort(this.config.webPort);
        }

        this.port = await this.portManager.findAvailablePort(this.config.webPort);
      }

      // Confirm port is available before starting server
      logger.info(`Preparing to start server on port ${this.port}...`);

      // Start server
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server start timeout'));
        }, 10000);

        this.server.listen(this.port, (error?: Error) => {
          clearTimeout(timeout);
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      this.isServerRunning = true;

      // According to configuration, display different startup information
      if (this.config.forcePort) {
        logger.info(`✅ Web server started successfully (forced port): http://localhost:${this.port}`);
      } else {
        logger.info(`✅ Web server started successfully: http://localhost:${this.port}`);
      }

      if (this.config.useFixedUrl) {
        logger.info(`🔗 Fixed URL mode enabled, Access address: http://localhost:${this.port}`);
      }

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
   * Stop Web Server
   */
  async stop(): Promise<void> {
    if (!this.isServerRunning) {
      return;
    }

    const currentPort = this.port;
    logger.info(`Stopping Web server (port: ${currentPort})...`);

    try {
      // Clean up all active sessions
      this.sessionStorage.clear();
      this.sessionStorage.stopCleanupTimer();

      // Close all WebSocket connections
      this.io.disconnectSockets(true);

      // Close Socket.IO
      this.io.close();

      // Close HTTP server
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server close timeout'));
        }, 5000);

        this.server.close((error?: Error) => {
          clearTimeout(timeout);
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      this.isServerRunning = false;
      logger.info(`✅ Web server stopped (port: ${currentPort})`);

      // Wait for port to be fully released
      logger.info(`Waiting for port ${currentPort} to be fully released...`);
      try {
        await this.portManager.waitForPortRelease(currentPort, 3000);
        logger.info(`✅ Port ${currentPort} fully released`);
      } catch (error) {
        logger.warn(`Port ${currentPort} release timeout, but server stopped`);
      }

    } catch (error) {
      logger.error('Error stopping Web server:', error);
      throw error;
    }
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.isServerRunning;
  }

  /**
   * Get server port
   */
  getPort(): number {
    return this.port;
  }
}
