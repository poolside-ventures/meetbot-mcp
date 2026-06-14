import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { MeetbotClient } from './meetbot-client.js';

/**
 * MCP Server for Meet.bot Booking Page API
 */
export class MeetbotMCPServer {
  private server: Server;
  private client: MeetbotClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'meetbot-mcp',
        version: '1.3.0',
      },
      {
        // Declare the tools capability, otherwise the SDK rejects the
        // tools/list + tools/call handlers below and the stdio server
        // crashes on startup ("Server does not support tools").
        capabilities: { tools: {} },
      }
    );
    // Stdio mode: auth from environment (HTTP mode uses Bearer header)
    const token = process.env['MEETBOT_AUTH_TOKEN'];
    if (token) {
      this.client = new MeetbotClient({ authToken: token });
    }
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_scheduling_pages',
            description: 'Get all scheduling pages for the authenticated user',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_page_info',
            description: 'Get information about a specific scheduling page',
            inputSchema: {
              type: 'object',
              properties: {
                page: {
                  type: 'string',
                  description: 'The URL of the scheduling page',
                },
              },
              required: ['page'],
            },
          },
          {
            name: 'get_available_slots',
            description: 'Get available booking slots for a scheduling page',
            inputSchema: {
              type: 'object',
              properties: {
                page: {
                  type: 'string',
                  description: 'The URL of the scheduling page',
                },
                count: {
                  type: 'number',
                  description: 'Maximum number of slots to return',
                },
                start: {
                  type: 'string',
                  description: 'Start date in YYYY-MM-DD format',
                },
                end: {
                  type: 'string',
                  description: 'End date in YYYY-MM-DD format',
                },
                timezone: {
                  type: 'string',
                  description: 'Timezone in IANA format (e.g., America/New_York)',
                },
                booking_link: {
                  type: 'boolean',
                  description: 'Include shareable booking links',
                },
              },
              required: ['page'],
            },
          },
          {
            name: 'book_meeting',
            description: 'Book a new meeting slot',
            inputSchema: {
              type: 'object',
              properties: {
                page: {
                  type: 'string',
                  description: 'The URL of the scheduling page',
                },
                guest_email: {
                  type: 'string',
                  description: 'Email address of the guest',
                },
                guest_name: {
                  type: 'string',
                  description: 'Name of the guest',
                },
                notes: {
                  type: 'string',
                  description: 'Additional notes for the meeting',
                },
                start: {
                  type: 'string',
                  description: 'Start time in ISO 8601 format',
                },
              },
              required: ['page', 'guest_email', 'guest_name', 'start'],
            },
          },
          {
            name: 'health_check',
            description: 'Check if the Meet.bot API client is properly configured and can connect',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list_webhooks',
            description:
              "List the authenticated user's outbound booking webhooks (fired on booking_received, booking_rescheduled and booking_cancelled)",
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'set_webhook',
            description:
              'Create or update an outbound booking webhook. Omit id to create (webhook_url required); pass id to update. Meet.bot POSTs a JWT-signed (HS256) JSON payload to the URL on each booking event.',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Webhook id to update; omit to create a new one',
                },
                webhook_url: {
                  type: 'string',
                  description: 'HTTPS URL we POST booking events to (required when creating)',
                },
                description: {
                  type: 'string',
                  description: 'Optional label for the webhook',
                },
                coverage: {
                  type: 'string',
                  enum: ['all', 'selected'],
                  description:
                    "'all' (default) fires for every page including ones created later; 'selected' only for the pages in `pages`",
                },
                scope: {
                  type: 'string',
                  enum: ['self', 'team'],
                  description:
                    "'self' (default) your own pages; 'team' (team admins only) also fires for teammates' bookings",
                },
                pages: {
                  type: 'array',
                  items: { type: 'number' },
                  description: "Page ids to cover when coverage='selected'",
                },
                is_active: {
                  type: 'boolean',
                  description: 'Whether the webhook is active (default true)',
                },
              },
            },
          },
          {
            name: 'delete_webhook',
            description: "Delete one of the authenticated user's webhooks by id",
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'The webhook id to delete',
                },
              },
              required: ['id'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_scheduling_pages':
            return await this.handleGetSchedulingPages(args);

          case 'get_page_info':
            return await this.handleGetPageInfo(args);

          case 'get_available_slots':
            return await this.handleGetAvailableSlots(args);

          case 'book_meeting':
            return await this.handleBookMeeting(args);

          case 'health_check':
            return await this.handleHealthCheck(args);

          case 'list_webhooks':
            return await this.handleListWebhooks(args);

          case 'set_webhook':
            return await this.handleSetWebhook(args);

          case 'delete_webhook':
            return await this.handleDeleteWebhook(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleGetSchedulingPages(_args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Meet.bot client not configured. Set MEETBOT_AUTH_TOKEN when running the server (stdio mode), or use the HTTP server with Authorization: Bearer <token> header.');
    }

    const pages = await this.client.getPages();
    return {
      content: [
        {
          type: 'text',
          text: `Found ${pages.pages.length} scheduling pages for ${pages.email}:\n\n${pages.pages
            .map(
              (page) =>
                `• ${page.title} (${page.duration} min) - ${page.url}`
            )
            .join('\n')}`,
        },
      ],
    };
  }

  private async handleGetPageInfo(args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Meet.bot client not configured. Set MEETBOT_AUTH_TOKEN when running the server (stdio mode), or use the HTTP server with Authorization: Bearer <token> header.');
    }

    const pageInfo = await this.client.getPageInfo(args);
    return {
      content: [
        {
          type: 'text',
          text: `Page Information:\n\nTitle: ${pageInfo.title}\nDuration: ${pageInfo.duration} minutes\nOwner: ${pageInfo.owner_name}\nMax days ahead: ${pageInfo.max_days_into_the_future}\nURL: ${pageInfo.url}`,
        },
      ],
    };
  }

  private async handleGetAvailableSlots(args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Meet.bot client not configured. Set MEETBOT_AUTH_TOKEN when running the server (stdio mode), or use the HTTP server with Authorization: Bearer <token> header.');
    }

    const slots = await this.client.getSlots(args);
    return {
      content: [
        {
          type: 'text',
          text: `Found ${slots.count} available slots (${slots.duration} min each):\n\n${slots.slots
            .map((slot) => {
              const date = new Date(slot.start).toLocaleString();
              const urlInfo = slot.url ? `\n  Booking link: ${slot.url}` : '';
              return `• ${date}${urlInfo}`;
            })
            .join('\n\n')}`,
        },
      ],
    };
  }

  private async handleBookMeeting(args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Meet.bot client not configured. Set MEETBOT_AUTH_TOKEN when running the server (stdio mode), or use the HTTP server with Authorization: Bearer <token> header.');
    }

    const booking = await this.client.bookSlot(args);
    return {
      content: [
        {
          type: 'text',
          text: `Meeting booked successfully!\n\nGuest: ${booking.guest_name} (${booking.guest_email})\nStart: ${new Date(booking.start).toLocaleString()}\nCalendar ID: ${booking.ical_uid}\nPage: ${booking.page}`,
        },
      ],
    };
  }

  private async handleHealthCheck(_args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Meet.bot client not configured. Set MEETBOT_AUTH_TOKEN when running the server (stdio mode), or use the HTTP server with Authorization: Bearer <token> header.');
    }

    const isHealthy = await this.client.healthCheck();
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
  }

  private async handleListWebhooks(_args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Meet.bot client not configured. Set MEETBOT_AUTH_TOKEN when running the server (stdio mode), or use the HTTP server with Authorization: Bearer <token> header.');
    }

    const webhooks = await this.client.listWebhooks();
    if (webhooks.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No webhooks configured yet. Use set_webhook to add one.',
          },
        ],
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: `Found ${webhooks.length} webhook(s):\n\n${webhooks
            .map(
              (webhook) =>
                `• #${webhook.id} ${webhook.description || '(unnamed)'} -> ${webhook.webhook_url}\n  coverage: ${webhook.coverage}, scope: ${webhook.scope}, active: ${webhook.is_active}`
            )
            .join('\n')}`,
        },
      ],
    };
  }

  private async handleSetWebhook(args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Meet.bot client not configured. Set MEETBOT_AUTH_TOKEN when running the server (stdio mode), or use the HTTP server with Authorization: Bearer <token> header.');
    }

    const webhook = await this.client.setWebhook(args);
    const secretLine = webhook.shared_secret
      ? `\nShared secret (verify HS256 JWT signatures with this): ${webhook.shared_secret}`
      : '';
    return {
      content: [
        {
          type: 'text',
          text: `Webhook saved (#${webhook.id}).\nURL: ${webhook.webhook_url}\nCoverage: ${webhook.coverage}, Scope: ${webhook.scope}, Active: ${webhook.is_active}${secretLine}`,
        },
      ],
    };
  }

  private async handleDeleteWebhook(args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Meet.bot client not configured. Set MEETBOT_AUTH_TOKEN when running the server (stdio mode), or use the HTTP server with Authorization: Bearer <token> header.');
    }

    await this.client.deleteWebhook(args.id);
    return {
      content: [
        {
          type: 'text',
          text: `Webhook #${args.id} deleted.`,
        },
      ],
    };
  }

  /**
   * Start the MCP server
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Meet.bot MCP server started');
  }
}
