# MCP Feedback Collector Configuration Guide

## 📋 Environment Variable Configuration

### Required Configuration

| Variable Name | Description | Example Value |
|--------|------|--------|
| `MCP_API_KEY` | AI API Key | `sk-xxx...` |

### Optional Configuration

| Variable Name | Description | Default Value | Valid Range |
|--------|------|--------|----------|
| `MCP_API_BASE_URL` | AI API Base URL | `https://api.ssopen.top` | Valid URL |
| `MCP_DEFAULT_MODEL` | Default AI Model | `gpt-4o-mini` | Any string |
| `MCP_WEB_PORT` | Web Server Port | `5000` | 1024-65535 |
| `MCP_DIALOG_TIMEOUT` | Feedback Collection Timeout (seconds) | `60000` | 10-60000 |
| `MCP_ENABLE_CHAT` | Enable AI Conversation Feature | `true` | true/false |
| `MCP_CORS_ORIGIN` | CORS Allowed Origin | `*` | Any string |
| `MCP_MAX_FILE_SIZE` | Maximum File Size (bytes) | `10485760` | 1024-104857600 |
| `LOG_LEVEL` | Log Level | `info` | error/warn/info/debug |

## 🔧 MCP Configuration Examples

### Cursor/Claude Desktop Configuration

```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "node",
      "args": ["D:/path/to/dist/cli.js"],
      "env": {
        "MCP_API_KEY": "sk-zhdAJNyzSg1vAeoGhAaY5cnaMgDuvs0Q9H5LirPUuWW7hQGr",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_DIALOG_TIMEOUT": "60000"
      }
    }
  }
}
```

### NPX Configuration (Recommended)

```json
{
  "mcpServers": {
    "mcp-interactive-feedback": {
      "command": "npx",
      "args": ["mcp-interactive-feedback"],
      "env": {
        "MCP_API_KEY": "your_api_key_here",
        "MCP_API_BASE_URL": "https://api.ssopen.top",
        "MCP_DEFAULT_MODEL": "grok-3",
        "MCP_DIALOG_TIMEOUT": "60000"
      }
    }
  }
}
```

## ⏱️ Timeout Configuration Details

### Environment Variable Method

```bash
# Set default timeout to 16.7 hours
export MCP_DIALOG_TIMEOUT="60000"
```

### MCP Configuration Method

```json
{
  "env": {
    "MCP_DIALOG_TIMEOUT": "60000"
  }
}
```

### Tool Function Call

```typescript
// Timeout is read uniformly from environment variable
interactive-feedback("Work report content")
```

### Timeout Configuration

Timeout is managed uniformly through the `MCP_DIALOG_TIMEOUT` environment variable:

1. **Environment Variable MCP_DIALOG_TIMEOUT** - Unified configuration
2. **Default Value 60000 seconds** - Fallback default value

### Timeout Recommendations

| Use Case | Recommended Time | Description |
|---------|---------|------|
| Quick Testing | 60-300 seconds | For feature verification |
| Daily Use | 1800-3600 seconds | Balanced user experience |
| Detailed Feedback | 7200-14400 seconds | Complex project reviews |
| Long-term Collection | 21600-60000 seconds | Continuous feedback collection |
| Demonstrations | 300-600 seconds | Avoid long waits |

## 🎯 Common Configuration Scenarios

### Quick Testing (Short Timeout)

```json
{
  "env": {
    "MCP_DIALOG_TIMEOUT": "60"
  }
}
```

### Detailed Feedback (Long Timeout)

```json
{
  "env": {
    "MCP_DIALOG_TIMEOUT": "1800"
  }
}
```

### Production Environment (Balanced Configuration)

```json
{
  "env": {
    "MCP_API_KEY": "your_production_key",
    "MCP_API_BASE_URL": "https://api.ssopen.top",
    "MCP_DEFAULT_MODEL": "grok-3",
    "MCP_DIALOG_TIMEOUT": "600",
    "MCP_WEB_PORT": "5000",
    "MCP_ENABLE_CHAT": "true",
    "LOG_LEVEL": "info"
  }
}
```

## 🔍 Configuration Verification

### Check Current Configuration

```bash
npx mcp-interactive-feedback config
```

### Health Check

```bash
npx mcp-interactive-feedback health
```

### Test Configuration

```bash
npx mcp-interactive-feedback test-feedback --timeout 120
```

## ⚠️ Important Notes

1. **Timeout Range**: Must be between 10-60000 seconds
2. **Port Conflicts**: Ensure the specified port is not occupied
3. **API Key**: Properly secure API keys in production environments
4. **File Size**: Image uploads are limited by `MCP_MAX_FILE_SIZE`
5. **Network Environment**: Ensure access to the specified API base URL

## 🐛 Troubleshooting

### Invalid Configuration

```bash
# Check configuration syntax
npx mcp-interactive-feedback config

# View detailed error information
LOG_LEVEL=debug npx mcp-interactive-feedback start
```

### Timeout Issues

```bash
# Increase timeout
export MCP_DIALOG_TIMEOUT="900"

# Or set in MCP configuration
{
  "env": {
    "MCP_DIALOG_TIMEOUT": "900"
  }
}
```

### Port Conflicts

```bash
# Use a different port
export MCP_WEB_PORT="8080"
```
