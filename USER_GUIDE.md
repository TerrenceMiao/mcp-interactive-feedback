# 📖 MCP Feedback Collector - User Guide

## 🚀 Quick Start

### 1. Installation and Running

```bash
# Method 1: Direct Run (Recommended)
npx mcp-interactive-feedback

# Method 2: Global Installation
npm install -g mcp-interactive-feedback
mcp-interactive-feedback
```

### 2. Testing Functionality

```bash
# Test the complete feedback collection process
npx mcp-interactive-feedback test-feedback

# Custom test content
npx mcp-interactive-feedback test-feedback -m "I have completed the code refactoring work" -t 120
```

## 🎯 Use Cases

### Case 1: Using in Claude Desktop

1. **Configure MCP Server**
   
   Add to Claude Desktop configuration file:
   ```json
   {
     "mcpServers": {
       "mcp-interactive-feedback": {
         "command": "npx",
         "args": ["mcp-interactive-feedback"],
         "env": {
           "MCP_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```

2. **Call Tool Function**
   
   Use in Claude conversation:
   ```
   Please use the interactive-feedback tool to collect user feedback on the work I just completed.
   
   Work Report: I have completed the website homepage refactoring, with the following main improvements:
   1. Responsive layout optimization
   2. Loading performance improved by 30%
   3. User experience enhancements
   ```

3. **User Feedback Process**
   - Browser automatically opens feedback page
   - View AI's work report
   - Enter text feedback
   - Upload relevant images (optional)
   - Submit feedback

### Case 2: Standalone Web Mode

```bash
# Start Web Server
npx mcp-interactive-feedback --web --port 5000

# Visit http://localhost:5000
# Experience interface functionality in demo mode
```

### Case 3: Development and Testing

```bash
# Development Mode (Hot Reload)
git clone <repository>
cd mcp-interactive-feedback
npm install
npm run dev

# Test Mode
npm run test

# Build Production Version
npm run build
npm start
```

## 🎨 Interface Features

### Work Report Tab

- **AI Work Report Display**: Automatically shows the work content provided by AI
- **Feedback Form**: 
  - Text feedback input box
  - Image upload functionality (file selection + clipboard paste)
  - Image preview and deletion
  - Submit and clear buttons

### AI Conversation Tab

- **Chat Interface**: Maintains existing AI conversation functionality
- **Multi-modal Support**: Text + Image combined input
- **Streaming Response**: Real-time display of AI replies

### Connection Status

- **Real-time Indicator**: Shows connection status in the top right corner
- **Auto Reconnect**: Automatically attempts to reconnect during network interruptions
- **Error Messages**: Clear error information and solution suggestions

## 🔧 Configuration Options

### Environment Variables

Create a `.env` file:

```bash
# AI API Configuration
MCP_API_KEY="your_api_key_here"
MCP_API_BASE_URL="https://api.ssopen.top"
MCP_DEFAULT_MODEL="gpt-4o-mini"

# Web Server Configuration
MCP_WEB_PORT="5000"
MCP_DIALOG_TIMEOUT="300"  # Feedback collection timeout (seconds), range: 10-3600

# Feature Switches
MCP_ENABLE_CHAT="true"

# Security Configuration
MCP_CORS_ORIGIN="*"
MCP_MAX_FILE_SIZE="10485760"  # 10MB

# Log Configuration
LOG_LEVEL="info"  # error, warn, info, debug
```

### Command Line Parameters

```bash
# Basic Options
--port, -p <number>     Specify Web server port
--web, -w              Web mode only
--config, -c <path>     Specify configuration file path

# Test Options
--message, -m <text>    Test work report content
--timeout, -t <seconds> Timeout (seconds)
```

## 📱 Image Features

### Supported Formats

- **Image Formats**: JPG, PNG, GIF, WebP, BMP
- **File Size**: Maximum 10MB (configurable)
- **Quantity Limit**: Recommended not to exceed 5 images

### Upload Methods

1. **File Selection**: Click "📁 Select Image" button
2. **Clipboard Paste**: Click "📋 Paste Image" button
3. **Drag and Drop**: Directly drag images to the preview area

### Image Preview

- **Thumbnail Display**: 60x60 pixel preview
- **Delete Function**: Click "×" button to remove
- **Format Information**: Displays filename, type, size

## 🔍 Troubleshooting

### Common Issues

1. **WebSocket Connection Failure**
   ```bash
   # Check server status
   npx mcp-interactive-feedback health
   
   # Access test page
   http://localhost:5000/test.html
   ```

2. **Port Occupied**
   ```bash
   # Use another port
   npx mcp-interactive-feedback --port 5001
   
   # Check port usage
   netstat -an | grep :5000
   ```

3. **Image Upload Failure**
   - Check if file size exceeds limit
   - Confirm file format is supported
   - Check browser permission settings

### Debug Mode

```bash
# Enable detailed logs
export LOG_LEVEL=debug
npx mcp-interactive-feedback

# View configuration information
npx mcp-interactive-feedback config

# Health check
npx mcp-interactive-feedback health
```

## 🎯 Best Practices

### 1. Writing Work Reports

**Good Work Report Example**:
```
I have completed the development of the user login module, which includes:

✅ Completed Work:
1. User registration and login functionality
2. Password encryption and verification
3. JWT token management
4. User permission control

🔧 Technical Implementation:
- Used bcrypt for password encryption
- JWT token validity set to 7 days
- Implemented role-based permission management

📊 Test Results:
- Unit test coverage 95%
- Performance tests passed
- Security scan found no high-risk vulnerabilities

❓ Questions for Feedback:
1. Is the login interface user-friendly?
2. Are the password strength requirements appropriate?
3. Should third-party login be added?
```

### 2. Feedback Collection Tips

**Effective feedback includes**:
- Specific problem points
- Improvement suggestions
- Relevant screenshots or examples
- Priority assessment

### 3. Performance Optimization

- Regularly clean up expired sessions
- Control concurrent connection numbers
- Optimize image sizes
- Use appropriate timeout settings

## 📞 Getting Help

### Documentation Resources

- **README.md**: Project overview and quick start
- **ARCHITECTURE.md**: Technical architecture details
- **TROUBLESHOOTING.md**: Detailed troubleshooting guide
- **DEVELOPMENT_SUMMARY.md**: Development summary and technical details

### Community Support

- **GitHub Issues**: Report problems and feature requests
- **Discussion Area**: Technical exchange and usage experiences
- **Changelog**: Version updates and new features

### Contact Information

- **Project Repository**: https://github.com/TerrenceMiao/mcp-interactive-feedback
- **Issue Reporting**: Submit via GitHub Issues
- **Feature Suggestions**: Pull Requests welcome

## 🔄 Version Updates

### Current Version: v2.0.0

**Main Features**:
- ✅ Complete MCP tool function support
- ✅ VS Code dark theme interface
- ✅ Real-time WebSocket communication
- ✅ Multi-modal feedback collection
- ✅ Automated testing functionality

**Coming Soon**:
- 📋 More MCP tool functions
- 🎨 Interface theme customization
- 📊 Feedback data analysis
- 🔒 Enhanced security features

### Upgrade Guide

```bash
# Check current version
npx mcp-interactive-feedback --version

# Upgrade to latest version
npm update -g mcp-interactive-feedback

# Or reinstall
npm uninstall -g mcp-interactive-feedback
npm install -g mcp-interactive-feedback@latest
```
