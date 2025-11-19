import { z } from 'zod';

/**
 * Zod schemas for runtime validation of Meet.bot API data
 */

export const BookSlotSchema = z.object({
  success: z.boolean(),
  page: z.string().url(),
  guest_email: z.string().email(),
  guest_name: z.string().min(1),
  notes: z.string().optional(),
  start: z.string().datetime(),
  ical_uid: z.string(),
});

export const PageInfoSchema = z.object({
  title: z.string(),
  duration: z.number().int().positive(),
  url: z.string().url(),
  owner_name: z.string(),
  max_days_into_the_future: z.number().int().positive(),
});

export const SchedulingPageSchema = z.object({
  title: z.string(),
  duration: z.number().int().positive(),
  url: z.string().url(),
});

export const PagesSchema = z.object({
  email: z.string().email(),
  pages: z.array(SchedulingPageSchema),
});

export const SlotDetailsSchema = z.object({
  start: z.string().datetime(),
  url: z.string().url().optional(),
});

export const SlotsSchema = z.object({
  count: z.number().int().nonnegative(),
  duration: z.number().int().positive(),
  slots: z.array(SlotDetailsSchema),
});

export const BookSlotRequestSchema = z.object({
  page: z.string().url(),
  guest_email: z.string().email(),
  guest_name: z.string().min(1),
  notes: z.string().optional(),
  start: z.string().datetime(),
});

export const GetSlotsParamsSchema = z.object({
  page: z.string().url(),
  count: z.number().int().positive().optional(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timezone: z.string().min(1).optional(),
  booking_link: z.boolean().optional(),
});

export const GetInfoParamsSchema = z.object({
  page: z.string().url(),
});

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  errors: z.record(z.array(z.string())).optional(),
});

export const MeetbotConfigSchema = z.object({
  authToken: z.string().optional(),
});

// Type exports from schemas
export type ValidatedBookSlot = z.infer<typeof BookSlotSchema>;
export type ValidatedPageInfo = z.infer<typeof PageInfoSchema>;
export type ValidatedSchedulingPage = z.infer<typeof SchedulingPageSchema>;
export type ValidatedPages = z.infer<typeof PagesSchema>;
export type ValidatedSlots = z.infer<typeof SlotsSchema>;
export type ValidatedBookSlotRequest = z.infer<typeof BookSlotRequestSchema>;
export type ValidatedGetSlotsParams = z.infer<typeof GetSlotsParamsSchema>;
export type ValidatedGetInfoParams = z.infer<typeof GetInfoParamsSchema>;
export type ValidatedMeetbotConfig = z.infer<typeof MeetbotConfigSchema>;
