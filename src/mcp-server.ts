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
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'configure_meetbot',
            description: 'Configure the Meet.bot API client with authentication',
            inputSchema: {
              type: 'object',
              properties: {
                authToken: {
                  type: 'string',
                  description: 'Bearer token for authentication (optional)',
                },
              },
              required: [],
            },
          },
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
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'configure_meetbot':
            return await this.handleConfigureMeetbot(args);

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

  private async handleConfigureMeetbot(args: any): Promise<any> {
    if (!this.client) {
      this.client = new MeetbotClient(args);
      return {
        content: [
          {
            type: 'text',
            text: 'Meet.bot API client configured successfully.',
          },
        ],
      };
    } else {
      // Reconfigure existing client
      this.client = new MeetbotClient(args);
      return {
        content: [
          {
            type: 'text',
            text: 'Meet.bot API client reconfigured successfully.',
          },
        ],
      };
    }
  }

  private async handleGetSchedulingPages(_args: any): Promise<any> {
    if (!this.client) {
      throw new Error('Meet.bot client not configured. Please run configure_meetbot first.');
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
      throw new Error('Meet.bot client not configured. Please run configure_meetbot first.');
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
      throw new Error('Meet.bot client not configured. Please run configure_meetbot first.');
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
      throw new Error('Meet.bot client not configured. Please run configure_meetbot first.');
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
      throw new Error('Meet.bot client not configured. Please run configure_meetbot first.');
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

  /**
   * Start the MCP server
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Meet.bot MCP server started');
  }
}
