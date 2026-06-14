---
name: scheduling
description: Schedule and book meetings using Meet.bot. Handles availability checks, booking flows, and shareable booking links via the Meet.bot MCP server at mcp.meet.bot
license: MIT
metadata:
  author: meetbot
---

You have access to the Meet.bot MCP server (mcp.meet.bot). Use it to help users schedule meetings, check availability, book time slots, and generate booking links.

## When to activate
- User wants to schedule, book, or arrange a meeting
- User asks when someone is available or free
- User wants a booking link to send to someone
- User asks to see their scheduling pages
- User mentions "meet.bot" or asks about their calendar availability
- User wants to be notified when meetings are booked, rescheduled, or cancelled, or to wire bookings into another system (webhooks)

## Authentication
The Meet.bot MCP server requires a Bearer token. If the user has not configured one, ask them for their Meet.bot API key before proceeding.

## Instructions

### Checking availability
1. Call get_scheduling_pages to list the user's pages (or use get_page_info if they already know the URL)
2. Call get_available_slots with the page URL, a date range, and the user's timezone
3. Present the slots in a readable format - times, not raw ISO strings

### Booking a meeting
1. Confirm the page URL, guest name, guest email, and start time before booking
2. Start time must be ISO 8601 format (e.g. 2026-03-10T14:00:00Z)
3. Call book_meeting - confirm the booking details with the user before calling
4. After booking, confirm the details back to the user

### Sharing a booking link
1. Call get_available_slots with booking_link: true
2. Pull the first 3-5 slots and share the booking_link URLs
3. The recipient clicks their preferred link - no further action needed from the host

### Handling archived pages
Scheduling pages with "archived" in the URL or name are inactive. Skip them and only present active pages to the user.

### Managing webhooks
Webhooks notify an external URL the instant a meeting is booked, rescheduled, or cancelled (events: `booking_received`, `booking_rescheduled`, `booking_cancelled`). Meet.bot POSTs a JWT-signed (HS256) JSON payload to the URL.
1. Call list_webhooks to show the user's existing webhooks
2. Call set_webhook with a webhook_url to create one (omit id) or with an id to update one. Coverage defaults to "all" (every page, including ones created later); use "selected" with page ids for specific pages. Only team admins can use scope "team" (fires for teammates' bookings too)
3. set_webhook returns a shared secret on create — show it to the user once and tell them to store it; it's used to verify the JWT signature on each event
4. Call delete_webhook with an id to remove one

## Tips
- Always confirm with the user before calling book_meeting - bookings cannot be cancelled via this server
- Use the timezone parameter in get_available_slots to match the user's local time
- If the user doesn't know which page to use, call get_scheduling_pages first and help them pick
