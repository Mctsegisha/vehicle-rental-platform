import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../lib/db';
import { upload } from '../lib/cloudinary';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Auth Middleware
export const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const secret = JWT_SECRET || 'ethiorent-dev-secret-key-2024';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- Initialize DB Tables ---
const initDB = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS Users (
        user_id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('customer', 'owner', 'admin')),
        phone TEXT,
        status TEXT DEFAULT 'active',
        age INT,
        driver_license_number TEXT,
        id_photo_url TEXT,
        license_photo_url TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure new columns exist
    try {
      await query("ALTER TABLE Users ADD COLUMN IF NOT EXISTS age INT");
      await query("ALTER TABLE Users ADD COLUMN IF NOT EXISTS driver_license_number TEXT");
      await query("ALTER TABLE Users ADD COLUMN IF NOT EXISTS id_photo_url TEXT");
      await query("ALTER TABLE Users ADD COLUMN IF NOT EXISTS license_photo_url TEXT");
      await query("ALTER TABLE Users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE");
    } catch (e: any) {
      console.warn('[DB] User column initialization warning:', e.message);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS Vehicles (
        vehicle_id SERIAL PRIMARY KEY,
        owner_id INT NOT NULL REFERENCES Users(user_id),
        name TEXT,
        category TEXT NOT NULL,
        description TEXT,
        price_per_day DECIMAL(10,2) NOT NULL,
        location TEXT NOT NULL,
        image_url TEXT,
        image_urls JSONB,
        availability_status TEXT DEFAULT 'available',
        fuel_type TEXT,
        transmission TEXT,
        seats INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ensure columns exist
    try {
      await query("ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS name TEXT");
      await query("ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS image_urls JSONB");
      await query("ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS image_url TEXT");
      await query("ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS fuel_type TEXT");
      await query("ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS transmission TEXT");
      await query("ALTER TABLE Vehicles ADD COLUMN IF NOT EXISTS seats INT");
      // Ensure image_url is TEXT even if it already existed as VARCHAR
      await query("ALTER TABLE Vehicles ALTER COLUMN image_url TYPE TEXT");
      console.log('[DB] Columns initialized');
    } catch (e: any) {
      console.warn('[DB] Column initialization warning:', e.message);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS Reviews (
        review_id SERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL REFERENCES Vehicles(vehicle_id),
        user_id INT NOT NULL REFERENCES Users(user_id),
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS Bookings (
        booking_id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL REFERENCES Users(user_id),
        vehicle_id INT NOT NULL REFERENCES Vehicles(vehicle_id),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_reference TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist
    try {
      await query("ALTER TABLE Bookings ADD COLUMN IF NOT EXISTS payment_reference TEXT");
    } catch (e: any) {
      console.warn('[DB] Booking column initialization warning:', e.message);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS Payments (
        payment_id SERIAL PRIMARY KEY,
        booking_id INT NOT NULL REFERENCES Bookings(booking_id),
        user_id INT NOT NULL REFERENCES Users(user_id),
        amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        verified_by_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await query("ALTER TABLE Payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
      await query("ALTER TABLE Payments ADD COLUMN IF NOT EXISTS verified_by_admin BOOLEAN DEFAULT FALSE");
    } catch (e: any) {
      console.warn('[DB] Payment column initialization warning:', e.message);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS VerificationRequests (
        request_id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL REFERENCES Users(user_id),
        owner_id INT NOT NULL REFERENCES Users(user_id),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        age INT,
        driver_license_number TEXT,
        id_photo_url TEXT,
        license_photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[DB] Database tables initialized');
  } catch (err: any) {
    console.error('[DB] Failed to init tables:', err.message);
  }
};
initDB();

// Helper to map DB user to Frontend UserProfile
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

// Helper to map DB review to Frontend Review
const mapReview = (dbR: any) => ({
  id: dbR.review_id,
  vehicleId: dbR.vehicle_id,
  userId: dbR.user_id,
  userName: dbR.user_name || 'Anonymous',
  rating: dbR.rating,
  comment: dbR.comment,
  createdAt: dbR.created_at
});

// --- Health Check ---
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Auth Routes ---
router.post('/auth/register', async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  console.log(`[Auth] Registering ${role}: ${email}`);
  try {
    if (!email || !password || !name) {
      console.log('[Auth] Missing fields for registration');
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    console.log('[Auth] Starting password hash (sync)...');
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    console.log('[Auth] Password hashed successfully');
    
    console.log('[Auth] Querying DB to insert user...');
    const result = await query(
      'INSERT INTO Users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, role, phone]
    );
    console.log('[Auth] DB Insert successful for user:', email);
    
    if (!result.rows[0]) {
      throw new Error('Database failed to return the new user');
    }

    const user = mapUser(result.rows[0]);
    const secret = JWT_SECRET || 'ethiorent-dev-secret-key-2024';
    const token = jwt.sign({ userId: user.userId, role: user.role }, secret);
    console.log('[Auth] Token generated and registration complete');
    res.json({ user, token });
  } catch (err: any) {
    console.error('[Auth] Register error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[Auth] Login attempt started for: ${email}`);
  const startTime = Date.now();
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query('SELECT * FROM Users WHERE email = $1', [email]);
    const dbUser = result.rows[0];
    console.log(`[Auth] DB lookup took ${Date.now() - startTime}ms. Found: ${!!dbUser}`);
    
    if (!dbUser) {
      console.log('[Auth] User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[Auth] User found, comparing password (sync)...');
    const matchStart = Date.now();
    const isMatch = bcrypt.compareSync(password, dbUser.password);
    console.log(`[Auth] Password comparison took ${Date.now() - matchStart}ms`);
    
    if (isMatch) {
      const user = mapUser(dbUser);
      const secret = JWT_SECRET || 'ethiorent-dev-secret-key-2024';
      const token = jwt.sign({ userId: user.userId, role: user.role }, secret);
      console.log(`[Auth] Login successful for ${email}. Total time: ${Date.now() - startTime}ms`);
      res.json({ user, token });
    } else {
      console.log('[Auth] Password mismatch for:', email);
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err: any) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.get('/auth/profile', authenticate, async (req: any, res) => {
  try {
    const result = await query('SELECT * FROM Users WHERE user_id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(mapUser(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/auth/profile/verification', authenticate, async (req: any, res) => {
  const { age, driverLicenseNumber, idPhotoUrl, licensePhotoUrl, targetOwnerId } = req.body;
  try {
    // If targetOwnerId is provided, create a VerificationRequest
    if (targetOwnerId) {
      const existingRequest = await query(
        'SELECT * FROM VerificationRequests WHERE customer_id = $1 AND owner_id = $2 AND status = $3',
        [req.user.userId, targetOwnerId, 'pending']
      );

      if (existingRequest.rows.length === 0) {
        await query(
          `INSERT INTO VerificationRequests (customer_id, owner_id, age, driver_license_number, id_photo_url, license_photo_url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [req.user.userId, targetOwnerId, age, driverLicenseNumber, idPhotoUrl, licensePhotoUrl]
        );
      } else {
        await query(
          `UPDATE VerificationRequests SET age = $1, driver_license_number = $2, id_photo_url = $3, license_photo_url = $4
           WHERE request_id = $5`,
          [age, driverLicenseNumber, idPhotoUrl, licensePhotoUrl, existingRequest.rows[0].request_id]
        );
      }
    }

    // Still update the user's base info (pending verification)
    const result = await query(
      `UPDATE Users SET 
        age = COALESCE($1, age), 
        driver_license_number = COALESCE($2, driver_license_number), 
        id_photo_url = COALESCE($3, id_photo_url), 
        license_photo_url = COALESCE($4, license_photo_url)
       WHERE user_id = $5 RETURNING *`,
      [age, driverLicenseNumber, idPhotoUrl, licensePhotoUrl, req.user.userId]
    );
    res.json(mapUser(result.rows[0]));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Verification Requests for owners
router.get('/owner/verification-requests', authenticate, async (req: any, res) => {
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
});

router.put('/owner/verification-requests/:id/status', authenticate, async (req: any, res) => {
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
      // Update global user status
      await query('UPDATE Users SET is_verified = TRUE WHERE user_id = $1', [vRes.rows[0].customer_id]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

const mapVehicle = (dbV: any) => {
  let imagesArr: string[] = [];
  try {
    if (dbV.image_urls) {
      const parsed = typeof dbV.image_urls === 'string' ? JSON.parse(dbV.image_urls) : dbV.image_urls;
      if (Array.isArray(parsed)) {
        imagesArr = parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse image_urls', e);
  }
  
  if (imagesArr.length === 0 && dbV.image_url) {
    imagesArr = [dbV.image_url];
  }

  return {
    id: dbV.vehicle_id,
    ownerId: dbV.owner_id,
    ownerName: dbV.owner_name,
    ownerPhone: dbV.owner_phone,
    name: dbV.name || dbV.category, 
    category: dbV.category,
    description: dbV.description,
    pricePerDay: parseFloat(dbV.price_per_day),
    availabilityStatus: dbV.availability_status,
    location: dbV.location,
    images: imagesArr,
    fuelType: dbV.fuel_type,
    transmission: dbV.transmission,
    seats: dbV.seats,
    createdAt: dbV.created_at,
    averageRating: dbV.avg_rating ? parseFloat(dbV.avg_rating) : 0,
    reviewCount: dbV.review_count ? parseInt(dbV.review_count) : 0
  };
};

// --- Vehicle Routes ---
router.get('/vehicles', async (req, res) => {
  const { status, category, minPrice, maxPrice, limit } = req.query;
  const activeStatus = status || 'available';
  console.log(`[API] Fetching vehicles with status: ${activeStatus}, category: ${category || 'all'}, price: ${minPrice}-${maxPrice}, limit: ${limit}...`);
  const start = Date.now();
  try {
    const baseQuery = `
      SELECT v.*, 
             u.name as owner_name, u.phone as owner_phone,
             (SELECT AVG(rating) FROM Reviews WHERE vehicle_id = v.vehicle_id) as avg_rating,
             (SELECT COUNT(*) FROM Reviews WHERE vehicle_id = v.vehicle_id) as review_count
      FROM Vehicles v
      JOIN Users u ON v.owner_id = u.user_id
    `;
    
    let whereClauses = [];
    let params = [];

    if (activeStatus !== 'all') {
      whereClauses.push(`v.availability_status = $${params.length + 1}`);
      params.push(activeStatus);
    }

    if (category && category !== 'all') {
      whereClauses.push(`v.category = $${params.length + 1}`);
      params.push(category);
    }

    if (minPrice) {
      whereClauses.push(`v.price_per_day >= $${params.length + 1}`);
      params.push(parseFloat(minPrice as string));
    }

    if (maxPrice) {
      whereClauses.push(`v.price_per_day <= $${params.length + 1}`);
      params.push(parseFloat(maxPrice as string));
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    let finalQuery = `${baseQuery} ${whereString}`;
    
    if (limit) {
      finalQuery += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit as string));
    }

    const result = await query(finalQuery, params);

    console.log(`[API] Found ${result.rows.length} vehicles in ${Date.now() - start}ms`);
    res.json(result.rows.map(mapVehicle));
  } catch (err: any) {
    console.error('[API] Vehicle fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/vehicles/categories', async (req, res) => {
  try {
    const result = await query('SELECT DISTINCT category FROM Vehicles');
    res.json(result.rows.map(row => row.category));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vehicles', authenticate, async (req: any, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { name, category, description, price_per_day, location, images, fuel_type, transmission, seats, availability_status } = req.body;
  try {
    const result = await query(
      'INSERT INTO Vehicles (owner_id, name, category, description, price_per_day, location, image_url, image_urls, fuel_type, transmission, seats, availability_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [
        req.user.userId, 
        name, 
        category, 
        description, 
        price_per_day, 
        location, 
        images && images.length > 0 ? images[0] : null,
        JSON.stringify(images || []),
        fuel_type || 'Petrol',
        transmission || 'Automatic',
        seats || 5,
        availability_status || 'available'
      ]
    );
    res.json(mapVehicle(result.rows[0]));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/vehicles/:id', authenticate, async (req: any, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { name, category, description, price_per_day, location, images, fuel_type, transmission, seats, availability_status } = req.body;
  const vehicleId = req.params.id;
  try {
    // Verify ownership
    const vResult = await query('SELECT owner_id FROM Vehicles WHERE vehicle_id = $1', [vehicleId]);
    if (vResult.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    if (vResult.rows[0].owner_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await query(
      'UPDATE Vehicles SET name = $1, category = $2, description = $3, price_per_day = $4, location = $5, image_url = $6, image_urls = $7, fuel_type = $8, transmission = $9, seats = $10, availability_status = $11 WHERE vehicle_id = $12 RETURNING *',
      [
        name, 
        category, 
        description, 
        price_per_day, 
        location, 
        images && images.length > 0 ? images[0] : null,
        JSON.stringify(images || []),
        fuel_type,
        transmission,
        seats,
        availability_status,
        vehicleId
      ]
    );
    res.json(mapVehicle(result.rows[0]));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/vehicles/:id', authenticate, async (req: any, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const vehicleId = req.params.id;
  try {
    // Check if vehicle has active bookings
    const activeBookings = await query(
      "SELECT * FROM Bookings WHERE vehicle_id = $1 AND status IN ('pending', 'approved', 'paid', 'confirmed')",
      [vehicleId]
    );

    if (activeBookings.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete vehicle with active or upcoming bookings.' });
    }

    // Verify ownership
    const vResult = await query('SELECT owner_id FROM Vehicles WHERE vehicle_id = $1', [vehicleId]);
    if (vResult.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    if (vResult.rows[0].owner_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete reviews first (or you could use CASCADE in DB if set up)
    await query('DELETE FROM Reviews WHERE vehicle_id = $1', [vehicleId]);
    // Delete bookings (completed/rejected ones)
    await query('DELETE FROM Bookings WHERE vehicle_id = $1', [vehicleId]);
    // Delete vehicle
    await query('DELETE FROM Vehicles WHERE vehicle_id = $1', [vehicleId]);
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Helper to map DB booking to Frontend Booking
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

// --- Booking Routes ---
router.post('/bookings', authenticate, async (req: any, res: any) => {
  const { vehicleId, startDate, endDate, totalAmount, vehicle_id, start_date, end_date, total_amount } = req.body;
  const vId = vehicleId || vehicle_id;
  const sDate = startDate || start_date;
  const eDate = endDate || end_date;
  const tAmount = totalAmount || total_amount;
  try {
    // 1. Check user eligibility
    const userResult = await query('SELECT age, driver_license_number, id_photo_url, license_photo_url, is_verified FROM Users WHERE user_id = $1', [req.user.userId]);
    const user = userResult.rows[0];

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Account not verified. Please complete your profile verification.' });
    }
    if (!user.age || user.age < 21) {
      return res.status(403).json({ error: 'Rental eligibility error: Must be 21+ years old.' });
    }
    if (!user.driver_license_number || !user.id_photo_url || !user.license_photo_url) {
      return res.status(403).json({ error: 'Rental eligibility error: Missing required identification documents.' });
    }

    // 2. Check car availability for selected dates
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

    // 3. Get owner_id and vehicle info
    const vResult = await query('SELECT owner_id, availability_status FROM Vehicles WHERE vehicle_id = $1', [vId]);
    if (vResult.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    if (vResult.rows[0].availability_status === 'unavailable') {
       return res.status(400).json({ error: 'Vehicle is currently offline.' });
    }
    
    // 4. Create booking
    const result = await query(
      'INSERT INTO Bookings (customer_id, vehicle_id, start_date, end_date, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.userId, vId, sDate, eDate, tAmount, 'confirmed']
    );
    
    // Update vehicle availability status (simplified - typically we use booking status to derive availability)
    await query('UPDATE Vehicles SET availability_status = $1 WHERE vehicle_id = $2', ['unavailable', vehicle_id]);
    
    res.json(mapBooking(result.rows[0]));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/bookings/customer', authenticate, async (req: any, res) => {
    try {
      const result = await query('SELECT b.*, v.category, v.name FROM Bookings b JOIN Vehicles v ON b.vehicle_id = v.vehicle_id WHERE b.customer_id = $1', [req.user.userId]);
      res.json(result.rows.map(mapBooking));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
});

router.get('/bookings/owner', authenticate, async (req: any, res) => {
  try {
    const result = await query(
      'SELECT b.*, v.category, v.name FROM Bookings b JOIN Vehicles v ON b.vehicle_id = v.vehicle_id WHERE v.owner_id = $1',
      [req.user.userId]
    );
    res.json(result.rows.map(mapBooking));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/owner/vehicles', authenticate, async (req: any, res) => {
  try {
    const baseQuery = `
      SELECT v.*, 
             (SELECT AVG(rating) FROM Reviews WHERE vehicle_id = v.vehicle_id) as avg_rating,
             (SELECT COUNT(*) FROM Reviews WHERE vehicle_id = v.vehicle_id) as review_count
      FROM Vehicles v
      WHERE v.owner_id = $1
    `;
    const result = await query(baseQuery, [req.user.userId]);
    res.json(result.rows.map(mapVehicle));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/bookings/:id/status', authenticate, async (req: any, res) => {
  const { status, payment_reference } = req.body;
  const bookingId = req.params.id;
  try {
    // Verify ownership or customer relation
    const bResult = await query(
      'SELECT b.customer_id, v.owner_id FROM Bookings b JOIN Vehicles v ON b.vehicle_id = v.vehicle_id WHERE b.booking_id = $1',
      [bookingId]
    );
    if (bResult.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    
    const isOwner = bResult.rows[0].owner_id === req.user.userId;
    const isCustomer = bResult.rows[0].customer_id === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isCustomer && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (payment_reference) {
      await query('UPDATE Bookings SET status = $1, payment_reference = $2 WHERE booking_id = $3', [status, payment_reference, bookingId]);
    } else {
      await query('UPDATE Bookings SET status = $1 WHERE booking_id = $2', [status, bookingId]);
    }

    // Auto-update vehicle availability based on booking status
    const booking = (await query('SELECT vehicle_id FROM Bookings WHERE booking_id = $1', [bookingId])).rows[0];
    if (status === 'completed' || status === 'rejected') {
      await query('UPDATE Vehicles SET availability_status = $1 WHERE vehicle_id = $2', ['available', booking.vehicle_id]);
    } else if (status === 'confirmed' || status === 'paid') {
      await query('UPDATE Vehicles SET availability_status = $1 WHERE vehicle_id = $2', ['unavailable', booking.vehicle_id]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Review Routes ---
router.get('/vehicles/:id/reviews', async (req, res) => {
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
});

router.post('/reviews', authenticate, async (req: any, res) => {
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
    console.error('[API] Review submit error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// --- Upload Route ---
router.post('/upload', authenticate, (req, res, next) => {
  console.log('[API] Upload request received. Auth user:', (req as any).user?.userId);
  next();
}, upload.array('images', 5), (req: any, res: any) => {
  console.log('[API] Files received by multer:', req.files?.length);
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  const urls = req.files.map((file: any) => file.path);
  console.log('[API] Upload success. URLs:', urls);
  res.json({ urls });
});

// Admin Routes
router.get('/admin/stats', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const userStats = await query('SELECT COUNT(*) as total FROM Users');
    const vehicleStats = await query('SELECT COUNT(*) as total FROM Vehicles');
    const bookingStats = await query('SELECT COUNT(*) as total, SUM(total_amount) as total_revenue FROM Bookings');
    const paymentStats = await query('SELECT COUNT(*) as pending FROM Payments WHERE verified_by_admin = FALSE');
    const activeRentals = await query("SELECT COUNT(*) as total FROM Bookings WHERE status IN ('approved', 'paid')");

    res.json({
      totalUsers: parseInt(userStats.rows[0].total),
      totalVehicles: parseInt(vehicleStats.rows[0].total),
      totalBookings: parseInt(bookingStats.rows[0].total),
      totalRevenue: parseFloat(bookingStats.rows[0].total_revenue || 0),
      pendingPayments: parseInt(paymentStats.rows[0].pending),
      activeRentals: parseInt(activeRentals.rows[0].total)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/payments', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query('SELECT * FROM Payments ORDER BY created_at DESC');
    res.json(result.rows.map(p => ({
      id: p.payment_id,
      bookingId: p.booking_id,
      userId: p.user_id,
      amount: parseFloat(p.amount),
      paymentStatus: p.status,
      verifiedByAdmin: p.verified_by_admin,
      createdAt: p.created_at
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/payments/:id/verify', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(
      'UPDATE Payments SET status = $1, verified_by_admin = $2 WHERE payment_id = $3 RETURNING *',
      ['verified', true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/admin/users', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query('SELECT * FROM Users ORDER BY created_at DESC');
    res.json(result.rows.map(mapUser));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/bookings', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await query(`
      SELECT b.*, v.name as vehicle_name, v.category as vehicle_category, 
             u.name as customer_name, u.email as customer_email
      FROM Bookings b
      JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
      JOIN Users u ON b.customer_id = u.user_id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows.map(b => ({
      ...mapBooking(b),
      customerName: b.customer_name,
      customerEmail: b.customer_email
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/verifications', authenticate, async (req: any, res) => {
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
});

router.put('/admin/users/:id', authenticate, async (req: any, res) => {
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
});

export default router;
