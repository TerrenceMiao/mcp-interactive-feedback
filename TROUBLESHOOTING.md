# 🔧 MCP Feedback Collector - Troubleshooting Guide

## 📋 Common Issues

### 1. Static File Path Error in MCP Configuration

**Symptom**: When using MCP configuration in Claude Desktop, the browser shows "Internal Server Error" with the error message "ENOENT: no such file or directory, stat 'index.html'".

**Error Example**:
```json
{"error":"Internal Server Error","message":"ENOENT: no such file or directory, stat 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\cursor\\dist\\static\\index.html'"}
```

**Cause Analysis**:
- `__dirname` is not available in ES modules, causing static file path resolution errors
- In MCP mode, the working directory may differ from the project directory
- Relative paths may fail in different execution environments

**Solution**:
1. **Use ES module compatible path resolution** (fixed in v2.0.0):
   ```typescript
   import { fileURLToPath } from 'url';
   import path from 'path';

   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   const staticPath = path.resolve(__dirname, '../static');
   ```

2. **Verify fix**:
   ```bash
   # Rebuild the project
   npm run build

   # Test functionality
   mcp-interactive-feedback test-feedback
   ```

**Recommended MCP Configuration**:
```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "node",
      "args": ["D:/path/to/project/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your-api-key",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3"
      }
    }
  }
}
```

### 2. Port Conflict and Duplicate Startup Errors

**Symptom**: Error `Error: listen EADDRINUSE: address already in use :::5000` at startup, or seeing duplicate startup logs.

**Error Example**:
```
Error: listen EADDRINUSE: address already in use :::5000
    at Server.setupListenHandle [as _listen2] (node:net:1937:16)
    at listenInCluster (node:net:1994:12)
    at Server.listen (node:net:2099:7)
```

**Cause Analysis**:
- Test server in port detection logic not properly closed
- Duplicate startup logic in CLI
- Race condition in the `isPortAvailable` function of the port manager

**Solution** (fixed in v2.0.0):
1. **Fix port detection logic**:
   ```typescript
   async isPortAvailable(port: number): Promise<boolean> {
     return new Promise((resolve) => {
       const server = createServer();

       server.listen(port, () => {
         // Port available, close test server immediately
         server.close(() => {
           resolve(true);
         });
       });

       server.on('error', (err: any) => {
         // Port unavailable
         resolve(false);
       });
     });
   }
   ```

2. **Remove duplicate startup logic**: Delete default startup code in CLI

**Verify fix**:
```bash
# Rebuild
npm run build

# Test startup
node D:/path/to/project/dist/cli.js

# Should see single startup log:
# ✅ Web server started successfully: http://localhost:5000
# ✅ MCP server started successfully
```

### 3. MCP Server Shows Red but Functions Normally

**Symptom**: In the MCP Servers panel of Claude Desktop, mcp-interactive-feedback shows as red status, but tool call functionality works normally.

**Phenomenon Description**:
- MCP server shows red indicator in Claude Desktop
- Tool function `interactive-feedback` can be called normally and returns results
- Server logs show normal startup and operation
- Can process MCP protocol messages normally

**Possible Causes**:
1. **Incomplete initialization process**: MCP protocol requires complete initialization handshake, including `initialize` request and `initialized` notification
2. **Connection status monitoring**: Claude Desktop may rely on specific heartbeat or status check mechanisms
3. **Protocol version compatibility**: Different versions of MCP protocol may have subtle differences
4. **Transport layer status**: Connection status of stdio transport may not be reported correctly

**Solution** (fixed in v2.0.0):

**Key Finding**: Cursor has extremely strict requirements for MCP JSON output; any non-JSON content will cause parsing failure.

1. **Implement MCP mode detection**:
   ```typescript
   // Detect MCP mode immediately at CLI startup
   const isMCPMode = !process.stdin.isTTY;
   if (isMCPMode) {
     logger.disableColors();
     logger.setLevel('silent' as any);
   }
   ```

2. **Completely disable log output**:
   ```typescript
   // Add silent mode support in logger
   private shouldLog(level: LogLevel): boolean {
     if (this.currentLevel === 'silent') {
       return false; // Completely disable all logs
     }
     return LOG_LEVELS[level] <= LOG_LEVELS[this.currentLevel];
   }
   ```

3. **Ensure pure JSON output**:
   - In MCP mode: Output only JSON, no logs, color codes, or welcome messages
   - In interactive mode: Display logs and welcome messages normally

**Verification Steps**:
```bash
# Test MCP protocol communication (should return pure JSON only)
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/cli.js

# Correct output example:
# {"result":{"tools":[{"name":"interactive-feedback",...}]},"jsonrpc":"2.0","id":1}
```

**Important Reminders**:
- ⚠️ **Do not use `--debug` parameter in Cursor configuration**, this will cause log output to contaminate JSON
- ✅ **Cursor requires extremely pure JSON output**, any additional content will cause parsing failure
- 🔧 **For debugging use**: `node dist/cli.js --debug` in command line to see detailed logs

**Recommended Cursor Configuration**:
```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "node",
      "args": ["D:/path/to/project/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your-api-key",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3"
      }
    }
  }
}
```

**Notes**:
- After fixing, the MCP server should show green status
- If it still shows red, restart Cursor to refresh connection status
- Functionality is completely normal, you can safely use the interactive-feedback tool

### 4. Cursor Image Display Issues

**Symptom**: Images uploaded by users do not display in the Cursor chat interface, only showing text descriptions

**Cause Analysis**:
1. **Incompatible type definitions**: Custom MCPContent type does not match MCP SDK standard types
2. **Incorrect return format**: Not using the standard CallToolResult type provided by MCP SDK
3. **Image format not compliant**: Image data format does not comply with MCP protocol requirements

**Solution** (fixed in v2.0.0):

1. **Use MCP SDK standard types**:
   ```typescript
   // Import MCP SDK standard types
   import { CallToolResult, TextContent, ImageContent } from '@modelcontextprotocol/sdk/types.js';

   // Use standard return type
   async function collectFeedback(): Promise<CallToolResult> {
     return {
       content: [
         { type: 'text', text: 'Text content' },
         {
           type: 'image',
           data: 'base64-encoded-data',
           mimeType: 'image/png'
         }
       ]
     };
   }
   ```

2. **Correct image format**:
   ```typescript
   // Image content compliant with MCP specification
   const imageContent: ImageContent = {
     type: 'image',
     data: img.data, // base64 encoded image data
     mimeType: img.type // Correct MIME type
   };
   ```

3. **Mixed content array**:
   ```typescript
   // Support for mixed text and image content array
   const content: (TextContent | ImageContent)[] = [
     { type: 'text', text: 'Feedback content:' },
     { type: 'image', data: base64Data, mimeType: 'image/png' },
     { type: 'text', text: 'Submission time: 2025-06-02' }
   ];
   ```

**Verification Steps**:
```bash
# Test image display functionality
node dist/cli.js test-feedback --message "Test image display" --timeout 120

# Upload an image in the browser, then check the result in Cursor
# The image should display directly in the chat interface
```

**Technical Details**:
- **Supported formats**: PNG, JPEG, GIF, WebP
- **Data encoding**: base64 string
- **MIME type**: Must be set correctly (e.g., image/png, image/jpeg)
- **Display position**: Images will display directly after the corresponding text description

**Key Fix** (v2.0.0):
Found that the image processor was returning the complete Data URL format (`data:image/png;base64,xxx`), but the MCP protocol requires pure base64 strings.

```typescript
// Before fix (incorrect) - includes Data URL prefix
data: img.data // "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."

// After fix (correct) - pure base64 string
const base64Data = img.data.replace(/^data:image\/[^;]+;base64,/, '');
data: base64Data // "iVBORw0KGgoAAAANSUhEUgAA..."
```

**Notes**:
- Image data must be pure base64 encoding (without Data URL prefix)
- MIME type must match the actual image format
- Large images may affect transmission performance, compression is recommended
- Cursor strictly validates base64 format, any invalid characters will cause parsing failure

### 5. WebSocket Connection Failure

**Symptom**: Interface shows "Connection Failed" or "Connection Disconnected"

**Possible Causes**:
- Static file path configuration error
- Socket.IO library not loaded correctly
- Port occupied or blocked by firewall

**Solution**:
```bash
# 1. Check if server started normally
npm start health

# 2. Check if port is occupied
netstat -an | grep :5000

# 3. Try using another port
npm start -- --port 5001

# 4. Check firewall settings
# Windows: Allow Node.js through firewall
# macOS/Linux: Check iptables rules
```

**Debugging Steps**:
1. Open browser developer tools (F12)
2. Check Console tab for error messages
3. Check Network tab for request status
4. Access test page: `http://localhost:port/test.html`

### 2. Port Occupied

**Symptom**: Error at startup `EADDRINUSE: address already in use`

**Solution**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_ID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Or use another port
npm start -- --port 5001
```

### 3. Build Failure

**Symptom**: `npm run build` reports error

**Common Errors**:
- TypeScript compilation errors
- Missing dependencies
- File permission issues

**Solution**:
```bash
# 1. Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 2. Check TypeScript configuration
npx tsc --noEmit

# 3. Check ESLint
npm run lint

# 4. Clean build directory
npm run clean
npm run build
```

### 4. Image Upload Failure

**Symptom**: Images cannot be displayed after selection or paste

**Possible Causes**:
- File size exceeds limit
- File format not supported
- Browser permission issues

**Solution**:
1. Check file size (default limit 10MB)
2. Ensure file format is common image format (jpg, png, gif, webp)
3. Check browser clipboard permissions
4. Try using file selection instead of paste

### 5. MCP Tool Function Call Failure

**Symptom**: interactive-feedback call fails in Claude Desktop

**Checklist**:
```bash
# 1. Verify MCP configuration
cat ~/.config/claude-desktop/claude_desktop_config.json

# 2. Check server status
npm start health

# 3. View server logs
npm start -- --debug

# 4. Test tool function
npm start test-mcp
```

**MCP Configuration Example**:
```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "npx",
      "args": ["mcp-interactive-feedback"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## 🐛 Debugging Tips

### 1. Enable Debug Logs

```bash
# Set debug level
export LOG_LEVEL=debug
npm start

# Or set in .env file
echo "LOG_LEVEL=debug" >> .env
```

### 2. Check System Status

```bash
# Health check
npm start health

# Display configuration
npm start config

# Check port status
npm start -- --check-ports
```

### 3. Browser Debugging

1. **Developer Tools**: F12 → Console/Network
2. **WebSocket Connection**: Check WS connection status
3. **Error Messages**: View specific error stacks
4. **Network Requests**: Check API call status

### 4. Server Log Analysis

**Log Levels**:
- `ERROR`: Serious errors, need immediate attention
- `WARN`: Warning information, may affect functionality
- `INFO`: General information, normal operation status
- `DEBUG`: Detailed debug information

**Key Log Identifiers**:
- `✅`: Successful operation
- `❌`: Failed operation
- `🚧`: Operation in progress
- `⚠️`: Warning information

## 🔍 Performance Issues

### 1. High Memory Usage

**Check Method**:
```bash
# View memory usage
npm start health

# Use Node.js built-in tools
node --inspect dist/cli.js
```

**Optimization Suggestions**:
- Check for memory leaks
- Limit concurrent connections
- Periodically clean up expired sessions

### 2. Long Response Time

**Possible Causes**:
- Network latency
- High server load
- Slow database queries

**Optimization Solutions**:
- Enable compression middleware
- Optimize static file caching
- Reduce unnecessary log output

## 📞 Getting Help

### 1. Log Collection

When reporting issues, please provide the following information:

```bash
# System information
node --version
npm --version
uname -a  # Linux/macOS
systeminfo  # Windows

# Application information
npm start config
npm start health

# Error logs
npm start -- --debug > debug.log 2>&1
```

### 2. Issue Report Template

```markdown
**Environment Information**:
- Operating System: 
- Node.js Version: 
- NPM Version: 
- Application Version: 

**Problem Description**:
- Specific Symptoms: 
- Steps to Reproduce: 
- Expected Behavior: 
- Actual Behavior: 

**Error Messages**:
```
[Paste error logs]
```

**Solutions Attempted**:
- [ ] Restart server
- [ ] Clear cache
- [ ] Check configuration
- [ ] View logs
```

### 3. Contact Information

- **GitHub Issues**: [Project Repository](https://github.com/TerrenceMiao/mcp-interactive-feedback/issues)
- **Documentation**: [README.md](README.md)
- **Update Log**: [CHANGELOG.md](CHANGELOG.md)

## 🔄 Regular Maintenance

### 1. Log Cleanup

```bash
# Clean old log files
find logs/ -name "*.log" -mtime +7 -delete

# Limit log file size
logrotate /etc/logrotate.d/mcp-interactive-feedback
```

### 2. Dependency Updates

```bash
# Check outdated dependencies
npm outdated

# Update dependencies
npm update

# Security audit
npm audit
npm audit fix
```

### 3. Performance Monitoring

```bash
# Monitor memory usage
watch -n 5 'npm start health'

# Monitor port status
netstat -tulpn | grep :5000
```
