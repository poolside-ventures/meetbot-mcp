import { MeetbotClient } from '../src/meetbot-client.js';

/**
 * Example usage of the MeetbotClient
 * This demonstrates how to use the client directly in your application
 */

async function exampleUsage(): Promise<void> {
  try {
    // Initialize the client
    const client = new MeetbotClient({
      authToken: 'your_bearer_token_here',
    });

    console.log('Meet.bot client initialized');

    // Get all scheduling pages
    console.log('\n--- Getting scheduling pages ---');
    const pages = await client.getPages();
    console.log(`Found ${pages.pages.length} pages for ${pages.email}`);

    if (pages.pages.length > 0) {
      const firstPage = pages.pages[0];
      console.log(`First page: ${firstPage.title} (${firstPage.duration} min)`);

      // Get detailed information about the first page
      console.log('\n--- Getting page info ---');
      const pageInfo = await client.getPageInfo({ page: firstPage.url });
      console.log(`Page title: ${pageInfo.title}`);
      console.log(`Owner: ${pageInfo.owner_name}`);
      console.log(`Max days ahead: ${pageInfo.max_days_into_the_future}`);

      // Get available slots for the next week
      console.log('\n--- Getting available slots ---');
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const slots = await client.getSlots({
        page: firstPage.url,
        count: 10,
        start: today.toISOString().split('T')[0], // YYYY-MM-DD format
        end: nextWeek.toISOString().split('T')[0],
        timezone: 'America/New_York',
        booking_link: true,
      });

      console.log(`Found ${slots.count} available slots`);
      if (slots.slots.length > 0) {
        console.log('First available slot:', new Date(slots.slots[0].start).toLocaleString());
      }

      // Example of booking a meeting (commented out to avoid actual bookings)
      /*
      console.log('\n--- Booking a meeting ---');
      const booking = await client.bookSlot({
        page: firstPage.url,
        guest_email: 'guest@example.com',
        guest_name: 'Example Guest',
        notes: 'Example meeting booking',
        start: slots.slots[0].start,
      });

      console.log(`Meeting booked successfully! Calendar ID: ${booking.ical_uid}`);
      */
    }

    // Health check
    console.log('\n--- Health check ---');
    const isHealthy = await client.healthCheck();
    console.log(`API health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);

  } catch (error) {
    console.error('Error in example usage:', error);
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleUsage().catch(console.error);
}

export { exampleUsage };
