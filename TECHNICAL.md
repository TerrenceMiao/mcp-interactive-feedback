# 🔧 Technical Documentation

## 🏗️ System Architecture

### Overall Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLI Interface │    │   Web Browser   │    │  MCP Client     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Feedback Collector                      │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   CLI Module    │   Web Server    │      MCP Server             │
│   - Startup Mgmt│   - HTTP API    │      - Tool Registration    │
│   - Param Parse │   - WebSocket   │      - Session Management   │
│   - Process Ctrl│   - Static Files│      - Protocol Handling    │
└─────────────────┴─────────────────┴─────────────────────────────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Port Manager  │    │ Session Storage │    │ Image Processor │
│   - Port Detect │    │ - Session Mgmt  │    │ - Image Process │
│   - Process Clean│   │ - Data Storage  │    │ - Format Convert│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Modules

#### 1. CLI Module (`src/cli.ts`)
- **Function**: Command-line interface, program entry point
- **Responsibility**: Parameter parsing, mode selection, process management
- **Key Features**: 
  - Supports multiple startup modes
  - Environment variable configuration
  - Elegant error handling

#### 2. MCP Server (`src/server/mcp-server.ts`)
- **Function**: MCP protocol implementation
- **Responsibility**: Tool registration, session management, protocol handling
- **Key Features**:
  - `interactive-feedback` tool implementation
  - Standard MCP protocol compatibility
  - Session lifecycle management

#### 3. Web Server (`src/server/web-server.ts`)
- **Function**: HTTP/WebSocket service
- **Responsibility**: Web interface, API endpoints, real-time communication
- **Key Features**:
  - Express.js framework
  - Socket.IO real-time communication
  - Static file service

## 🔄 Data Flow

### Feedback Collection Process
```
1. AI calls interactive-feedback tool
   ↓
2. MCP server creates session
   ↓
3. Web server generates feedback page
   ↓
4. User submits feedback in browser
   ↓
5. WebSocket transmits feedback data
   ↓
6. MCP server processes and responds
   ↓
7. Session cleanup and resource release
```

### Session Management
- **Session ID**: Unique identifier, format: `feedback_{timestamp}_{random}`
- **Lifecycle**: Creation → Active → Timeout/Complete → Cleanup
- **Storage**: In-memory storage, supports persistent extension
- **Cleanup**: Periodic cleanup of expired sessions

## 🌐 Network Communication

### HTTP API Endpoints
```
GET  /                    # Main page
GET  /api/version         # Version information
POST /api/test-session    # Create test session
GET  /api/session/:id     # Get session information
POST /api/feedback        # Submit feedback
```

### WebSocket Events
```
# Client → Server
connect                   # Connection established
request_session          # Request session allocation
submit_feedback          # Submit feedback
request_latest_summary   # Request latest report

# Server → Client
session_assigned         # Session allocation completed
feedback_submitted       # Feedback submission successful
latest_summary_response  # Latest report response
error                    # Error information
```

## 🔧 Configuration System

### Environment Variables
```bash
# Basic Configuration
MCP_WEB_PORT=5000                    # Web service port
MCP_LOG_LEVEL=info                   # Log level
MCP_SESSION_TIMEOUT=3600             # Session timeout (seconds)

# Advanced Configuration
MCP_USE_FIXED_URL=true               # Fixed URL mode
MCP_FORCE_PORT=false                 # Force port mode
MCP_KILL_PORT_PROCESS=false          # Auto-terminate occupying process
MCP_STARTUP_PORT_CLEANUP=true        # Port cleanup at startup

# File Upload
MCP_MAX_FILE_SIZE=10485760           # Maximum file size (10MB)
MCP_ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp  # Allowed file types

# Security Configuration
MCP_CORS_ORIGIN=*                    # CORS allowed origins
MCP_RATE_LIMIT_WINDOW=900000         # Rate limit window (15 minutes)
MCP_RATE_LIMIT_MAX=100               # Rate limit maximum requests
```

### Configuration Priority
1. Command line parameters
2. Environment variables
3. Configuration file
4. Default values

## 🖼️ Image Processing

### Supported Formats
- **Input**: JPEG, PNG, GIF, WebP, BMP
- **Output**: JPEG, PNG, WebP
- **Maximum Size**: 2048x2048 pixels
- **Maximum File**: 10MB

### Processing Flow
```
1. File upload validation
   ↓
2. Format detection and conversion
   ↓
3. Size adjustment and optimization
   ↓
4. Base64 encoding
   ↓
5. Storage and transmission
```

## 🔒 Security Mechanisms

### Input Validation
- **File Type Check**: Dual validation of MIME type and file extension
- **File Size Limit**: Prevention of large file attacks
- **Content Filtering**: Malicious content detection and filtering

### Session Security
- **Random ID Generation**: Using cryptographically secure random number generator
- **Session Isolation**: Complete isolation of data between different sessions
- **Automatic Expiration**: Prevention of session leakage and resource occupation

### Network Security
- **CORS Configuration**: Appropriate cross-origin resource sharing settings
- **Rate Limiting**: Prevention of API abuse and DDoS attacks
- **Input Sanitization**: Prevention of XSS and injection attacks

## 📊 Performance Optimization

### Memory Management
- **Session Cleanup**: Periodic cleanup of expired sessions
- **Image Caching**: Intelligent image caching strategy
- **Connection Pool**: WebSocket connection reuse

### Response Optimization
- **Static File Caching**: Browser caching strategy
- **Compression**: Gzip compression
- **Asynchronous Processing**: Non-blocking I/O operations

### Concurrency Handling
- **Event-Driven**: Node.js event loop
- **Connection Limits**: Reasonable concurrent connection limits
- **Load Balancing**: Support for multi-instance deployment

## 🔍 Monitoring and Logging

### Logging System
- **Leveled Logging**: ERROR, WARN, INFO, DEBUG
- **Structured Logging**: JSON format, easy to analyze
- **Log Rotation**: Prevention of oversized log files

### Performance Monitoring
- **Response Time**: API response time monitoring
- **Memory Usage**: Real-time memory usage
- **Connection Status**: WebSocket connection status
- **Error Rate**: Error frequency and type

### Health Checks
```bash
# Service status check
curl http://localhost:5000/api/version

# Memory usage check
curl http://localhost:5000/api/health

# Connection status check
curl http://localhost:5000/api/status
```

## 🚀 Extensibility Design

### Plugin System
- **Tool Extensions**: Support for custom MCP tools
- **Middleware**: Express middleware extensions
- **Event Hooks**: Lifecycle event hooks

### Data Storage Extensions
- **Memory Storage**: Default implementation
- **Redis Storage**: Distributed session storage
- **Database Storage**: Persistent storage support

### Deployment Extensions
- **Single Machine**: Simple and direct
- **Cluster**: Multi-instance load balancing
- **Containerization**: Docker support
- **Cloud Native**: Kubernetes deployment

---

## 📚 Technical References

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
