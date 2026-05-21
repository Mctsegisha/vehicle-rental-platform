import { query } from '../config/db';

const mapReview = (dbR: any) => ({
  id: dbR.review_id,
  vehicleId: dbR.vehicle_id,
  userId: dbR.user_id,
  userName: dbR.user_name || 'Anonymous',
  rating: dbR.rating,
  comment: dbR.comment,
  createdAt: dbR.created_at
});

export const getVehicleReviews = async (req: any, res: any) => {
  try {
    const result = await query(
      `SELECT r.*, u.name as user_name 
       FROM Reviews r 
       JOIN Users u ON r.user_id = u.user_id 
       WHERE r.vehicle_id = $1 
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows.map(mapReview));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createReview = async (req: any, res: any) => {
  const { vehicle_id, rating, comment, booking_id } = req.body;
  try {
    if (booking_id) {
      const bRes = await query(
        'SELECT status, customer_id FROM Bookings WHERE booking_id = $1',
        [booking_id]
      );
      if (bRes.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
      if (bRes.rows[0].customer_id !== req.user.userId) return res.status(403).json({ error: 'Not your booking' });
      if (bRes.rows[0].status !== 'completed') return res.status(400).json({ error: 'Booking not completed' });
    }

    const result = await query(
      'INSERT INTO Reviews (vehicle_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [vehicle_id, req.user.userId, rating, comment]
    );

    const uRes = await query('SELECT name FROM Users WHERE user_id = $1', [req.user.userId]);
    const review = mapReview({ ...result.rows[0], user_name: uRes.rows[0].name });
    
    res.json(review);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
