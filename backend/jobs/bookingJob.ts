import { query } from '../config/db';

/**
 * Automatically updates 'pending' bookings to 'cancelled' if they are older than 24 hours.
 * Also marks the corresponding vehicles as 'available' and notifies both the customer and owner.
 */
export async function processStaleBookings() {
  console.log('[Background Job] Running check for pending bookings older than 24 hours...');
  try {
    // 1. Find all pending bookings older than 24 hours
    const staleBookingsResult = await query(`
      SELECT 
        b.booking_id, 
        b.customer_id, 
        b.vehicle_id, 
        b.created_at,
        v.owner_id, 
        v.name AS vehicle_name, 
        v.category AS vehicle_category 
      FROM Bookings b 
      JOIN Vehicles v ON b.vehicle_id = v.vehicle_id 
      WHERE b.status = 'pending' 
        AND b.created_at < NOW() - INTERVAL '24 hours'
    `);

    const staleBookings = staleBookingsResult.rows;
    if (staleBookings.length === 0) {
      console.log('[Background Job] No stale pending bookings found.');
      return;
    }

    console.log(`[Background Job] Found ${staleBookings.length} stale pending bookings to cancel.`);

    for (const booking of staleBookings) {
      const { 
        booking_id, 
        customer_id, 
        vehicle_id, 
        owner_id, 
        vehicle_name, 
        vehicle_category 
      } = booking;

      const dispName = vehicle_name || vehicle_category || 'Vehicle';

      console.log(`[Background Job] Processing cancelation of booking ID #${booking_id} for ${dispName}...`);

      // 2. Update booking status to 'cancelled'
      await query(
        "UPDATE Bookings SET status = 'cancelled' WHERE booking_id = $1", 
        [booking_id]
      );

      // 3. Set the associated vehicle as 'available'
      await query(
        "UPDATE Vehicles SET availability_status = 'available' WHERE vehicle_id = $1", 
        [vehicle_id]
      );

      // 4. Send Notification to Customer (customer_id)
      const customerMsg = `Your pending reservation for the ${dispName} has been automatically cancelled because the provider did not process it within 24 hours. Any corresponding processing or payment references are released. Please feel free to browse other vehicles.`;
      await query(`
        INSERT INTO Notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
      `, [
        customer_id, 
        'Reservation Cancelled (Timeout)', 
        customerMsg, 
        'error'
      ]);

      // 5. Send Notification to Owner/Provider (owner_id)
      const ownerMsg = `A customer's pending booking request for your ${dispName} has expired and was automatically cancelled because it remained unprocessed for over 24 hours. Your vehicle is now marked as available again for new requests.`;
      await query(`
        INSERT INTO Notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
      `, [
        owner_id, 
        'Booking Request Expired', 
        ownerMsg, 
        'warning'
      ]);

      console.log(`[Background Job] Successfully cancelled booking #${booking_id} and notified both parties.`);
    }
  } catch (err: any) {
    console.error('[Background Job] Error processing auto-cancellations:', err);
  }
}

/**
 * Starts the Auto-Cancellation background cron job.
 * Runs once immediately upon boot, then on a persistent 15-minute interval.
 */
export function startBookingAutoCancellationsJob() {
  // Run once immediately on server startup
  processStaleBookings();

  // Set Interval to check every 15 minutes (900000 milliseconds)
  const INTERVAL_MS = 15 * 60 * 1000;
  setInterval(() => {
    processStaleBookings();
  }, INTERVAL_MS);

  console.log('[Background Job] Booking Auto-Cancellation daemon initialized (runs every 15 minutes).');
}
