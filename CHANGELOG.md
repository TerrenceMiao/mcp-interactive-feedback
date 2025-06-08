# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.8] - 2025-06-04

### Added
- Smart page refresh mechanism, automatically refreshes page when new work report content is detected
- Session automatic reset function, solves session expiration issues
- Form auto-clear function, automatically clears input box and image attachments after submitting feedback
- 3-second countdown prompt, improves user experience

### Changed
- UI simplification optimization: removed all rotation animations, changed to pure text status display
- Automatic refresh enabled by default, removed user checkbox, simplified interface
- Unified all status displays to pure text, consistent with VS Code minimalist style
- Optimized refresh button state change logic

### Fixed
- Fixed "conversation expired" issue caused by session invalidation after submitting feedback
- Fixed rotation effects of submit and refresh buttons
- Fixed issue where input box was not cleared after form submission
- Fixed inconsistent version number display issue

### Removed
- Removed all CSS rotation animations and visual effects
- Removed auto-refresh checkbox and related UI elements
- Removed complex status indicators

## [2.0.7] - 2025-06-03

### Added
- Fixed URL mode, uses fixed root path for access
- Force port configuration, supports specified port without fallback
- Automatic process termination function, resolves port occupation issues
- Cross-platform process management support

### Changed
- Optimized user experience, window remains open after submitting feedback
- Improved dynamic refresh work report function
- Enhanced real-time updates and status indicators

### Fixed
- Fixed URL generation issues in remote server environments
- Fixed port conflict and duplicate startup issues

## [2.0.6] - 2025-06-02

### Added
- Version information display function
- GitHub links and source code access
- Dynamic version retrieval API

### Changed
- Improved interface version information display
- Optimized version management mechanism

## [2.0.5] - 2025-06-02

### Changed
- Significantly extended timeout: from 300 seconds to 60000 seconds (about 16.7 hours)
- Optimized long-term feedback collection scenario support
- Improved configuration validation logic

### Added
- Flexible timeout configuration options
- Better cross-timezone support

## [2.0.4] - 2025-06-02

### Added
- Quick phrases function, automatically appends MCP feedback collection prompts
- Elegant checkbox design
- Smart prompts and usage instructions

### Changed
- Improved feedback form user experience
- Optimized AI response quality

## [2.0.3] - 2025-06-02

### Added
- Web interface version information display
- GitHub repository link
- Dynamic version retrieval function

### Changed
- Improved interface aesthetics
- Optimized version management

## [2.0.2] - 2025-06-02

### Added
- Remote server environment configuration support
- Dynamic URL generation function
- SessionStorage class, improved session management
- Automatic session cleanup mechanism

### Changed
- Enhanced configuration system
- Improved error handling logic

### Fixed
- Fixed remote environment compatibility issues
- Resolved hardcoded localhost issues
- Improved session timeout handling

## [2.0.0] - 2025-06-02

### Added
- Complete interactive-feedback tool implementation
- Image processing and display functionality
- AI conversation integration
- Dual tab design (Work Report + AI Conversation)
- VS Code dark theme interface
- Responsive design support
- Real-time WebSocket connection
- Environment variable configuration system
- Complete documentation system

### Changed
- Refactored entire project architecture
- Optimized MCP protocol compatibility
- Improved build and deployment process

### Fixed
- Fixed MCP JSON output format issues
- Resolved image base64 format issues
- Fixed port conflict issues
- Resolved static file path issues

## [1.0.0] - 2025-01-02

### Added
- Initial version release
- Basic architecture setup
- Web interface implementation
- MCP protocol integration

---

## Version Notes

- **Major version**: Contains breaking changes
- **Minor version**: Adds new features, backward compatible
- **Patch version**: Bug fixes, backward compatible

## Links

- [Project Homepage](https://github.com/TerrenceMiao/mcp-interactive-feedback)
- [Issue Feedback](https://github.com/TerrenceMiao/mcp-interactive-feedback/issues)
- [Release Notes](RELEASE_NOTES.md)
