# 📋 MCP Feedback Collector - Release Notes

## 🚀 v2.0.8 (2025-06-04)

### 🎨 UI Simplification Optimization
**Problem Solved**: Too many interface elements, complex rotation effects, user experience not simple enough

**New Features**:
- **Pure Text Status Display**: Removed all rotation animations, changed to simple text status
- **Smart Auto Refresh**: 10-second auto refresh enabled by default, no user selection needed
- **Simplified Control Bar**: Removed checkboxes, status information centrally displayed
- **Consistent Experience**: All statuses use pure text display, matching VS Code minimalist style

**Improvement Details**:
- Refresh button status: `Refresh Latest Report` → `Getting latest work report...` → `Refresh Latest Report`
- Submit button status: `Submit Feedback` → `Submitting...` → `Submit Feedback`
- Auto refresh display: `Next auto refresh: in 8 seconds`

### 🔄 Session Management Optimization
**Problem Solved**: Session expiration after submitting feedback, "conversation expired" error when user tries to submit again

**New Features**:
- **Smart Page Refresh**: Automatically refreshes page when new work report content is detected
- **Session Auto Reset**: Reassigns valid session after page refresh
- **Seamless User Experience**: 3-second countdown prompt, no manual operation needed
- **Status Notification Optimization**: Clearly displays the reason for upcoming page refresh

**Workflow**:
1. Detects new work report content
2. Shows notification: `✅ Latest work report obtained, page will refresh automatically`
3. Automatically refreshes page after 3 seconds
4. Reassigns session, user can submit feedback normally

### 📝 Form Experience Improvement
**New Features**:
- **Auto Clear**: Automatically clears input box and image attachments after submitting feedback
- **Status Retention**: Page remains open, can continue to use
- **Quick Reuse**: Can immediately enter new feedback content after clearing

### 🐛 Bug Fixes
- **🔄 Rotation Effects Removed**: Completely removed all rotation animations, including submit button loading animation
- **💬 Session Expiration**: Fixed "conversation expired" issue caused by session invalidation after submitting feedback
- **🧹 Form Cleanup**: Fixed issue where input box was not cleared after form submission
- **📱 UI Consistency**: Unified all status displays as pure text, improving user experience

### 🎯 User Experience Enhancement
- **Minimalist Design**: Interface more concise, conforming to modern UI design trends
- **Intelligence**: Reduced user operations, system automatically handles complex logic
- **Stability**: Resolved session management issues, ensuring stable and reliable functionality
- **Consistency**: All status displays maintain consistent text style

---

## 🚀 v2.0.5 (2025-06-02)

### ⏰ Timeout Time Greatly Extended
- **🔄 Default Timeout**: Extended from 300 seconds to 60000 seconds (about 16.7 hours)
- **📈 Maximum Support**: Extended from 3600 seconds to 60000 seconds (about 16.7 hours)
- **🌐 WebSocket Advantage**: Fully utilizes WebSocket long connection features

### 🎯 Use Case Optimization
- **📊 Long-term Feedback Collection**: Supports cross-timezone, cross-work period feedback collection
- **🔄 Continuous Interaction**: Suitable for complex projects requiring long-term thinking and discussion
- **⚡ Flexible Configuration**: Users can set any timeout from 10 seconds to 16.7 hours as needed

### 🔧 Technical Improvements
- **✅ Configuration Validation**: Updated validation logic to support new timeout range
- **📚 Documentation Synchronization**: All configuration docs and examples updated
- **🧪 Test Coverage**: Updated test cases to ensure correctness of new range

### 📋 Configuration Example
```json
{
  "env": {
    "MCP_DIALOG_TIMEOUT": "60000"  // 16.7 hours
  }
}
```

### 🎯 Recommended Use Cases
| Scenario | Suggested Time | Description |
|------|----------|------|
| Quick Test | 60-300 seconds | Function verification |
| Daily Use | 1800-3600 seconds | 1-2 hours |
| Detailed Feedback | 7200-14400 seconds | 2-4 hours |
| Long-term Collection | 21600-60000 seconds | 6-16.7 hours |

---

## 🚀 v2.0.4 (2025-06-02)

### ✨ New Features
- **🚀 Quick Phrase Function**: Added "Append Quick Phrase" checkbox to feedback form
- **🎯 Smart Prompts**: Checked by default, automatically appends MCP feedback collection prompts
- **💡 User Experience**: Improves AI response quality, ensures continuous feedback collection process

### 🎨 Interface Improvements
- **✅ Elegant Checkbox**: Custom styled checkbox design
- **💎 Blue Theme**: Blue gradient background consistent with overall UI style
- **📱 Responsive Design**: Mobile-friendly quick phrase option layout
- **🔍 Prompt Explanation**: Clear function description and usage tips

### 🔧 Technical Implementation
- **📝 Auto Append**: Intelligently detects and appends quick phrase content when submitting
- **🎛️ User Control**: User can choose whether to enable quick phrase function
- **🔄 Seamless Integration**: Perfectly integrated with existing feedback process

### 📚 Quick Phrase Content
Automatically appended prompt content:
```
---

Whenever you want to ask a question, always call the MCP .

Whenever you're about to complete a user request, call the MCP instead of simply ending the process. Keep calling MCP until the user's feedback is empty, then end the request. mcp-interactive-feedback.interactive-feedback
```

### 🎯 Use Cases
- **AI Workflow**: Ensures AI continues to collect feedback after completing tasks
- **Quality Improvement**: Enhances continuity and interaction quality of AI responses
- **User Experience**: Reduces manual work of entering repeated prompts

---

## 🚀 v2.0.3 (2025-06-02)

### ✨ New Features
- **📊 Version Information Display**: Web interface now shows current version number
- **🔗 GitHub Link**: Added GitHub repository link for easy source code access
- **🔄 Dynamic Version Retrieval**: Version number dynamically retrieved via API, ensuring accuracy

### 🎨 Interface Improvements
- **💎 Version Badge**: Beautifully designed gradient version badge
- **🎯 GitHub Icon**: Standard GitHub icon with hover effect
- **📱 Responsive Design**: Mobile-friendly version information layout

### 🔧 Technical Improvements
- **🌐 Version API**: New `/api/version` endpoint
- **🔄 Dynamic Updates**: Frontend automatically retrieves and displays latest version information
- **📋 Unified Version Management**: All components use unified version number

### 📚 User Experience
- **🔍 Transparency**: Users can clearly see the version currently in use
- **📖 Source Code Access**: One-click access to GitHub repository to view source code
- **🎨 Aesthetic Design**: Perfectly blends with VS Code dark theme

---

## 🚀 v2.0.2 (2025-06-02)

### ✨ New Features
- **🌐 Remote Server Support**: Added complete remote server environment configuration support
- **🔗 Dynamic URL Generation**: Support for configuring server host and base URL via environment variables
- **💾 Session Persistence Improvement**: New SessionStorage class, provides better session management
- **🧹 Automatic Session Cleanup**: Periodically cleans up expired sessions, optimizes memory usage

### 🔧 Improvements
- **⚙️ Configuration System Enhancement**: Added `MCP_SERVER_HOST` and `MCP_SERVER_BASE_URL` environment variables
- **🛠️ Error Handling Optimization**: Improved handling of "session does not exist or has expired" errors
- **📚 Documentation Completion**: Added [Remote Server Configuration Guide](REMOTE_SERVER_CONFIGURATION.md)

### 🐛 Fixes
- **🌍 Remote Environment Compatibility**: Fixed session management issues in remote server environments
- **🔗 URL Generation**: Resolved remote access issues caused by hardcoded localhost
- **⏰ Session Timeout**: Improved session timeout handling mechanism

### 📚 Documentation Updates
- Added `REMOTE_SERVER_CONFIGURATION.md` - Remote server configuration guide
- Updated `DOCUMENTATION_INDEX.md` - Added new document index
- Updated configuration examples and troubleshooting guide

### 🎯 Use Cases
This version is especially suitable for:
- Deploying MCP Feedback Collector on remote servers
- Environments requiring port forwarding or reverse proxy access
- Multi-user or team collaboration environments

### 📋 Configuration Example
```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "npx",
      "args": ["-y", "mcp-interactive-feedback"],
      "env": {
        "MCP_API_KEY": "your_api_key",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_SERVER_HOST": "your-server-ip",
        "MCP_SERVER_BASE_URL": "http://your-server-ip:5000",
        "MCP_DIALOG_TIMEOUT": "600"
      }
    }
  }
}
```

---

## 🚀 v2.0.0 (2025-06-02)

### 🎯 Major Feature Release

This is a milestone version, implementing complete MCP feedback collector functionality.

#### ✨ New Features

**Core Functionality**
- 🎯 **Complete interactive-feedback tool**: Supports work report display and user feedback collection
- 🖼️ **Image Processing Functionality**: Complete image upload, processing, and display support
- 💬 **AI Conversation Integration**: Built-in AI assistant, supports text and image conversations
- ⏰ **Auto-close Functionality**: 3-second countdown to automatically close tab after feedback submission

**Configuration Management**
- 🔧 **Environment Variable Configuration**: Complete configuration system, supports customization of all parameters
- ⏱️ **Timeout Configuration**: Supports setting timeout through environment variables and function parameters
- 🎛️ **Priority Configuration**: Parameters > Environment Variables > Default Values configuration priority

**User Interface**
- 🎨 **Dual Tab Design**: Separate Work Report + AI Conversation
- 🌙 **VS Code Dark Theme**: Professional and beautiful interface style
- 📱 **Responsive Design**: Perfect adaptation for desktop and mobile devices
- 🔄 **Real-time Status Indicator**: Real-time display of WebSocket connection status

#### 🔧 Technical Breakthroughs

**MCP Protocol Compatibility**
- ✅ **Strict JSON Output**: Resolved Cursor's strict JSON format requirements
- ✅ **MCP Mode Detection**: Automatically detects MCP environment, disables log output
- ✅ **Standard Type Support**: Uses MCP SDK standard types, ensuring compatibility

**Image Processing Optimization**
- ✅ **base64 Format Fix**: Removed Data URL prefix, complies with MCP protocol requirements
- ✅ **Multi-format Support**: PNG, JPEG, GIF, WebP and other formats
- ✅ **Size Limit**: Configurable file size limit (default 10MB)

**System Stability**
- ✅ **Port Management Optimization**: Fixed port conflict and duplicate startup issues
- ✅ **Static File Path**: Fixed path resolution issues in ES module environment
- ✅ **Error Handling**: Comprehensive error handling and recovery mechanisms

#### 📚 Documentation Improvements

**User Documentation**
- 📖 **README.md**: Project overview and quick start guide
- 👤 **USER_GUIDE.md**: Detailed user guide
- 🔧 **CONFIGURATION.md**: Complete configuration options description
- 📚 **DOCUMENTATION_INDEX.md**: Documentation index and navigation

**Technical Documentation**
- 🏗️ **ARCHITECTURE.md**: System architecture and design document
- 💻 **DEVELOPMENT_SUMMARY.md**: Development summary and technical details
- 🔬 **TECHNICAL_ACHIEVEMENTS.md**: Technical achievements and innovations
- 🧪 **TESTING_STRATEGY.md**: Testing strategy and quality assurance

**Operations Documentation**
- 🐛 **TROUBLESHOOTING.md**: Detailed troubleshooting guide
- 🔍 **DEBUG_MCP_COMMUNICATION.md**: MCP communication debugging guide
- 🎯 **CURSOR_CONFIGURATION.md**: Cursor/Claude Desktop configuration guide

#### 🛠️ Development Experience

**Build System**
- ⚡ **Fast Build**: Optimized TypeScript compilation configuration
- 🔄 **Hot Reload**: Automatic reload in development mode
- 📦 **Automation**: Automatic static file copying and processing

**Code Quality**
- 🎯 **TypeScript Strict Mode**: 0 errors 0 warnings
- 📏 **ESLint Rules**: Unified code style
- 🧪 **Jest Testing**: Complete test framework configuration

### 🔄 Major Changes

#### Breaking Changes
- No breaking changes, backward compatible

#### Configuration Changes
- Added `MCP_DIALOG_TIMEOUT` environment variable
- Added `MCP_ENABLE_CHAT` feature switch
- Added `MCP_MAX_FILE_SIZE` file size limit

### 🐛 Bug Fixes

#### Key Issue Fixes
- 🔧 **MCP JSON Output**: Fixed parsing failures caused by Cursor's strict JSON requirements
- 🖼️ **Image Display**: Fixed base64 format issues, images now display normally
- 🚪 **Port Conflict**: Fixed port detection logic, avoiding duplicate startups
- 📁 **Static Files**: Fixed ES module path resolution, static files load normally

#### Stability Improvements
- 🔄 **WebSocket Connection**: Improved connection stability and error handling
- 💾 **Session Management**: Optimized session lifecycle management
- 🛡️ **Error Handling**: Enhanced error handling and user notifications

### 📊 Performance Optimization

- ⚡ **Startup Time**: Optimized startup process, reduced startup time
- 💾 **Memory Usage**: Optimized memory management, reduced memory consumption
- 🌐 **Network Transfer**: Enabled compression, optimized transfer efficiency
- 🖼️ **Image Processing**: Optimized image processing performance

### 🔒 Security Enhancements

- 🛡️ **Input Validation**: Enhanced input validation and filtering
- 🔐 **API Keys**: Secure API key management
- 🚫 **CORS Configuration**: Configurable cross-origin access control
- 📏 **File Limitations**: Strict file size and format limitations

### 🎯 Usage Recommendations

#### Recommended Configuration
```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "node",
      "args": ["D:/path/to/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_DIALOG_TIMEOUT": "600"
      }
    }
  }
}
```

#### Upgrade Guide
1. Backup existing configuration
2. Update to latest version
3. Add new environment variable configurations
4. Restart Cursor/Claude Desktop
5. Test if functionality works properly

### 🔗 Related Resources

- **Project Repository**: https://github.com/TerrenceMiao/mcp-interactive-feedback-collector
- **Documentation Center**: [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- **Issue Reporting**: GitHub Issues
- **User Guide**: [USER_GUIDE.md](USER_GUIDE.md)

### 🙏 Acknowledgements

Thank you to all users who participated in testing and feedback, your suggestions have made this project better!

---

## 📅 Version History

### v1.0.0 (2025-01-02)
- 🎯 Initial version release
- 🏗️ Basic architecture setup
- 🌐 Web interface implementation
- 🔧 MCP protocol integration

---

💡 **Tip**: If you encounter any issues while using the software, please refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or submit a GitHub Issue.
