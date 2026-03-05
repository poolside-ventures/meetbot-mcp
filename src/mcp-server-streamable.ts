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
      version: '1.2.9',
      description: 'Meet.bot MCP Server for scheduling and booking',
    });

    this.setupToolHandlers();
    this.setupPromptHandlers();
  }

  /** Tool annotations for MCP/Smithery quality: audience and priority per spec */
  private static readonly TOOL_ANNOTATIONS = {
    audience: ['user', 'assistant'] as const,
    priority: 0.8,
  };

  private setupToolHandlers(): void {
    // Get scheduling pages tool
    this.server.registerTool('get_scheduling_pages', {
      title: 'Get Scheduling Pages',
      description: 'Get all scheduling pages for the authenticated user',
      inputSchema: {},
      annotations: MeetbotMCPStreamable.TOOL_ANNOTATIONS,
    }, async (_, extra) => {
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      const client = this.clients.get(extra.sessionId);
      if (!client) {
        throw new Error('Meet.bot client not configured. Provide an Authorization: Bearer <token> header when connecting to the MCP server.');
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
        page: z.string().describe('The URL of the scheduling page (e.g. https://meet.bot/your-page)'),
      },
      annotations: MeetbotMCPStreamable.TOOL_ANNOTATIONS,
    }, async ({ page }, extra) => {
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      const client = this.clients.get(extra.sessionId);
      if (!client) {
        throw new Error('Meet.bot client not configured. Provide an Authorization: Bearer <token> header when connecting to the MCP server.');
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
        page: z.string().describe('The URL of the scheduling page (e.g. https://meet.bot/your-page)'),
        count: z.number().optional().describe('Maximum number of slots to return (defaults to server limit)'),
        start: z.string().optional().describe('Start date for the range in YYYY-MM-DD format'),
        end: z.string().optional().describe('End date for the range in YYYY-MM-DD format'),
        timezone: z.string().optional().describe('IANA timezone for slot times (e.g. America/New_York, Europe/London)'),
        booking_link: z.boolean().optional().describe('If true, include shareable booking links in the response'),
      },
      annotations: MeetbotMCPStreamable.TOOL_ANNOTATIONS,
    }, async ({ page, ...args }, extra) => {
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      const client = this.clients.get(extra.sessionId);
      if (!client) {
        throw new Error('Meet.bot client not configured. Provide an Authorization: Bearer <token> header when connecting to the MCP server.');
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
        page: z.string().describe('The URL of the scheduling page (e.g. https://meet.bot/your-page)'),
        guest_email: z.string().describe('Email address of the guest (used for calendar invite and confirmation)'),
        guest_name: z.string().describe('Full name of the guest'),
        notes: z.string().optional().describe('Optional notes to include with the meeting (e.g. agenda, call details)'),
        start: z.string().describe('Start time in ISO 8601 format (e.g. 2025-03-10T14:00:00Z); must be an available slot'),
      },
      annotations: MeetbotMCPStreamable.TOOL_ANNOTATIONS,
    }, async ({ page, guest_email, guest_name, notes, start }, extra) => {
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      const client = this.clients.get(extra.sessionId);
      if (!client) {
        throw new Error('Meet.bot client not configured. Provide an Authorization: Bearer <token> header when connecting to the MCP server.');
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
      description: 'Check if the Meet.bot API client is healthy and the Bearer token is valid',
      inputSchema: {},
      annotations: MeetbotMCPStreamable.TOOL_ANNOTATIONS,
    }, async (_, extra) => {
      if (!extra.sessionId) {
        throw new Error('Session ID is required');
      }
      
      const client = this.clients.get(extra.sessionId);
      if (!client) {
        throw new Error('Meet.bot client not configured. Provide an Authorization: Bearer <token> header when connecting to the MCP server.');
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

  private setupPromptHandlers(): void {
    // 1. schedule_meeting – full flow: list pages → slots → book (confirm with user first)
    this.server.registerPrompt('schedule_meeting', {
      title: 'Schedule a meeting',
      description: 'Get step-by-step instructions to schedule a meeting using this server. Use this when the user wants to book a meeting or check availability.',
      argsSchema: {},
    }, () => ({
      description: 'Instructions for scheduling a meeting with Meet.bot',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'I need to schedule a meeting. Please use the Meet.bot MCP tools to: 1) List my scheduling pages with get_scheduling_pages, 2) Get available slots for the chosen page with get_available_slots, and 3) Book the chosen slot with book_meeting (guest_email, guest_name, and start time required). Confirm the details with me before booking.',
          },
        },
      ],
    }));

    // 2. check_availability – "When is [person] next free?" – availability only, no booking
    this.server.registerPrompt('check_availability', {
      title: 'Check availability',
      description: 'When is this person next free? Checks availability only; no booking. Use for pre-meeting research or answering "when are they free?"',
      argsSchema: {
        page: z.string().describe('The scheduling page URL (e.g. https://meet.bot/your-page)'),
        days_ahead: z.string().optional().describe('Number of days to look ahead (default: 7)'),
      },
    }, (args: { page: string; days_ahead?: string | undefined }) => {
      const days = typeof args.days_ahead === 'string' && args.days_ahead !== '' ? parseInt(args.days_ahead, 10) : 7;
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + days);
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);
      return {
        description: 'Check when this person is next available; do not book.',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Check availability only (no booking). Use get_available_slots with page "${args.page}", start "${startStr}", end "${endStr}", and a reasonable count (e.g. 10). Return when this person is next free. Do not book a meeting or collect guest details.`,
            },
          },
        ],
      };
    });

    // 3. book_for_guest – fast path when all details are already known
    this.server.registerPrompt('book_for_guest', {
      title: 'Book for guest',
      description: 'Fast path when you already have all details. Books a meeting directly using the preferred time; useful when another system provides the slot.',
      argsSchema: {
        page: z.string().describe('The scheduling page URL'),
        guest_name: z.string().describe('Full name of the guest'),
        guest_email: z.string().describe('Email address of the guest'),
        preferred_time: z.string().describe('Preferred start time in ISO 8601 format (e.g. 2025-03-10T14:00:00Z); should be an available slot'),
      },
    }, (args: { page: string; guest_name: string; guest_email: string; preferred_time: string }) => ({
      description: 'Book a meeting with the given guest and time.',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Book a meeting now. Use book_meeting with: page "${args.page}", guest_name "${args.guest_name}", guest_email "${args.guest_email}", start "${args.preferred_time}". No need to discover slots first – book this exact time.`,
          },
        },
      ],
    }));

    // 4. share_booking_link – "Send [person] a link to book" – returns shareable links only
    this.server.registerPrompt('share_booking_link', {
      title: 'Share booking link',
      description: 'Send the user a link to book. Returns shareable booking links; the guest picks their own slot. No booking is performed.',
      argsSchema: {
        page: z.string().describe('The scheduling page URL'),
        count: z.string().optional().describe('Number of slot links to return (default: 3)'),
      },
    }, (args: { page: string; count?: string | undefined }) => {
      const count = typeof args.count === 'string' && args.count !== '' ? parseInt(args.count, 10) : 3;
      return {
        description: 'Get shareable booking links to send to the guest.',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Get shareable booking links only (do not book). Use get_available_slots with page "${args.page}", booking_link: true, and count: ${count}. Return the first ${count} booking links formatted clearly so the user can copy or send them to their guest. The guest will choose their own slot.`,
            },
          },
        ],
      };
    });

    // 5. list_my_pages – starting point when the AI doesn't know which page to use
    this.server.registerPrompt('list_my_pages', {
      title: 'List my scheduling pages',
      description: 'Starting point when you don\'t know which page to use. Lists the user\'s scheduling pages with a brief description of each.',
      argsSchema: {},
    }, () => ({
      description: 'List the user’s scheduling pages.',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'List my scheduling pages. Use get_scheduling_pages and present the results clearly: for each page show title, duration, and URL, with a brief description so I (or the user) can choose which page to use next.',
          },
        },
      ],
    }));

    // 6. suggest_times – offer N options for the user to pick
    this.server.registerPrompt('suggest_times', {
      title: 'Suggest times',
      description: 'Offer the user some options. Returns a clean list of available slots for them to pick from; no booking until they choose.',
      argsSchema: {
        page: z.string().describe('The scheduling page URL'),
        count: z.string().optional().describe('Number of slot options to return (default: 3)'),
        timezone: z.string().optional().describe('IANA timezone for displaying times (e.g. America/New_York)'),
        start_date: z.string().optional().describe('Start of range in YYYY-MM-DD format'),
        end_date: z.string().optional().describe('End of range in YYYY-MM-DD format'),
      },
    }, (args: { page: string; count?: string | undefined; timezone?: string | undefined; start_date?: string | undefined; end_date?: string | undefined }) => {
      const count = typeof args.count === 'string' && args.count !== '' ? parseInt(args.count, 10) : 3;
      const parts = [`Use get_available_slots with page "${args.page}" and count: ${count}.`];
      if (args.timezone) parts.push(`Use timezone "${args.timezone}" for display.`);
      if (args.start_date) parts.push(`Restrict to start date ${args.start_date}.`);
      if (args.end_date) parts.push(`Restrict to end date ${args.end_date}.`);
      parts.push('Format the slots as a clean, numbered list for the user to pick one. Do not book until they choose.');
      return {
        description: 'Present available times for the user to choose from.',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: parts.join(' '),
            },
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

    // MCP server card (well-known discovery) – structured for Smithery quality (annotations, param descriptions, prompts)
    const toolAnnotations = { audience: ['user', 'assistant'], priority: 0.8 };
    const serverCard = {
      serverInfo: {
        name: 'meetbot-mcp',
        version: '1.2.9',
        description: 'Meet.bot MCP Server for scheduling and booking. Lets AI agents check availability, get scheduling page info, and book meetings on your behalf.',
      },
      authentication: {
        required: true,
        schemes: ['bearer'],
        instructions: 'Provide your Meet.bot API key as a Bearer token in the Authorization header: Authorization: Bearer <your-api-key>',
      },
      tools: [
        {
          name: 'get_scheduling_pages',
          description: 'Get all scheduling pages for the authenticated user',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          annotations: toolAnnotations,
        },
        {
          name: 'get_page_info',
          description: 'Get information about a specific scheduling page',
          inputSchema: {
            type: 'object',
            properties: {
              page: { type: 'string', description: 'The URL of the scheduling page (e.g. https://meet.bot/your-page)' },
            },
            required: ['page'],
            additionalProperties: false,
          },
          annotations: toolAnnotations,
        },
        {
          name: 'get_available_slots',
          description: 'Get available booking slots for a scheduling page',
          inputSchema: {
            type: 'object',
            properties: {
              page: { type: 'string', description: 'The URL of the scheduling page (e.g. https://meet.bot/your-page)' },
              count: { type: 'number', description: 'Maximum number of slots to return (defaults to server limit)' },
              start: { type: 'string', description: 'Start date for the range in YYYY-MM-DD format' },
              end: { type: 'string', description: 'End date for the range in YYYY-MM-DD format' },
              timezone: { type: 'string', description: 'IANA timezone for slot times (e.g. America/New_York, Europe/London)' },
              booking_link: { type: 'boolean', description: 'If true, include shareable booking links in the response' },
            },
            required: ['page'],
            additionalProperties: false,
          },
          annotations: toolAnnotations,
        },
        {
          name: 'book_meeting',
          description: 'Book a new meeting slot',
          inputSchema: {
            type: 'object',
            properties: {
              page: { type: 'string', description: 'The URL of the scheduling page (e.g. https://meet.bot/your-page)' },
              guest_email: { type: 'string', description: 'Email address of the guest (used for calendar invite and confirmation)' },
              guest_name: { type: 'string', description: 'Full name of the guest' },
              notes: { type: 'string', description: 'Optional notes to include with the meeting (e.g. agenda, call details)' },
              start: { type: 'string', description: 'Start time in ISO 8601 format (e.g. 2025-03-10T14:00:00Z); must be an available slot' },
            },
            required: ['page', 'guest_email', 'guest_name', 'start'],
            additionalProperties: false,
          },
          annotations: toolAnnotations,
        },
        {
          name: 'health_check',
          description: 'Check if the Meet.bot API client is healthy and the Bearer token is valid',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          annotations: toolAnnotations,
        },
      ],
      prompts: [
        {
          name: 'schedule_meeting',
          title: 'Schedule a meeting',
          description: 'Get step-by-step instructions to schedule a meeting using this server. Use this when the user wants to book a meeting or check availability.',
          arguments: [],
        },
        {
          name: 'check_availability',
          title: 'Check availability',
          description: 'When is this person next free? Checks availability only; no booking. Use for pre-meeting research or answering "when are they free?"',
          arguments: [
            { name: 'page', description: 'The scheduling page URL (e.g. https://meet.bot/your-page)', required: true },
            { name: 'days_ahead', description: 'Number of days to look ahead (default: 7)', required: false },
          ],
        },
        {
          name: 'book_for_guest',
          title: 'Book for guest',
          description: 'Fast path when you already have all details. Books a meeting directly using the preferred time; useful when another system provides the slot.',
          arguments: [
            { name: 'page', description: 'The scheduling page URL', required: true },
            { name: 'guest_name', description: 'Full name of the guest', required: true },
            { name: 'guest_email', description: 'Email address of the guest', required: true },
            { name: 'preferred_time', description: 'Preferred start time in ISO 8601 format (e.g. 2025-03-10T14:00:00Z); should be an available slot', required: true },
          ],
        },
        {
          name: 'share_booking_link',
          title: 'Share booking link',
          description: 'Send the user a link to book. Returns shareable booking links; the guest picks their own slot. No booking is performed.',
          arguments: [
            { name: 'page', description: 'The scheduling page URL', required: true },
            { name: 'count', description: 'Number of slot links to return (default: 3)', required: false },
          ],
        },
        {
          name: 'list_my_pages',
          title: 'List my scheduling pages',
          description: "Starting point when you don't know which page to use. Lists the user's scheduling pages with a brief description of each.",
          arguments: [],
        },
        {
          name: 'suggest_times',
          title: 'Suggest times',
          description: 'Offer the user some options. Returns a clean list of available slots for them to pick from; no booking until they choose.',
          arguments: [
            { name: 'page', description: 'The scheduling page URL', required: true },
            { name: 'count', description: 'Number of slot options to return (default: 3)', required: false },
            { name: 'timezone', description: 'IANA timezone for displaying times (e.g. America/New_York)', required: false },
            { name: 'start_date', description: 'Start of range in YYYY-MM-DD format', required: false },
            { name: 'end_date', description: 'End of range in YYYY-MM-DD format', required: false },
          ],
        },
      ],
    };
    app.get('/.well-known/mcp/server-card.json', (_req: Request, res: Response) => {
      res.type('application/json').json(serverCard);
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
