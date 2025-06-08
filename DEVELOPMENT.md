# 🛠️ Development Documentation

## 📋 Project Architecture

### Core Components
- **CLI Entry**: `src/cli.ts` - Command line interface and startup logic
- **MCP Server**: `src/server/mcp-server.ts` - MCP protocol implementation
- **Web Server**: `src/server/web-server.ts` - HTTP/WebSocket service
- **Configuration Management**: `src/config/index.ts` - Environment variables and configuration
- **Utility Functions**: `src/utils/` - Logging, port management, image processing, etc.

### Technology Stack
- **Backend**: Node.js + TypeScript + Express
- **Frontend**: HTML5 + CSS3 + JavaScript + Socket.IO
- **Protocol**: MCP (Model Context Protocol)
- **Image Processing**: Sharp
- **Build Tools**: TypeScript Compiler

## 🧪 Testing Strategy

### Test Types
1. **Unit Tests** - Jest framework, covering core functionality
2. **Integration Tests** - MCP protocol integration testing
3. **End-to-End Tests** - Complete user flow testing
4. **Performance Tests** - Concurrent connections and response time

### Test Commands
```bash
npm test              # Run all tests
npm run test:unit     # Unit tests
npm run test:integration # Integration tests
npm run test:coverage # Test coverage
```

## 🔧 Development Environment

### Requirements
- Node.js >= 18.0.0
- TypeScript >= 5.0.0
- Supported platforms: Windows, macOS, Linux

### Development Commands
```bash
npm run dev           # Development mode
npm run build         # Build project
npm run clean         # Clean build files
npm run lint          # Code linting
```

## 🏗️ Build Process

### Build Steps
1. **TypeScript Compilation** - Compile TS files to JS
2. **Static File Copy** - Copy HTML/CSS/JS to dist directory
3. **Dependency Packaging** - Process third-party dependencies
4. **File Optimization** - Compress and optimize output files

### Release Process
1. **Version Update** - Update package.json version number
2. **Build Verification** - Ensure successful build
3. **Test Verification** - Run complete test suite
4. **NPM Publishing** - Publish to NPM registry
5. **GitHub Release** - Create GitHub Release

## 🐛 Debugging Guide

### MCP Communication Debugging
```bash
# Enable detailed logs
DEBUG=mcp:* npm start

# Test MCP connection
npm run test:mcp
```

### Web Service Debugging
```bash
# Enable Web debugging
DEBUG=web:* npm start

# Test WebSocket connection
npm run test:websocket
```

## 📊 Performance Monitoring

### Key Metrics
- **Response Time** - API response time < 100ms
- **Concurrent Connections** - Support 100+ concurrent WebSocket connections
- **Memory Usage** - Runtime memory < 100MB
- **CPU Usage** - CPU < 10% under normal load

### Monitoring Tools
- Built-in performance monitor
- Real-time logging
- Error tracking and reporting

## 🔒 Security Considerations

### Security Measures
1. **Input Validation** - Strict validation of all user inputs
2. **File Upload Limits** - Limit file types and sizes
3. **Session Management** - Secure session ID generation and validation
4. **CORS Configuration** - Appropriate cross-origin resource sharing settings

### Sensitive Information Protection
- Environment variables store sensitive configurations
- .gitignore ignores sensitive files
- No hardcoded keys in code

## 🚀 Deployment Guide

### Local Deployment
```bash
npm install -g mcp-interactive-feedback
mcp-interactive-feedback
```

### Server Deployment
```bash
# Using PM2 for process management
pm2 start npm --name "mcp-feedback" -- start

# Using Docker
docker build -t mcp-interactive-feedback .
docker run -p 5000:5000 mcp-interactive-feedback
```

### Environment Variable Configuration
```bash
MCP_WEB_PORT=5000           # Web service port
MCP_LOG_LEVEL=info          # Log level
MCP_SESSION_TIMEOUT=3600    # Session timeout
MCP_MAX_FILE_SIZE=10485760  # Maximum file size
```

## 📈 Version Release

### Version Number Rules
- **Major**: Breaking changes (x.0.0)
- **Minor**: New features, backward compatible (0.x.0)
- **Patch**: Bug fixes, backward compatible (0.0.x)

### Release Checklist
- [ ] Version number updated
- [ ] Build successful
- [ ] Tests passed
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] NPM published
- [ ] GitHub Release created

## 🤝 Contribution Guidelines

### Code Standards
- Use TypeScript strict mode
- Follow ESLint configuration
- Write unit tests
- Update relevant documentation

### Commit Standards
```
type(scope): brief description

detailed description (optional)

Related Issue: #123
```

Types: feat, fix, docs, style, refactor, test, chore

---

## 📞 Technical Support

For technical issues, please:
1. Check troubleshooting documentation
2. Search known issues
3. Create a GitHub Issue
4. Contact the maintenance team
