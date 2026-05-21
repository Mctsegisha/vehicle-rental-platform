import { query } from '../config/db';

const mapBooking = (dbB: any) => ({
  id: dbB.booking_id,
  customerId: dbB.customer_id,
  vehicleId: dbB.vehicle_id,
  startDate: dbB.start_date,
  endDate: dbB.end_date,
  totalAmount: parseFloat(dbB.total_amount),
  status: dbB.status,
  paymentReference: dbB.payment_reference,
  createdAt: dbB.created_at,
  category: dbB.category,
  vehicleName: dbB.name
});

export const createBooking = async (req: any, res: any) => {
  const { 
    vehicleId, startDate, endDate, totalAmount, 
    vehicle_id, start_date, end_date, total_amount,
    paymentRef, payment_reference 
  } = req.body;
  
  const vId = vehicleId || vehicle_id;
  const sDate = startDate || start_date;
  const eDate = endDate || end_date;
  const tAmount = totalAmount || total_amount;
  const pRef = paymentRef || payment_reference;
  
  try {
    const userResult = await query('SELECT age, driver_license_number, id_photo_url, license_photo_url, is_verified FROM Users WHERE user_id = $1', [req.user.userId]);
    const user = userResult.rows[0];

    if (!user.is_verified) {
      console.warn(`[Booking] Rejected: User ${req.user.userId} is not verified.`);
      return res.status(403).json({ error: 'Account not verified. Please complete your profile verification.' });
    }
    if (!user.age || user.age < 21) {
      console.warn(`[Booking] Rejected: User ${req.user.userId} age check failed (${user.age}).`);
      return res.status(403).json({ error: 'Rental eligibility error: Must be 21+ years old.' });
    }
    if (!user.driver_license_number || !user.id_photo_url || !user.license_photo_url) {
      console.warn(`[Booking] Rejected: User ${req.user.userId} missing docs.`);
      return res.status(403).json({ error: 'Rental eligibility error: Missing required identification documents.' });
    }

    const availabilityResult = await query(
      `SELECT * FROM Bookings 
       WHERE vehicle_id = $1 
       AND status IN ('confirmed', 'paid', 'approved')
       AND (($2 BETWEEN start_date AND end_date) OR ($3 BETWEEN start_date AND end_date) OR (start_date BETWEEN $2 AND $3))`,
      [vId, sDate, eDate]
    );

    if (availabilityResult.rows.length > 0) {
      return res.status(400).json({ error: 'The vehicle is not available for these dates.' });
    }

    const vResult = await query('SELECT owner_id, availability_status FROM Vehicles WHERE vehicle_id = $1', [vId]);
    if (vResult.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    if (vResult.rows[0].availability_status === 'unavailable') {
       return res.status(400).json({ error: 'Vehicle is currently offline.' });
    }
    
    const status = 'pending';

    const result = await query(
      'INSERT INTO Bookings (customer_id, vehicle_id, start_date, end_date, total_amount, status, payment_reference) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.userId, vId, sDate, eDate, tAmount, status, pRef]
    );
    const booking = result.rows[0];
    
    if (pRef) {
      await query(
        'INSERT INTO Payments (booking_id, amount, payment_status) VALUES ($1, $2, $3)',
        [booking.booking_id, tAmount, 'pending']
      );
    }
    
    await query('UPDATE Vehicles SET availability_status = $1 WHERE vehicle_id = $2', ['unavailable', vId]);
    
    res.json(mapBooking(booking));
  } catch (err: any) {
    console.error('[API] Create booking error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

export const getCustomerBookings = async (req: any, res: any) => {
    try {
      const result = await query('SELECT b.*, v.category, v.name FROM Bookings b JOIN Vehicles v ON b.vehicle_id = v.vehicle_id WHERE b.customer_id = $1', [req.user.userId]);
      res.json(result.rows.map(mapBooking));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
};

export const getOwnerBookings = async (req: any, res: any) => {
  try {
    const result = await query(
      'SELECT b.*, v.category, v.name FROM Bookings b JOIN Vehicles v ON b.vehicle_id = v.vehicle_id WHERE v.owner_id = $1',
      [req.user.userId]
    );
    res.json(result.rows.map(mapBooking));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateBookingStatus = async (req: any, res: any) => {
  const { status, payment_reference, bookingId: bodyBookingId } = req.body;
  const bookingId = req.params.id || bodyBookingId;
  
  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }
  
  try {
    const bResult = await query(
      'SELECT b.customer_id, v.owner_id FROM Bookings b JOIN Vehicles v ON b.vehicle_id = v.vehicle_id WHERE b.booking_id = $1',
      [bookingId]
    );
    
    if (bResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const bookingData = bResult.rows[0];
    const isOwner = String(bookingData.owner_id) === String(req.user.userId);
    const isCustomer = String(bookingData.customer_id) === String(req.user.userId);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isCustomer && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (payment_reference) {
      await query('UPDATE Bookings SET status = $1, payment_reference = $2 WHERE booking_id = $3', [status, payment_reference, bookingId]);
    } else {
      await query('UPDATE Bookings SET status = $1 WHERE booking_id = $2', [status, bookingId]);
    }

    const bookingQuery = await query('SELECT vehicle_id FROM Bookings WHERE booking_id = $1', [bookingId]);
    if (bookingQuery.rows.length > 0) {
      const vId = bookingQuery.rows[0].vehicle_id;
      if (['completed', 'rejected', 'cancelled'].includes(status)) {
        await query('UPDATE Vehicles SET availability_status = $1 WHERE vehicle_id = $2', ['available', vId]);
      } else if (['confirmed', 'paid', 'approved'].includes(status)) {
        await query('UPDATE Vehicles SET availability_status = $1 WHERE vehicle_id = $2', ['unavailable', vId]);
      }
    }

    res.json({ success: true, status });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
