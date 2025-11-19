# Production Status

## 🚀 Live Deployment

**Production URL**: https://meetbot-mcp-production.up.railway.app

**Status**: ✅ Running and healthy

**Last Verified**: October 17, 2025

## Endpoints

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/health` | GET | ✅ Yes | Health check endpoint |
| `/sse` | GET | ✅ Yes | SSE connection for MCP communication |
| `/messages?sessionId=<id>` | POST | ✅ Yes | Receive client messages |

## Testing Production

### Health Check
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://meetbot-mcp-production.up.railway.app/health
```

**Expected Response:**
```json
{"status":"ok","service":"meetbot-mcp"}
```

### Connect to SSE
```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
     https://meetbot-mcp-production.up.railway.app/sse
```

## Authentication

All endpoints require a Bearer token:
```
Authorization: Bearer <your-meetbot-api-token>
```

The same token is used for:
1. Authenticating to the MCP server
2. Making calls to the Meet.bot API

## Configuration

- **Platform**: Railway
- **Runtime**: Node.js 20+
- **Module System**: ES Modules
- **Port**: Dynamically assigned by Railway
- **Auto-restart**: Enabled
- **Health Checks**: Enabled

## Version History

### v1.1.1 (Current)
- ✅ ES Module compatibility fixed
- ✅ Production deployment validated
- ✅ Live at Railway

### v1.1.0
- ✅ HTTP/SSE transport added
- ✅ Bearer token authentication
- ✅ Dual mode support (stdio + HTTP)

### v1.0.4
- ✅ Health check using real API endpoint
- ✅ Initial stdio version

## Monitoring

### Check Server Status
```bash
# Should return 401 (server is up, auth working)
curl -I https://meetbot-mcp-production.up.railway.app/health
```

### Railway Dashboard
```bash
railway open
railway logs
railway status
```

## Package Status

**npm Package**: `@meetbot/mcp`
**Latest Version**: 1.1.1
**Status**: Ready to publish

## Usage Example

### For AI Assistants (MCP Clients)

Configure your MCP client to connect to:

```json
{
  "mcpServers": {
    "meetbot": {
      "url": "https://meetbot-mcp-production.up.railway.app/sse",
      "headers": {
        "Authorization": "Bearer YOUR_MEETBOT_API_TOKEN"
      }
    }
  }
}
```

### For Direct API Usage

```typescript
import { MeetbotClient } from '@meetbot/mcp';

const client = new MeetbotClient({
  authToken: 'your-token'
});

const pages = await client.getPages();
console.log(pages);
```

## Support

- **Issues**: https://gitlab.com/meetbot/meetbot-mcp/-/issues
- **Documentation**: https://docs.meet.bot
- **Production Logs**: `railway logs`

## Security Notes

- ✅ All requests require authentication
- ✅ HTTPS enforced by Railway
- ✅ Bearer tokens not logged
- ✅ Session isolation per connection
- ⚠️ Consider adding rate limiting for high-traffic scenarios

## Next Steps

1. **Publish to npm**: `npm publish --access public`
2. **Tag release**: `git tag v1.1.1 && git push --tags`
3. **Monitor metrics**: Set up alerts in Railway dashboard
4. **Update docs**: Add to main Meet.bot documentation

## Deployment Commands

```bash
# View logs
railway logs --tail

# Check status
railway status

# Restart if needed
railway restart

# Update deployment
git push  # Auto-deploys via Railway
# OR
railway up  # Manual deploy from CLI
```

