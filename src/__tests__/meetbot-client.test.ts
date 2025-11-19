import { MeetbotClient } from '../meetbot-client';
import { MeetbotConfig } from '../types';

// Mock axios
jest.mock('axios');
const mockAxios = require('axios');

describe('MeetbotClient', () => {
  let client: MeetbotClient;
  const mockConfig: MeetbotConfig = {
    authToken: 'test-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    });
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      expect(() => new MeetbotClient(mockConfig)).not.toThrow();
    });


    it('should create axios instance with correct baseURL', () => {
      new MeetbotClient(mockConfig);
      expect(mockAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://meet.bot',
          timeout: 30000,
        })
      );
    });
  });

  describe('getPages', () => {
    beforeEach(() => {
      client = new MeetbotClient(mockConfig);
    });

    it('should call correct endpoint', async () => {
      const mockResponse = { data: { email: 'test@example.com', pages: [] } };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      mockAxios.create.mockReturnValue({
        get: mockGet,
        post: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      client = new MeetbotClient(mockConfig);
      await client.getPages();

      expect(mockGet).toHaveBeenCalledWith('/v1/pages');
    });
  });

  describe('getPageInfo', () => {
    beforeEach(() => {
      client = new MeetbotClient(mockConfig);
    });

    it('should validate params before making request', () => {
      const invalidParams = { page: 'not-a-url' };
      expect(() => client.getPageInfo(invalidParams)).rejects.toThrow();
    });

    it('should call correct endpoint with params', async () => {
      const mockResponse = {
        data: {
          title: 'Test Page',
          duration: 30,
          url: 'https://meet.bot/user/30min',
          owner_name: 'John Doe',
          max_days_into_the_future: 30,
        },
      };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      mockAxios.create.mockReturnValue({
        get: mockGet,
        post: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      client = new MeetbotClient(mockConfig);
      const params = { page: 'https://meet.bot/user/30min' };
      await client.getPageInfo(params);

      expect(mockGet).toHaveBeenCalledWith('/v1/info', { params });
    });
  });

  describe('getSlots', () => {
    beforeEach(() => {
      client = new MeetbotClient(mockConfig);
    });

    it('should validate params before making request', () => {
      const invalidParams = { page: 'not-a-url' };
      expect(() => client.getSlots(invalidParams)).rejects.toThrow();
    });

    it('should call correct endpoint with params', async () => {
      const mockResponse = {
        data: {
          count: 1,
          duration: 30,
          slots: [{ start: '2025-01-15T14:00:00Z' }],
        },
      };
      const mockGet = jest.fn().mockResolvedValue(mockResponse);
      mockAxios.create.mockReturnValue({
        get: mockGet,
        post: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      client = new MeetbotClient(mockConfig);
      const params = { page: 'https://meet.bot/user/30min' };
      await client.getSlots(params);

      expect(mockGet).toHaveBeenCalledWith('/v1/slots', { params });
    });
  });

  describe('bookSlot', () => {
    beforeEach(() => {
      client = new MeetbotClient(mockConfig);
    });

    it('should validate request before making API call', () => {
      const invalidRequest = {
        page: 'not-a-url',
        guest_email: 'test@example.com',
        guest_name: 'Test User',
        start: '2025-01-15T14:00:00Z'
      };
      expect(() => client.bookSlot(invalidRequest)).rejects.toThrow();
    });

    it('should call correct endpoint with request body', async () => {
      const mockResponse = {
        data: {
          success: true,
          page: 'https://meet.bot/user/30min',
          guest_email: 'guest@example.com',
          guest_name: 'Jane Doe',
          start: '2025-01-15T14:00:00Z',
          ical_uid: 'abc123',
        },
      };
      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      mockAxios.create.mockReturnValue({
        get: jest.fn(),
        post: mockPost,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      client = new MeetbotClient(mockConfig);
      const request = {
        page: 'https://meet.bot/user/30min',
        guest_email: 'guest@example.com',
        guest_name: 'Jane Doe',
        start: '2025-01-15T14:00:00Z',
      };
      await client.bookSlot(request);

      expect(mockPost).toHaveBeenCalledWith('/v1/book', request);
    });
  });

  describe('getConfig', () => {
    beforeEach(() => {
      client = new MeetbotClient(mockConfig);
    });

    it('should return a copy of the configuration', () => {
      const config = client.getConfig();
      expect(config).toEqual(mockConfig);
      expect(config).not.toBe(mockConfig); // Should be a copy, not reference
    });
  });
});
