# 🎯 MCP Interactive Feedback

[![npm version](https://badge.fury.io/js/mcp-interactive-feedback.svg)](https://www.npmjs.com/package/mcp-interactive-feedback)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

Nodejs based Interactive Feedback MCP Server - supports AI powered work reports and user feedback.

## ✨ Features

- 🚀 **One-Click Launch**: Run directly with `npx mcp-interactive-feedback`
- 🎨 **Modern Interface**: VS Code dark theme style web interface
- 🔧 **MCP Integration**: Complete support for Model Context Protocol
- 💬 **AI Conversation Features**: Integrated AI assistant, supports text and image conversations
- 🖼️ **Image Support**: Complete image upload, processing and display functionality
- 🌐 **Cross-Platform**: Supports Windows, macOS, Linux
- ⚡ **High Performance**: Resolves stability issues in the Python version

## 🚀 Quick Start

### Installation and Running

```bash
# Run directly (recommended)
npx mcp-interactive-feedback

# Or install globally
npm install -g mcp-interactive-feedback
mcp-interactive-feedback
```

### Environment Variable Configuration

Create a `.env` file:

```bash
# AI API Configuration
MCP_API_KEY="your_api_key_here"
MCP_API_BASE_URL="https://api.ssopen.top"  # Proxy server, can also use OpenAI official API
MCP_DEFAULT_MODEL="grok-3"

# Web Server Configuration
MCP_WEB_PORT="5000"
MCP_DIALOG_TIMEOUT="60000"  # Feedback collection timeout (seconds), range: 10-60000

# Feature Switches
MCP_ENABLE_CHAT="true"

# URL and Port Optimization Config (added in v2.0.7)
MCP_USE_FIXED_URL="true"           # Use fixed URL without session parameters (default: true)
MCP_FORCE_PORT="false"             # Force use of specified port (default: false)
MCP_KILL_PORT_PROCESS="false"      # Automatically terminate occupying process (default: false)
MCP_CLEANUP_PORT_ON_START="true"   # Clean up port on startup (default: true)
```

## 🔧 Usage Method

### Command Line Options

```bash
# Start server (default)
mcp-interactive-feedback

# Specify port
mcp-interactive-feedback --port 8080

# Only Web mode
mcp-interactive-feedback --web

# Test interactive-feedback functionality
mcp-interactive-feedback test-feedback

# Custom test content
mcp-interactive-feedback test-feedback -m "My work report" -t 120

# Health check
mcp-interactive-feedback health

# Display configuration
mcp-interactive-feedback config
```

### Claude Desktop Integration

#### Method One: NPM Package Run (Recommended)

In Claude Desktop, add the following to the cursor's MCP configuration:

```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "npx",
      "args": ["-y", "mcp-interactive-feedback@latest"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_WEB_PORT": "5050",
        "MCP_DIALOG_TIMEOUT": "60000"
      }
    }
  }
}
```

#### Method Two: Source Code Run (Local Development)

If you cloned the source code and want to run it directly, you can use the following configuration:

```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "node",
      "args": ["path/to/your/project/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_WEB_PORT": "5050",
        "MCP_DIALOG_TIMEOUT": "60000"
      }
    }
  }
}
```

**Note**:
- Replace `path/to/your/project` with your actual project path
- Ensure you run `npm run build` to build the project
- Use absolute path, e.g., `d:/projects/nodejsweb/dist/cli.js`

#### Method Three: TypeScript Source Code Direct Run (Development Mode)

If you want to run TypeScript source code directly without building:

```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "npx",
      "args": ["tsx", "path/to/your/project/src/cli.ts"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_WEB_PORT": "5050",
        "MCP_DIALOG_TIMEOUT": "60000",
        "NODE_ENV": "development"
      }
    }
  }
}
```

**Advantages**: No need to build, directly run source code
**Disadvantages**: Start a little slower, need tsx dependency

#### 🚀 Quick Configuration Example

Assuming your project is located in `d:\projects\nodejsweb`, the recommended configuration:

```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "node",
      "args": ["d:/zhuomian/nodejsweb/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_WEB_PORT": "5050",
        "MCP_DIALOG_TIMEOUT": "60000"
      }
    }
  }
}
```

**Configuration Steps**:
1. Ensure project is built: `npm run build`
2. Add the above configuration to the cursor's MCP setting
3. Replace `your_api_key_here` with your actual API key
4. Restart cursor, check MCP server status is green
## In cursor rules, you can configure it like this
"Whenever you want to ask a question, always call the MCP .

Whenever you're about to complete a user request, call the MCP instead of simply ending the process. Keep calling MCP until the user's feedback is empty, then end the request. mcp-interactive-feedback.interactive-feedback 


⚠️ **Important Reminder**:
- **Do not add `--debug` parameter in args**, this will cause JSON parsing failure
- Cursor/Claude Desktop requires extremely pure JSON output
- If debugging is needed, please use separately in command line: `npx mcp-interactive-feedback --debug`

💡 **API Service Recommendation**:
- Default configuration uses `https://api.ssopen.top` proxy server, supports multiple AI models
- Alternatively, use OpenAI official API: `https://api.openai.com/v1`
- Or other compatible API services in OpenAI format

## 🆕 Latest Feature (v2.0.8)

### 🎨 UI Simplification Optimization
- **Pure Text Status Display**: Remove rotation animation, simple and intuitive
- **Smart Automatic Refresh**: Default enabled, no need for user selection
- **Simple Design**: Conforms to modern UI design trend

### 🔄 Conversation Management Optimization
- **Smart Page Refresh**: Automatically refresh page when new content is detected
- **Conversation Automatic Reset**: Solves "Conversation Expiration" Problem
- **Seamless Experience**: 3-second countdown prompt

### 📝 Form Experience Improvement
- **Automatic Clear**: Input box is cleared automatically after submission
- **Continuous Availability**: Page remains open

### 🔗 Fixed URL Mode (v2.0.7)
- Use fixed root path: `http://localhost:5000`
- Supports multiple concurrent conversations
- Convenient for remote server forwarding

## 🛠️ MCP Tool Function

### interactive-feedback

Collect user feedback on AI work:

```typescript
// Basic call (timeout time read from environment variable)
interactive-feedback("I have completed the code refactoring work, mainly improving performance and readability.")
```

**Parameter Description**:
- `work_summary` (Required): AI work report content

**Timeout Time Configuration**:
- Timeout time is configured uniformly through environment variable `MCP_DIALOG_TIMEOUT`
- Default value is 60000 seconds (about 16.7 hours)
- Effective range: 10-60000 seconds

**Function**:
- Start Web interface to display work report
- Collect user text and image feedback
- Return structured feedback data
- Automatically manage server lifecycle
- Automatically close tab after 3 seconds (countdown)

## 🎨 Interface Features

- **Double Tab Design**: Work Report + AI Conversation
- **VS Code Theme**: Dark theme, professional and beautiful
- **Responsive Layout**: Supports desktop and mobile devices
- **Real-Time Communication**: WebSocket connection status indicator
- **Multi-Modal Support**: Text+Image Combined Input
- **Smart Close**: Automatically close tab after 3 seconds (countdown)

## 📋 System Requirements

- **Node.js**: 18.0.0 or higher version
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Operating System**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

## 🔒 Security Features

- Input Validation and File Size Limit
- CORS Configuration and Security Headers
- API Key Secure Storage
- Malicious Content Basic Detection

## 📊 Performance Indicators

- **Startup Time**: < 3 seconds
- **Memory Usage**: < 100MB
- **Response Time**: < 2 seconds
- **Concurrent Connections**: Supports 10 simultaneous connections

## 🐛 Fault Troubleshooting

### Common Issues

1. **WebSocket Connection Failure**
   ```bash
   # Check server status
   mcp-interactive-feedback health

   # Access test page
   http://localhost:5000/test.html

   # View browser console error information
   ```

2. **Port Occupied**
   ```bash
   # Check port usage
   netstat -an | grep :5000

   # Use other port
   mcp-interactive-feedback --port 5001
   ```

3. **API Key Error**
   ```bash
   # Check configuration
   mcp-interactive-feedback config

   # Set environment variable
   export MCP_API_KEY="your_key_here"
   ```

4. **Permission Problem**
   ```bash
   # Use npx to avoid global installation permission problem
   npx mcp-interactive-feedback
   ```

Detailed fault troubleshooting guide please refer to: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 📚 Complete Documentation

This project provides complete documentation system, please refer to [📚 Documentation Index](DOCUMENTATION_INDEX.md) to find the information you need:

- **User Guide**: [USER_GUIDE.md](USER_GUIDE.md) - Detailed Usage Instructions
- **Configuration Guide**: [CONFIGURATION.md](CONFIGURATION.md) - Environment Variable Configuration
- **Technical Documentation**: [ARCHITECTURE.md](ARCHITECTURE.md) - System Architecture Design
- **Fault Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Problem Solution
- **Version Description**: [RELEASE_NOTES.md](RELEASE_NOTES.md) - Version Update Record

## 📝 Development

### Local Development

```bash
# Clone project
git clone https://github.com/TerrenceMiao/mcp-interactive-feedback.git
cd mcp-interactive-feedback-web

# Install dependencies
npm install

# Development Mode (Real-Time Compile TypeScript)
npm run dev

# Build Project (Generate dist Directory)
npm run build

# Start Built Project
npm start

# Test
npm test

# Health Check
npm start health

# Display Configuration
npm start config
```

#### MCP Configuration Test

After building, you can use the following configuration in cursor for testing:

```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "node",
      "args": ["Your Project Path/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_WEB_PORT": "5050",
        "MCP_DIALOG_TIMEOUT": "60000"
      }
    }
  }
}
```

### Project Structure

```
src/
├── cli.ts              # CLI Entry
├── index.ts            # Main Entry
├── config/             # Configuration Management
├── server/             # Server Implementation
├── utils/              # Tool Functions
├── types/              # Type Definitions
└── static/             # Static Files
```

## 📄 License

MIT License - See [LICENSE](LICENSE) File

## 🤝 Contribution

Welcome to submit Issue and Pull Request!

1. Fork This Repository
2. Create Your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Submit Your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔗 Related Links

- **Project Home Page**: [GitHub Repository](https://github.com/TerrenceMiao/mcp-interactive-feedback)
- **NPM Package**: [mcp-interactive-feedback](https://www.npmjs.com/package/mcp-interactive-feedback)
- **Model Context Protocol**: [Official Website](https://modelcontextprotocol.io)
- **MCP Specification**: [Technical Specification](https://spec.modelcontextprotocol.io)
- **Claude Desktop**: [Download Address](https://claude.ai/desktop)

## 📊 Project Status

- **Current Version**: v2.0.8
- **Maintenance Status**: Active Maintenance
- **Supported Platform**: Windows, macOS, Linux

## 📚 Documentation Navigation

- **[User Guide](USER_GUIDE.md)** - Detailed Usage Instructions and Best Practices
- **[Configuration Document](CONFIGURATION.md)** - Environment Variable and Configuration Options
- **[Fault Troubleshooting](TROUBLESHOOTING.md)** - Common Issues and Solutions
- **[Development Document](DEVELOPMENT.md)** - Development Environment Setup and Contribution Guide
- **[Technical Document](TECHNICAL.md)** - System Architecture and Technical Details
- **[Update Log](CHANGELOG.md)** - Version Change History
- **[Release Note](RELEASE_NOTES.md)** - Detailed Release Information

## Thanks for Support
https://api.ssopen.top/ API Proxy Server, 290+ AI Large Models, Official Cost One-Seventh, Supports High Concurrency!
