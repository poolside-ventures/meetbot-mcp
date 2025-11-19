/**
 * Meet.bot MCP Package
 * Model Context Protocol server for Meet.bot Booking Page API
 */

// Export main classes
export { MeetbotMCPServer } from './mcp-server.js';
export { MeetbotMCPStreamable as MeetbotMCPServerHTTP } from './mcp-server-streamable.js';
export { MeetbotClient } from './meetbot-client.js';

// Export types
export type {
  BookSlot,
  BookSlotRequest,
  GetSlotsParams,
  GetInfoParams,
  PageInfo,
  Pages,
  SchedulingPage,
  Slots,
  SlotDetails,
  MeetbotConfig,
  ApiError,
  ApiResponse,
} from './types.js';

// Export schemas
export {
  BookSlotSchema,
  BookSlotRequestSchema,
  GetSlotsParamsSchema,
  GetInfoParamsSchema,
  PageInfoSchema,
  PagesSchema,
  SchedulingPageSchema,
  SlotsSchema,
  SlotDetailsSchema,
  MeetbotConfigSchema,
  ApiErrorSchema,
} from './schemas.js';

// Export validated types
export type {
  ValidatedBookSlot,
  ValidatedPageInfo,
  ValidatedSchedulingPage,
  ValidatedPages,
  ValidatedSlots,
  ValidatedBookSlotRequest,
  ValidatedGetSlotsParams,
  ValidatedGetInfoParams,
  ValidatedMeetbotConfig,
} from './schemas.js';
