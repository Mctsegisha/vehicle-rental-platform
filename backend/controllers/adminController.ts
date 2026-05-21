import { query } from '../config/db';

const mapUser = (dbUser: any) => ({
  userId: dbUser.user_id,
  name: dbUser.name,
  email: dbUser.email,
  role: dbUser.role,
  phone: dbUser.phone,
  status: dbUser.status,
  createdAt: dbUser.created_at,
  age: dbUser.age,
  driverLicenseNumber: dbUser.driver_license_number,
  idPhotoUrl: dbUser.id_photo_url,
  licensePhotoUrl: dbUser.license_photo_url,
  isVerified: dbUser.is_verified
});

const mapAdminVehicle = (dbV: any) => ({
  id: dbV.vehicle_id,
  ownerId: dbV.owner_id,
  ownerName: dbV.owner_name,
  name: dbV.name,
  category: dbV.category,
  plateNumber: dbV.plate_number,
  ownershipBookUrl: dbV.ownership_book_url,
  insuranceCertUrl: dbV.insurance_cert_url,
  nationalIdUrl: dbV.national_id_url,
  approvalStatus: dbV.approval_status,
  createdAt: dbV.created_at
});

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

export const getStats = async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const userStats = await query('SELECT COUNT(*) as total FROM Users');
    const vehicleStats = await query('SELECT COUNT(*) as total FROM Vehicles');
    const bookingStats = await query('SELECT COUNT(*) as total, SUM(total_amount) as total_revenue FROM Bookings');
    const paymentStats = await query('SELECT COUNT(*) as pending FROM Payments WHERE verified_by_admin = FALSE');
    const activeRentals = await query("SELECT COUNT(*) as total FROM Bookings WHERE status IN ('approved', 'paid')");
    const commissionStats = await query('SELECT SUM(amount) as total FROM Commissions');

    res.json({
      totalUsers: parseInt(userStats.rows[0].total),
      totalVehicles: parseInt(vehicleStats.rows[0].total),
      totalBookings: parseInt(bookingStats.rows[0].total),
      totalRevenue: parseFloat(bookingStats.rows[0].total_revenue || 0),
      totalCommissions: parseFloat(commissionStats.rows[0].total || 0),
      pendingPayments: parseInt(paymentStats.rows[0].pending),
      activeRentals: parseInt(activeRentals.rows[0].total)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPayments = async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(`
      SELECT p.*, b.customer_id, u.name as customer_name, v.name as vehicle_name, b.payment_reference
      FROM Payments p 
      JOIN Bookings b ON p.booking_id = b.booking_id 
      JOIN Users u ON b.customer_id = u.user_id
      JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows.map(p => ({
      id: p.payment_id,
      bookingId: p.booking_id,
      userId: p.customer_id,
      customerName: p.customer_name,
      vehicleName: p.vehicle_name,
      amount: parseFloat(p.amount),
      paymentStatus: p.payment_status,
      verifiedByAdmin: p.verified_by_admin,
      paymentReference: p.payment_reference,
      paymentMethod: 'Manual Transfer', // Default since only manual transfer is implemented via ref submission
      createdAt: p.created_at
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getOwnerPayments = async (req: any, res: any) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(`
      SELECT p.*, b.customer_id, b.total_amount, v.name as vehicle_name
      FROM Payments p 
      JOIN Bookings b ON p.booking_id = b.booking_id 
      JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
      WHERE v.owner_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.userId]);
    res.json(result.rows.map(p => ({
      id: p.payment_id,
      bookingId: p.booking_id,
      userId: p.customer_id,
      amount: parseFloat(p.amount),
      paymentStatus: p.payment_status,
      verifiedByAdmin: p.verified_by_admin,
      createdAt: p.created_at,
      vehicleName: p.vehicle_name
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyPayment = async (req: any, res: any) => {
  try {
    const paymentResult = await query('SELECT * FROM Payments WHERE payment_id = $1', [req.params.id]);
    if (paymentResult.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    const payment = paymentResult.rows[0];

    // Check if user is admin OR the owner of the vehicle in the booking
    const bResult = await query(`
      SELECT b.booking_id, v.owner_id 
      FROM Bookings b
      JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
      WHERE b.booking_id = $1
    `, [payment.booking_id]);
    
    if (bResult.rows.length === 0) return res.status(404).json({ error: 'Booking associated with payment not found' });
    
    const { booking_id, owner_id } = bResult.rows[0];
    
    if (req.user.role !== 'admin' && String(owner_id) !== String(req.user.userId)) {
      return res.status(403).json({ error: 'Forbidden: You can only verify payments for your own vehicles.' });
    }

    const { action } = req.body;

    if (action === 'reject') {
       await query('UPDATE Payments SET payment_status = $1 WHERE payment_id = $2', ['rejected', req.params.id]);
       // Set booking status back to approved so user can re-pay
       await query('UPDATE Bookings SET status = $1, payment_reference = NULL WHERE booking_id = $2', ['approved', booking_id]);
       return res.json({ success: true, message: 'Payment rejected' });
    }

    const result = await query(
      'UPDATE Payments SET payment_status = $1, verified_by_admin = $2 WHERE payment_id = $3 RETURNING *',
      ['verified', true, req.params.id]
    );
    
    // Calculate 5% Commission for Booking
    const commissionAmount = payment.amount * 0.05;
    
    await query(
      'INSERT INTO Commissions (type, amount, booking_id, owner_id, rate) VALUES ($1, $2, $3, $4, $5)',
      ['rental', commissionAmount, booking_id, owner_id, 5.0]
    );
    
    // Update booking status to confirmed
    await query('UPDATE Bookings SET status = $1 WHERE booking_id = $2', ['confirmed', booking_id]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getPendingVehicles = async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(`
      SELECT v.*, u.name as owner_name 
      FROM Vehicles v
      JOIN Users u ON v.owner_id = u.user_id
      WHERE v.approval_status = 'pending'
      ORDER BY v.created_at DESC
    `);
    res.json(result.rows.map(mapAdminVehicle));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateVehicleApproval = async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { status } = req.body;
  const vehicleId = req.params.id;
  try {
    const result = await query(
      'UPDATE Vehicles SET approval_status = $1 WHERE vehicle_id = $2 RETURNING *',
      [status, vehicleId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

    const vehicle = result.rows[0];
    if (status === 'approved') {
      // Calculate 10% Listing Commission (using one day's price as base if not specified, 
      // or maybe a flat activation fee based on 10% of daily rate is just a placeholder)
      // "The platform takes 10% commission from providers when a car listing is approved and activated."
      // We'll calculate it based on the daily price for now as a one-time activation reward for the platform.
      const commissionAmount = vehicle.price_per_day * 0.10;
      
      await query(
        'INSERT INTO Commissions (type, amount, vehicle_id, owner_id, rate) VALUES ($1, $2, $3, $4, $5)',
        ['listing', commissionAmount, vehicle.vehicle_id, vehicle.owner_id, 10.0]
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getCommissions = async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(`
      SELECT c.*, u.name as owner_name, v.name as vehicle_name
      FROM Commissions c
      JOIN Users u ON c.owner_id = u.user_id
      LEFT JOIN Vehicles v ON c.vehicle_id = v.vehicle_id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows.map(c => ({
      id: c.commission_id,
      type: c.type,
      amount: parseFloat(c.amount),
      rate: parseFloat(c.rate),
      ownerName: c.owner_name,
      vehicleName: c.vehicle_name,
      status: c.status,
      createdAt: c.created_at
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getUsers = async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query('SELECT * FROM Users ORDER BY created_at DESC');
    res.json(result.rows.map(mapUser));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getBookings = async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(`
      SELECT b.*, v.name as name, v.category as category, 
             u.name as customer_name, u.email as customer_email,
             p.payment_id,
             o.name as owner_name
      FROM Bookings b
      JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
      JOIN Users u ON b.customer_id = u.user_id
      JOIN Users o ON v.owner_id = o.user_id
      LEFT JOIN Payments p ON b.booking_id = p.booking_id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows.map(b => ({
      ...mapBooking(b),
      customerName: b.customer_name,
      customerEmail: b.customer_email,
      ownerName: b.owner_name,
      paymentId: b.payment_id
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getVerifications = async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(`
      SELECT vr.*, u.name as customer_name, u.email as customer_email, o.name as owner_name
      FROM VerificationRequests vr
      JOIN Users u ON vr.customer_id = u.user_id
      JOIN Users o ON vr.owner_id = o.user_id
      ORDER BY vr.created_at DESC
    `);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { role, status, isVerified } = req.body;
  const targetUserId = req.params.id;
  try {
    const result = await query(
      'UPDATE Users SET role = COALESCE($1, role), status = COALESCE($2, status), is_verified = COALESCE($3, is_verified) WHERE user_id = $4 RETURNING *',
      [role, status, isVerified, targetUserId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(mapUser(result.rows[0]));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getOwnerVerificationRequests = async (req: any, res: any) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(
      `SELECT vr.*, u.name as customer_name, u.email as customer_email
       FROM VerificationRequests vr
       JOIN Users u ON vr.customer_id = u.user_id
       WHERE vr.owner_id = $1 AND vr.status = 'pending'`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateOwnerVerificationRequestStatus = async (req: any, res: any) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { status } = req.body;
  const requestId = req.params.id;
  try {
    const vRes = await query('SELECT * FROM VerificationRequests WHERE request_id = $1', [requestId]);
    if (vRes.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    if (vRes.rows[0].owner_id !== req.user.userId && req.user.role !== 'admin') {
       return res.status(403).json({ error: 'Forbidden' });
    }

    await query('UPDATE VerificationRequests SET status = $1 WHERE request_id = $2', [status, requestId]);

    if (status === 'approved') {
      await query('UPDATE Users SET is_verified = TRUE WHERE user_id = $1', [vRes.rows[0].customer_id]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
