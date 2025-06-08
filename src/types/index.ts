/**
 * MCP Feedback Collector - Type Definitions
 */

// Base Configuration Type
export interface Config {
  apiKey?: string | undefined;
  apiBaseUrl: string;
  defaultModel: string;
  webPort: number;
  dialogTimeout: number;
  enableChat: boolean;
  corsOrigin: string;
  maxFileSize: number;
  logLevel: string;
  // Added: Server host configuration
  serverHost?: string | undefined;
  serverBaseUrl?: string | undefined;
  // Added: URL and port optimization configuration
  forcePort?: boolean | undefined;           // Force use of specified port
  killProcessOnPortConflict?: boolean | undefined;  // Automatically terminate occupying process
  useFixedUrl?: boolean | undefined;         // Use fixed URL without session parameters
  cleanupPortOnStart?: boolean | undefined;  // Clean up port on startup
}

// Feedback Data Type
export interface FeedbackData {
  text?: string;
  images?: ImageData[];
  timestamp: number;
  sessionId: string;
}

// Image Data Type
export interface ImageData {
  name: string;
  data: string; // Base64 encoded
  size: number;
  type: string;
}

// Work Report Type
export interface WorkSummary {
  content: string;
  timestamp: number;
  sessionId: string;
}

// MCP Tool Function Parameters Type
export interface CollectFeedbackParams {
  work_summary: string;
}

// MCP Content Type - Compliant with MCP Protocol Standard
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  data: string; // base64 encoded image data
  mimeType: string; // Image MIME type
}

export interface AudioContent {
  type: 'audio';
  data: string; // base64 encoded audio data
  mimeType: string; // Audio MIME type
}

// MCP Content Union Type
export type MCPContent = TextContent | ImageContent | AudioContent;

// MCP Tool Function Return Type - Compliant with MCP Protocol Requirements
export interface CollectFeedbackResult {
  [x: string]: unknown;
  content: MCPContent[];
  isError?: boolean;
}

// WebSocket Event Types
export interface SocketEvents {
  // Connection Management
  connect: () => void;
  disconnect: () => void;
  
  // Feedback Collection
  start_feedback_session: (data: { sessionId: string; workSummary: string }) => void;
  get_work_summary: (data: { feedback_session_id: string }) => void;
  submit_feedback: (data: FeedbackData) => void;
  feedback_submitted: (data: { success: boolean; message?: string }) => void;
  feedback_error: (data: { error: string }) => void;
  work_summary_data: (data: { work_summary: string }) => void;
}

// Server Status Type
export interface ServerStatus {
  running: boolean;
  port: number;
  startTime: number;
  activeSessions: number;
}

// Session Management Type
export interface Session {
  id: string;
  workSummary?: string;
  feedback?: FeedbackData[];
  startTime: number;
  timeout: number;
  status: 'active' | 'completed' | 'timeout' | 'error';
}

// Error Type
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// Port Management Type
export interface PortInfo {
  port: number;
  available: boolean;
  pid?: number | undefined;
}

// Log Level Type
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'silent';

// API Configuration Type
export interface APIConfig {
  apiKey?: string;
  apiBaseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}
