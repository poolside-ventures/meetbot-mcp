#!/usr/bin/env node

import { MeetbotMCPServer } from './mcp-server.js';

/**
 * CLI entry point for the Meet.bot MCP server
 */
async function main(): Promise<void> {
  try {
    const server = new MeetbotMCPServer();
    await server.run();
  } catch (error) {
    console.error('Failed to start Meet.bot MCP server:', error);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.error('Meet.bot MCP server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Meet.bot MCP server shutting down...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
