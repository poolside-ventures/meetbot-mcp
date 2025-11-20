# Meet.bot MCP (Model Context Protocol)

A Model Context Protocol (MCP) server for the Meet.bot Booking Page API, enabling AI assistants to interact with scheduling and booking functionality.

## What is this?

This MCP server connects AI assistants (like Claude, ChatGPT, and others that support MCP) to your Meet.bot account, allowing them to schedule meetings on your behalf. Instead of manually copying booking links or checking your calendar, you can simply ask your AI assistant to "schedule a 30-minute meeting with John next week" and it will handle the booking through your MeetBot scheduling pages.

**How it works:**
1. Connect your MeetBot API token to the MCP server
2. Configure your AI assistant to use this MCP server
3. Ask your AI assistant to schedule meetings - it can check your availability, find time slots, and book meetings directly through your MeetBot account

This is particularly useful for busy professionals who want to automate meeting scheduling and let their AI assistant manage their calendar intelligently.

If you don't have an account, you can get one for free at https://meet.bot

## Features

- **Complete API Coverage**: Implements all endpoints from the Meet.bot Booking Page API v1
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Runtime Validation**: Zod schemas for input validation and data integrity
- **Authentication Support**: Bearer token authentication
- **Error Handling**: Robust error handling with detailed error messages
- **Health Checks**: Built-in health monitoring using the /v1/pages endpoint
- **MCP Protocol Compliance**: Full Model Context Protocol server implementation
- **Dual Mode Support**: Run locally (stdio) or remotely (HTTP/SSE)
- **Production Deployed**: Live at https://mcp.meet.bot
- **Production Ready**: Thoroughly tested and validated for production use

## Installation

```bash
npm install @meetbot/mcp
```

## Quick Start

### 1. Install and Configure

```bash
# Install the package
npm install @meetbot/mcp

# Or install globally for CLI usage
npm install -g @meetbot/mcp
```

### 2. Configure the MCP Server

Configure the Meet.bot API client with your authentication token:

```typescript
// Configure with bearer token
await configure_meetbot({
  authToken: "your_bearer_token_here"
});
```

### 3. Use the Available Tools

The MCP server provides the following tools:

#### Get Scheduling Pages
```typescript
await get_scheduling_pages();
// Returns all scheduling pages for the authenticated user
```

#### Get Page Information
```typescript
await get_page_info({
  page: "https://meet.bot/user/30min"
});
// Returns detailed information about a specific scheduling page
```

#### Get Available Slots
```typescript
await get_available_slots({
  page: "https://meet.bot/user/30min",
  count: 10,
  start: "2025-01-01",
  end: "2025-01-31",
  timezone: "America/New_York",
  booking_link: true
});
// Returns available booking slots with optional filters
```

#### Book a Meeting
```typescript
await book_meeting({
  page: "https://meet.bot/user/30min",
  guest_email: "guest@example.com",
  guest_name: "Jane Doe",
  notes: "Meeting to discuss project requirements",
  start: "2025-01-15T14:00:00Z"
});
// Books a new meeting slot
```

#### Health Check
```typescript
await health_check();
// Verifies API connectivity using the /v1/pages endpoint
```

## Deployment Options

The MCP server can be run in two modes:

### 1. Local Mode (Stdio Transport)

For local integration with AI assistants like Claude Desktop. Uses stdio transport for communication.

```bash
# Run locally
npx @meetbot/mcp

# Or with environment variable
MEETBOT_AUTH_TOKEN="your_token" npx @meetbot/mcp
```

### 2. HTTP Mode (SSE Transport)

For remote deployment with HTTP/SSE transport. This allows the MCP server to be accessed over the network.

#### Running the HTTP Server

```bash
# Build and start the HTTP server
npm run build
npm run start:http

# Or with custom port
PORT=8080 npm run start:http

# Or run directly with npx
npx meetbot-mcp-http
```

#### Server Endpoints

- **SSE Endpoint**: `GET /sse` - Establishes an SSE connection for MCP communication
- **Messages Endpoint**: `POST /messages?sessionId=<id>` - Receives client messages
- **Health Check**: `GET /health` - Server health status

#### Authentication

All requests require a Bearer token in the Authorization header:

```bash
Authorization: Bearer <your-meetbot-api-token>
```

The same token is used to authenticate with the Meet.bot API.

#### Testing the HTTP Server

**Local Testing:**
```bash
# Health check (should fail without auth)
curl http://localhost:3000/health

# Health check with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/health

# Connect to SSE endpoint
curl -N -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/sse

# Or use the test script
./test-http-server.sh YOUR_TOKEN
```

**Production Testing:**
```bash
# Test the live deployment
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://mcp.meet.bot/health

# Expected response:
# {"status":"ok","service":"meetbot-mcp"}
```

#### Deployment

The HTTP server can be deployed to various platforms:

- **Railway**: `railway up` ✅ **Live at https://mcp.meet.bot**
- **Fly.io**: `fly launch && fly deploy`
- **Google Cloud Run**: Container-based deployment
- **AWS App Runner**: Container-based deployment
- **Any VPS**: Run with Node.js directly

**Example: Connecting to Production**
```bash
# Your MCP client should connect to:
# https://mcp.meet.bot/sse

# With Authorization header:
# Authorization: Bearer <your-meetbot-api-token>
```

Example Dockerfile:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/cli-http.js"]
```

## MCP Integration

### Using with AI Assistants

This MCP server can be integrated with AI assistants like Claude, ChatGPT, and others that support the Model Context Protocol.

#### Configuration Example

```json
{
  "mcpServers": {
    "meetbot": {
      "command": "npx",
      "args": ["@meetbot/mcp"],
      "env": {
        "MEETBOT_AUTH_TOKEN": "your_bearer_token_here"
      }
    }
  }
}
```

#### Available MCP Tools

The server exposes 6 tools for AI assistants:

1. **`configure_meetbot`** - Configure API connection
2. **`get_scheduling_pages`** - List all scheduling pages
3. **`get_page_info`** - Get page details
4. **`get_available_slots`** - Find available time slots
5. **`book_meeting`** - Book a meeting
6. **`health_check`** - Verify API connectivity using /v1/pages endpoint

### Testing and Validation

The package has been thoroughly tested and validated:

✅ **MCP Protocol Compliance**: Full JSON-RPC 2.0 support
✅ **Tool Discovery**: All 6 tools properly exposed
✅ **Error Handling**: Graceful error responses
✅ **Type Safety**: Complete TypeScript support
✅ **Schema Validation**: Input validation with Zod
✅ **Production Ready**: Tested with real MCP clients

### Package Statistics

- **Package Size**: 12.8 kB (58.0 kB unpacked)
- **Test Coverage**: 21 passing tests
- **Dependencies**: 3 production dependencies
- **TypeScript**: 100% type coverage
- **Build Status**: ✅ Passing
- **npm Registry**: Published and available

## Usage Examples

### As a Library

```typescript
import { MeetbotClient, MeetbotMCPServer } from '@meetbot/mcp';

// Use as a direct API client
const client = new MeetbotClient({
  authToken: 'your_token'
});

// Use as an MCP server
const server = new MeetbotMCPServer();
await server.run();
```

### As an MCP Server

```bash
# Run the MCP server
npx @meetbot/mcp

# Or install globally
npm install -g @meetbot/mcp
meetbot-mcp
```

## API Reference

### MeetbotClient

The core API client for direct integration:

```typescript
import { MeetbotClient } from '@meetbot/mcp';

const client = new MeetbotClient({
  authToken: 'your_token'
});

// Get all scheduling pages
const pages = await client.getPages();

// Get page information
const pageInfo = await client.getPageInfo({
  page: 'https://meet.bot/user/30min'
});

// Get available slots
const slots = await client.getSlots({
  page: 'https://meet.bot/user/30min',
  count: 20
});

// Book a meeting
const booking = await client.bookSlot({
  page: 'https://meet.bot/user/30min',
  guest_email: 'guest@example.com',
  guest_name: 'Jane Doe',
  start: '2025-01-15T14:00:00Z'
});
```

### Data Types

All API responses are fully typed:

```typescript
interface BookSlot {
  success: boolean;
  page: string;
  guest_email: string;
  guest_name: string;
  notes?: string;
  start: string;
  ical_uid: string;
}

interface PageInfo {
  title: string;
  duration: number;
  url: string;
  owner_name: string;
  max_days_into_the_future: number;
}

interface Slots {
  count: number;
  duration: number;
  slots: SlotDetails[];
}
```

## Configuration

### Environment Variables

You can configure the MCP server using environment variables:

```bash
export MEETBOT_AUTH_TOKEN="your_bearer_token"

# Then run the server
meetbot-mcp
```

### Authentication

The MCP server supports Bearer Token authentication:

1. **Bearer Token**: Use `authToken` for API key authentication

## Development

### Running Tests

```bash
npm test
npm run test:watch
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## CLI Usage

The package includes a command-line interface for running the MCP server:

```bash
# Install globally
npm install -g @meetbot/mcp

# Run the MCP server
meetbot-mcp

# Or run directly with npx (no installation required)
npx @meetbot/mcp
```

### Environment Variables

You can configure the server using environment variables:

```bash
export MEETBOT_AUTH_TOKEN="your_bearer_token"

# Then run the server
meetbot-mcp
```

## Error Handling

The MCP server provides detailed error messages for common issues:

- **Configuration Errors**: Missing or invalid configuration parameters
- **Authentication Errors**: Invalid tokens
- **API Errors**: Detailed error messages from the Meet.bot API
- **Validation Errors**: Input validation failures with specific field errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a merge request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [https://docs.meet.bot](https://docs.meet.bot)
- **Issues**: [GitLab Issues](https://gitlab.com/meetbot/meetbot-mcp/-/issues)
- **Discussions**: [GitLab Discussions](https://gitlab.com/meetbot/meetbot-mcp/-/issues)

## Changelog

### 1.2.6
- **Documentation Updates**: Updated production URL from Railway to https://mcp.meet.bot
- **Enhanced README**: Added "What is this?" section explaining the MCP's purpose and how to use it for scheduling meetings through MeetBot accounts
- **User Onboarding**: Added link to sign up for a free Meet.bot account

### 1.1.1
- **ES Module Fix**: Fixed ES module compatibility for Railway and other Node.js deployments
- **Import Extensions**: Added proper `.js` extensions to all relative imports
- **Live Deployment**: Successfully deployed to https://mcp.meet.bot
- **Production Validated**: Confirmed working in production environment

### 1.1.0
- **HTTP/SSE Transport**: Added HTTP server with SSE transport for remote deployment
- **Bearer Token Authentication**: Implemented authentication for HTTP endpoints
- **Multi-mode Support**: Can run as local stdio server or remote HTTP server
- **Deployment Ready**: Added Dockerfile and deployment configurations for Railway, Fly.io, etc.
- **Health Check Endpoint**: Added `/health` endpoint for monitoring
- **Session Management**: Proper session handling with transport cleanup
- **Production Ready**: Complete HTTP implementation with authentication and error handling

### 1.0.4
- **Fixed Health Check**: Now uses the real `/v1/pages` endpoint instead of a fake health endpoint
- **Updated Documentation**: Clarified health check implementation details
- **Improved Reliability**: Health check now properly validates API connectivity

### 1.0.3
- **Simplified Configuration**: Removed baseUrl requirement - now hardcoded to https://meet.bot
- **Updated Documentation**: Simplified configuration examples
- **Improved UX**: Users only need to provide authToken

### 1.0.2
- **Fixed Authentication**: Removed unsupported sessionId parameter
- **Corrected API URL**: Updated from api.meet.bot to meet.bot
- **Updated Documentation**: Accurate authentication examples

### 1.0.1
- **Enhanced Documentation**: Comprehensive README with usage examples
- **MCP Integration Guide**: Added AI assistant configuration examples
- **Testing Results**: Added validation and testing information

### 1.0.0
- **Initial release** - Production-ready MCP server for Meet.bot API
- **Complete API coverage** - All Meet.bot Booking Page API v1 endpoints
- **TypeScript support** - Full type safety with comprehensive definitions
- **Runtime validation** - Zod schemas for input validation and data integrity
- **MCP server implementation** - Full Model Context Protocol compliance
- **CLI tool** - Command-line interface for running the MCP server
- **Error handling** - Robust error handling with detailed messages
- **Authentication** - Support for bearer token authentication
- **Health checks** - Built-in API connectivity monitoring using /v1/pages endpoint
- **Testing** - Comprehensive test suite with 21 passing tests
- **Documentation** - Complete API documentation and usage examples
- **Functional Testing** - Verified with real MCP client requests
- **npm Publishing** - Successfully published to npm registry
