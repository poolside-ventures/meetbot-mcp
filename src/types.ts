/**
 * Type definitions for the Meet.bot Booking Page API
 * Based on OpenAPI 3.0.3 specification
 */

export interface BookSlot {
  success: boolean;
  page: string;
  guest_email: string;
  guest_name: string;
  notes?: string;
  start: string;
  ical_uid: string;
}

export interface PageInfo {
  title: string;
  duration: number;
  url: string;
  owner_name: string;
  max_days_into_the_future: number;
}

export interface SchedulingPage {
  title: string;
  duration: number;
  url: string;
}

export interface Pages {
  email: string;
  pages: SchedulingPage[];
}

export interface SlotDetails {
  start: string;
  url?: string;
}

export interface Slots {
  count: number;
  duration: number;
  slots: SlotDetails[];
}

export interface BookSlotRequest {
  page: string;
  guest_email: string;
  guest_name: string;
  notes?: string;
  start: string;
}

export interface GetSlotsParams {
  page: string;
  count?: number;
  start?: string;
  end?: string;
  timezone?: string;
  booking_link?: boolean;
}

export interface GetInfoParams {
  page: string;
}

export interface ApiError {
  success: boolean;
  error: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = T | ApiError;

export interface MeetbotConfig {
  authToken?: string | undefined;
}
