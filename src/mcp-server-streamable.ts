import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { MeetbotClient } from './meetbot-client.js';
import { InMemoryEventStore } from './in-memory-event-store.js';

/**
 * Streamable HTTP MCP Server implementation
 */
export class MeetbotMCPStreamable {
  private server: McpServer;
  private transports: Map<string, StreamableHTTPServerTransport> = new Map();
  private clients: Map<string, MeetbotClient> = new Map();

  constructor() {
    this.server = new McpServer({
      name: 'meetbot-mcp',
      version: '1.2.3',
      description: 'Meet.bot MCP Server for scheduling and booking',
    });

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // Configure Meet.bot authentication tool
    this.server.registerTool('configure_meetbot', {
      title: 'Configure Meet.bot Authentication',
      description: 'Configure Meet.bot API authentication (required before using other tools)',
      inputSchema: {},
    }, async (_, extra) => {
      console.log('🔧 Configure Meetbot called for session:', extra.sessionId);
      
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      // Check if client is already configured
      const existingClient = this.clients.get(extra.sessionId);
      if (existingClient) {
        return {
          content: [
            {
              type: 'text',
              text: '✅ Meet.bot client is already configured and ready to use.',
            },
          ],
        };
      }
      
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ Meet.bot client not configured. Please ensure the Authorization header is provided during connection.',
          },
        ],
      };
    });

    // Get scheduling pages tool
    this.server.registerTool('get_scheduling_pages', {
      title: 'Get Scheduling Pages',
      description: 'Get all scheduling pages for the authenticated user',
      inputSchema: {},
    }, async (_, extra) => {
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      const client = this.clients.get(extra.sessionId);
      if (!client) {
        throw new Error('Meet.bot client not configured. Please use configure_meetbot first.');
      }

      const pages = await client.getPages();
      return {
        content: [
          {
            type: 'text',
            text: `Found ${pages.pages.length} scheduling pages for ${
              pages.email
            }:\n\n${pages.pages
              .map(
                (page) => `• ${page.title} (${page.duration} min) - ${page.url}`
              )
              .join('\n')}`,
          },
        ],
      };
    });

    // Get page info tool
    this.server.registerTool('get_page_info', {
      title: 'Get Page Information',
      description: 'Get information about a specific scheduling page',
      inputSchema: {
        page: z.string().describe('The URL of the scheduling page'),
      },
    }, async ({ page }, extra) => {
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      const client = this.clients.get(extra.sessionId);
      if (!client) {
        throw new Error('Meet.bot client not configured. Please use configure_meetbot first.');
      }

      if (!page) {
        throw new Error('Page URL is required');
      }

      const pageInfo = await client.getPageInfo({ page });
      return {
        content: [
          {
            type: 'text',
            text: `Page Information:\n\nTitle: ${pageInfo.title}\nDuration: ${pageInfo.duration} minutes\nOwner: ${pageInfo.owner_name}\nMax days ahead: ${pageInfo.max_days_into_the_future}\nURL: ${pageInfo.url}`,
          },
        ],
      };
    });

    // Get available slots tool
    this.server.registerTool('get_available_slots', {
      title: 'Get Available Slots',
      description: 'Get available booking slots for a scheduling page',
      inputSchema: {
        page: z.string().describe('The URL of the scheduling page'),
        count: z.number().optional().describe('Maximum number of slots to return'),
        start: z.string().optional().describe('Start date in YYYY-MM-DD format'),
        end: z.string().optional().describe('End date in YYYY-MM-DD format'),
        timezone: z.string().optional().describe('Timezone in IANA format (e.g., America/New_York)'),
        booking_link: z.boolean().optional().describe('Include shareable booking links'),
      },
    }, async ({ page, ...args }, extra) => {
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      const client = this.clients.get(extra.sessionId);
      if (!client) {
        throw new Error('Meet.bot client not configured. Please use configure_meetbot first.');
      }

      if (!page) {
        throw new Error('Page URL is required');
      }

      const slots = await client.getSlots({ page, ...args } as any);
      return {
        content: [
          {
            type: 'text',
            text: `Found ${slots.count} available slots (${
              slots.duration
            } min each):\n\n${slots.slots
              .map((slot) => {
                const date = new Date(slot.start).toLocaleString();
                const urlInfo = slot.url ? `\n  Booking link: ${slot.url}` : '';
                return `• ${date}${urlInfo}`;
              })
              .join('\n\n')}`,
          },
        ],
      };
    });

    // Book meeting tool
    this.server.registerTool('book_meeting', {
      title: 'Book Meeting',
      description: 'Book a new meeting slot',
      inputSchema: {
        page: z.string().describe('The URL of the scheduling page'),
        guest_email: z.string().describe('Email address of the guest'),
        guest_name: z.string().describe('Name of the guest'),
        notes: z.string().optional().describe('Additional notes for the meeting'),
        start: z.string().describe('Start time in ISO 8601 format'),
      },
    }, async ({ page, guest_email, guest_name, notes, start }, extra) => {
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      const client = this.clients.get(extra.sessionId);
      if (!client) {
        throw new Error('Meet.bot client not configured. Please use configure_meetbot first.');
      }

      if (!page || !guest_email || !guest_name || !start) {
        throw new Error('Required parameters missing: page, guest_email, guest_name, start');
      }

      const booking = await client.bookSlot({ page, guest_email, guest_name, notes, start } as any);
      return {
        content: [
          {
            type: 'text',
            text: `Meeting booked successfully!\n\nGuest: ${
              booking.guest_name
            } (${booking.guest_email})\nStart: ${new Date(
              booking.start
            ).toLocaleString()}\nCalendar ID: ${booking.ical_uid}\nPage: ${
              booking.page
            }`,
          },
        ],
      };
    });

    // Health check tool
    this.server.registerTool('health_check', {
      title: 'Health Check',
      description: 'Check if the Meet.bot API client is healthy',
      inputSchema: {},
    }, async (_, extra) => {
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      const client = this.clients.get(extra.sessionId);
      if (!client) {
        throw new Error('Meet.bot client not configured. Please use configure_meetbot first.');
      }

      const isHealthy = await client.healthCheck();
      return {
        content: [
          {
            type: 'text',
            text: isHealthy
              ? '✅ Meet.bot API client is healthy and can connect to the API.'
              : '❌ Meet.bot API client cannot connect to the API. Please check your configuration.',
          },
        ],
      };
    });
  }

  /**
   * Create Express app with MCP endpoints
   */
  createApp(): express.Application {
    const app = express();
    app.use(express.json());

    // CORS configuration
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id, Last-Event-ID');
      res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
      
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      next();
    });

    // MCP POST endpoint (naked path for dedicated MCP subdomain)
    app.post('/', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string;
      
      console.log('🔍 MCP POST request for session:', sessionId);
      console.log('🔍 Request body:', req.body);
      
      try {
        let transport: StreamableHTTPServerTransport;
        if (sessionId && this.transports.has(sessionId)) {
          // Reuse existing transport
          transport = this.transports.get(sessionId)!;
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // New initialization request
          const eventStore = new InMemoryEventStore();
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            eventStore, // Enable resumability
            onsessioninitialized: (sessionId) => {
              console.log(`🔍 Session initialized with ID: ${sessionId}`);
              this.transports.set(sessionId, transport!);
              
              // Check for Authorization header and auto-configure if present
              const authHeader = req.headers.authorization;
              if (authHeader && authHeader.startsWith('Bearer ')) {
                const authToken = authHeader.substring(7);
                console.log(`🔍 Auto-configuring client with Authorization header for session: ${sessionId}`);
                try {
                  const client = new MeetbotClient({ authToken });
                  this.clients.set(sessionId, client);
                  console.log(`🔍 Client auto-configured successfully for session: ${sessionId}`);
                } catch (error) {
                  console.log(`🔍 Failed to auto-configure client:`, error);
                }
              } else {
                console.log(`🔍 No Authorization header provided for session: ${sessionId} - client will need to be configured later`);
              }
            }
          });

          // Set up onclose handler to clean up transport when closed
          transport.onclose = () => {
            const sid = transport.sessionId;
            if (sid && this.transports.has(sid)) {
              console.log(`🔍 Transport closed for session ${sid}, removing from transports map`);
              this.transports.delete(sid);
              this.clients.delete(sid);
            }
          };

          // Connect the transport to the MCP server BEFORE handling the request
          await this.server.connect(transport);
          await transport.handleRequest(req, res, req.body);
          return; // Already handled
        } else {
          // Invalid request - no session ID or not initialization request
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided'
            },
            id: null
          });
          return;
        }

        // Handle the request with existing transport
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('🔍 Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error'
            },
            id: null
          });
        }
      }
    });

    // MCP GET endpoint for SSE streams (naked path for dedicated MCP subdomain)
    app.get('/', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string;
      
      console.log('🔍 MCP GET request for session:', sessionId);
      
      if (!sessionId || !this.transports.has(sessionId)) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }

      // Check for Last-Event-ID header for resumability
      const lastEventId = req.headers['last-event-id'] as string;
      if (lastEventId) {
        console.log(`🔍 Client reconnecting with Last-Event-ID: ${lastEventId}`);
      } else {
        console.log(`🔍 Establishing new SSE stream for session ${sessionId}`);
      }

      const transport = this.transports.get(sessionId)!;
      await transport.handleRequest(req, res);
    });

    // MCP DELETE endpoint for session termination (naked path for dedicated MCP subdomain)
    app.delete('/', async (req: Request, res: Response) => {
      const sessionId = req.headers['mcp-session-id'] as string;
      
      console.log(`🔍 Received session termination request for session ${sessionId}`);
      
      if (!sessionId || !this.transports.has(sessionId)) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }

      try {
        const transport = this.transports.get(sessionId)!;
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error('🔍 Error handling session termination:', error);
        if (!res.headersSent) {
          res.status(500).send('Error processing session termination');
        }
      }
    });

    // Health check endpoint
    app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'meetbot-mcp' });
    });

    return app;
  }
}
