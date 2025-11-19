import {
  BookSlotSchema,
  PageInfoSchema,
  GetSlotsParamsSchema,
  MeetbotConfigSchema,
} from '../schemas';

describe('Meet.bot API Schemas', () => {
  describe('BookSlotSchema', () => {
    it('should validate a valid BookSlot', () => {
      const validBookSlot = {
        success: true,
        page: 'https://meet.bot/user/30min',
        guest_email: 'guest@example.com',
        guest_name: 'Jane Doe',
        notes: 'Meeting notes',
        start: '2025-01-15T14:00:00Z',
        ical_uid: 'abc123',
      };

      const result = BookSlotSchema.safeParse(validBookSlot);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidBookSlot = {
        success: true,
        page: 'https://meet.bot/user/30min',
        guest_email: 'invalid-email',
        guest_name: 'Jane Doe',
        start: '2025-01-15T14:00:00Z',
        ical_uid: 'abc123',
      };

      const result = BookSlotSchema.safeParse(invalidBookSlot);
      expect(result.success).toBe(false);
    });
  });

  describe('PageInfoSchema', () => {
    it('should validate a valid PageInfo', () => {
      const validPageInfo = {
        title: '30 Minute Meeting',
        duration: 30,
        url: 'https://meet.bot/user/30min',
        owner_name: 'John Doe',
        max_days_into_the_future: 30,
      };

      const result = PageInfoSchema.safeParse(validPageInfo);
      expect(result.success).toBe(true);
    });

    it('should reject negative duration', () => {
      const invalidPageInfo = {
        title: '30 Minute Meeting',
        duration: -30,
        url: 'https://meet.bot/user/30min',
        owner_name: 'John Doe',
        max_days_into_the_future: 30,
      };

      const result = PageInfoSchema.safeParse(invalidPageInfo);
      expect(result.success).toBe(false);
    });
  });

  describe('MeetbotConfigSchema', () => {
    it('should validate valid config with baseUrl only', () => {
      const validConfig = {
        baseUrl: 'https://api.meet.bot',
      };

      const result = MeetbotConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should validate valid config with all fields', () => {
      const validConfig = {
        baseUrl: 'https://api.meet.bot',
        authToken: 'token123',
        sessionId: 'session123',
      };

      const result = MeetbotConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should accept valid authToken', () => {
      const validConfig = {
        authToken: 'valid-token-123',
      };

      const result = MeetbotConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('GetSlotsParamsSchema', () => {
    it('should validate valid params', () => {
      const validParams = {
        page: 'https://meet.bot/user/30min',
        count: 10,
        start: '2025-01-01',
        end: '2025-01-31',
        timezone: 'America/New_York',
        booking_link: true,
      };

      const result = GetSlotsParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should validate minimal params', () => {
      const minimalParams = {
        page: 'https://meet.bot/user/30min',
      };

      const result = GetSlotsParamsSchema.safeParse(minimalParams);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const invalidParams = {
        page: 'https://meet.bot/user/30min',
        start: '2025/01/01',
      };

      const result = GetSlotsParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });
  });
});
