import axios, { AxiosInstance } from 'axios';
import {
  BookSlot,
  BookSlotRequest,
  GetSlotsParams,
  GetInfoParams,
  PageInfo,
  Pages,
  Slots,
  MeetbotConfig,
} from './types.js';
import {
  BookSlotRequestSchema,
  GetSlotsParamsSchema,
  GetInfoParamsSchema,
  MeetbotConfigSchema,
} from './schemas.js';

/**
 * Meet.bot API Client for interacting with the booking page API
 */
export class MeetbotClient {
  private readonly client: AxiosInstance;
  private readonly config: MeetbotConfig;

  constructor(config: MeetbotConfig) {
    // Validate configuration
    const validatedConfig = MeetbotConfigSchema.parse(config);
    this.config = validatedConfig;

    // Create axios instance with hardcoded base URL
    this.client = axios.create({
      baseURL: 'https://meet.bot',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      if (this.config.authToken) {
        config.headers.Authorization = `Bearer ${this.config.authToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data) {
          throw new Error(`API Error: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
      }
    );
  }

  /**
   * Get the scheduling pages for the authenticated user
   */
  async getPages(): Promise<Pages> {
    const response = await this.client.get<Pages>('/v1/pages');
    return response.data;
  }

  /**
   * Get information about a scheduling page
   */
  async getPageInfo(params: GetInfoParams): Promise<PageInfo> {
    const validatedParams = GetInfoParamsSchema.parse(params);
    const response = await this.client.get<PageInfo>('/v1/info', {
      params: validatedParams,
    });
    return response.data;
  }

  /**
   * Get available booking slots with optional filters
   */
  async getSlots(params: GetSlotsParams): Promise<Slots> {
    const validatedParams = GetSlotsParamsSchema.parse(params);
    const response = await this.client.get<Slots>('/v1/slots', {
      params: validatedParams,
    });
    return response.data;
  }

  /**
   * Book a new meeting
   */
  async bookSlot(request: BookSlotRequest): Promise<BookSlot> {
    const validatedRequest = BookSlotRequestSchema.parse(request);
    const response = await this.client.post<BookSlot>('/v1/book', validatedRequest);
    return response.data;
  }

  /**
   * Check if the client is properly configured and can connect
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use the /v1/pages endpoint for health check since it's a simple authenticated GET
      await this.client.get('/v1/pages', {
        timeout: 5000,
      });
      return true;
    } catch (error) {
      // If we get a 401/403, it means the API is reachable but auth failed
      // If we get a network error, the API is not reachable
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          return true; // API is reachable, just auth issue
        }
        if (status && status >= 400 && status < 500) {
          return true; // API is reachable, just client error
        }
      }
      return false; // Network error or server error
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): MeetbotConfig {
    return { ...this.config };
  }
}
