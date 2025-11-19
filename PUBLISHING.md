# Publishing to npm

## Prerequisites

1. npm account with publishing permissions
2. Logged in via `npm login`
3. All tests passing
4. Version bumped in package.json

## Pre-publish Checklist

- [x] Version updated to 1.1.1
- [x] Changelog updated
- [x] README updated with production URL
- [x] Code built successfully
- [x] Tests passing
- [x] Production deployment validated
- [x] .npmignore configured

## Verify Package Contents

```bash
# Dry run to see what will be published
npm pack --dry-run

# Or create actual tarball
npm pack
tar -tzf meetbot-mcp-1.1.1.tgz
```

## Publish Steps

### 1. Login to npm

```bash
npm login
```

### 2. Run Tests

```bash
npm test
```

### 3. Build

```bash
npm run build
```

### 4. Publish

```bash
# For first-time public package
npm publish --access public

# For subsequent releases
npm publish
```

### 5. Verify

```bash
# Check it's published
npm view @meetbot/mcp

# Install and test
npm install -g @meetbot/mcp
meetbot-mcp-http
```

## Post-publish

1. Tag the release in git:
```bash
git tag v1.1.1
git push origin v1.1.1
```

2. Create GitHub/GitLab release with changelog

3. Announce on social media / docs site

## Unpublish (Emergency Only)

⚠️ Only use within 72 hours of publish

```bash
npm unpublish @meetbot/mcp@1.1.1
```

## Version Strategy

- **Patch (1.1.x)**: Bug fixes, documentation updates
- **Minor (1.x.0)**: New features, non-breaking changes
- **Major (x.0.0)**: Breaking changes

## Current Version

**1.1.1** - ES Module fixes and production deployment

## Next Steps

Consider for future versions:
- Rate limiting middleware
- Prometheus metrics
- Request logging
- CORS configuration
- WebSocket transport alternative
- OAuth support

