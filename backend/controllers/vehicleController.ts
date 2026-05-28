import { query } from '../config/db';

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
    plateNumber: dbV.plate_number,
    ownershipBookUrl: dbV.ownership_book_url,
    insuranceCertUrl: dbV.insurance_cert_url,
    nationalIdUrl: dbV.national_id_url,
    approvalStatus: dbV.approval_status || 'pending',
    fuelType: dbV.fuel_type,
    transmission: dbV.transmission,
    seats: dbV.seats,
    createdAt: dbV.created_at,
    averageRating: dbV.avg_rating ? parseFloat(dbV.avg_rating) : 0,
    reviewCount: dbV.review_count ? parseInt(dbV.review_count) : 0
  };
};

export const getVehicles = async (req: any, res: any) => {
  const { status, category, minPrice, maxPrice, limit } = req.query;
  const activeStatus = status || 'available';
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

    // Always exclude vehicles from deactivated (inactive) owner accounts
    whereClauses.push(`u.status = 'active'`);

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

    // Build WHERE clause (always has at least the u.status = 'active' condition)
    const whereString = `WHERE ${whereClauses.join(' AND ')}`;

    // Add approval status filter — vehicles must be approved for public view
    const finalQuery = `${baseQuery} ${whereString} AND v.approval_status = 'approved'${
      limit ? ` LIMIT $${params.length + 1}` : ''
    }`;

    if (limit) {
      params.push(parseInt(limit as string));
    }

    const result = await query(finalQuery, params);
    res.json(result.rows.map(mapVehicle));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCategories = async (req: any, res: any) => {
  try {
    const result = await query('SELECT DISTINCT category FROM Vehicles');
    res.json(result.rows.map(row => row.category));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const validateFileUrl = (url?: string) => {
  if (!url) return true;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.pdf') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png');
};

export const createVehicle = async (req: any, res: any) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  let { 
    name, category, description, price_per_day, location, images, fuel_type, 
    transmission, seats, availability_status,
    plate_number, ownership_book_url, insurance_cert_url, national_id_url
  } = req.body;

  try {
    // 1. Check for empty required fields
    if (!name || !name.trim()) return res.status(400).json({ error: 'Vehicle name/model is required' });
    if (!category || !category.trim()) return res.status(400).json({ error: 'Vehicle category is required' });
    if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required' });
    if (!location || !location.trim()) return res.status(400).json({ error: 'Location is required' });
    if (!plate_number || !plate_number.trim()) return res.status(400).json({ error: 'Plate number is required' });

    name = name.trim();
    category = category.trim();
    description = description.trim();
    location = location.trim();
    plate_number = plate_number.trim();

    // 2. Validate price_per_day is a positive non-negative number
    const price = parseFloat(price_per_day);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Price per day must be a positive number greater than 0' });
    }

    // 3. Validate seats/capacity is positive non-negative integer
    const cap = parseInt(seats);
    if (isNaN(cap) || cap <= 0) {
      return res.status(400).json({ error: 'Passenger capacity must be a positive integer greater than 0' });
    }

    // 4. Validate mandatory document presence and correct file formats
    if (!ownership_book_url || !ownership_book_url.trim()) {
      return res.status(400).json({ error: 'Vehicle Ownership Book (Libre) photo or PDF is required.' });
    }
    if (!validateFileUrl(ownership_book_url)) {
      return res.status(400).json({ error: 'Uploaded Ownership Book must be in PDF, JPG, JPEG, or PNG format.' });
    }

    if (!insurance_cert_url || !insurance_cert_url.trim()) {
      return res.status(400).json({ error: 'Vehicle Insurance Certificate photo or PDF is required.' });
    }
    if (!validateFileUrl(insurance_cert_url)) {
      return res.status(400).json({ error: 'Uploaded Insurance Certificate must be in PDF, JPG, JPEG, or PNG format.' });
    }

    if (!national_id_url || !national_id_url.trim()) {
      return res.status(400).json({ error: 'National ID / Fayda ID photo or PDF is required.' });
    }
    if (!validateFileUrl(national_id_url)) {
      return res.status(400).json({ error: 'Uploaded National ID / Fayda ID must be in PDF, JPG, JPEG, or PNG format.' });
    }

    if (!images || !Array.isArray(images) || images.length === 0 || !images[0]) {
      return res.status(400).json({ error: 'At least one vehicle photo is required.' });
    }

    const result = await query(
      `INSERT INTO Vehicles (
        owner_id, name, category, description, price_per_day, location, 
        image_url, image_urls, fuel_type, transmission, seats, availability_status,
        plate_number, ownership_book_url, insurance_cert_url, national_id_url, approval_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        req.user.userId, 
        name, 
        category, 
        description, 
        price, 
        location, 
        images && images.length > 0 ? images[0] : null,
        JSON.stringify(images || []),
        fuel_type || 'Petrol',
        transmission || 'Automatic',
        cap,
        availability_status || 'available',
        plate_number,
        ownership_book_url || null,
        insurance_cert_url || null,
        national_id_url || null,
        'pending' // Status is always pending on create
      ]
    );
    res.json(mapVehicle(result.rows[0]));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updateVehicle = async (req: any, res: any) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  let { 
    name, category, description, price_per_day, location, images, fuel_type, 
    transmission, seats, availability_status,
    plate_number, ownership_book_url, insurance_cert_url, national_id_url
  } = req.body;
  const vehicleId = req.params.id;
  try {
    const vResult = await query('SELECT owner_id FROM Vehicles WHERE vehicle_id = $1', [vehicleId]);
    if (vResult.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    if (vResult.rows[0].owner_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 1. Check for empty required fields
    if (!name || !name.trim()) return res.status(400).json({ error: 'Vehicle name/model is required' });
    if (!category || !category.trim()) return res.status(400).json({ error: 'Vehicle category is required' });
    if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required' });
    if (!location || !location.trim()) return res.status(400).json({ error: 'Location is required' });
    if (!plate_number || !plate_number.trim()) return res.status(400).json({ error: 'Plate number is required' });

    name = name.trim();
    category = category.trim();
    description = description.trim();
    location = location.trim();
    plate_number = plate_number.trim();

    // 2. Validate price is positive
    const price = parseFloat(price_per_day);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'Price per day must be a positive number greater than 0' });
    }

    // 3. Validate seats is positive
    const cap = parseInt(seats);
    if (isNaN(cap) || cap <= 0) {
      return res.status(400).json({ error: 'Passenger capacity must be a positive integer greater than 0' });
    }

    // 4. Validate mandatory document presence and correct file formats
    if (!ownership_book_url || !ownership_book_url.trim()) {
      return res.status(400).json({ error: 'Vehicle Ownership Book (Libre) photo or PDF is required.' });
    }
    if (!validateFileUrl(ownership_book_url)) {
      return res.status(400).json({ error: 'Uploaded Ownership Book must be in PDF, JPG, JPEG, or PNG format.' });
    }

    if (!insurance_cert_url || !insurance_cert_url.trim()) {
      return res.status(400).json({ error: 'Vehicle Insurance Certificate photo or PDF is required.' });
    }
    if (!validateFileUrl(insurance_cert_url)) {
      return res.status(400).json({ error: 'Uploaded Insurance Certificate must be in PDF, JPG, JPEG, or PNG format.' });
    }

    if (!national_id_url || !national_id_url.trim()) {
      return res.status(400).json({ error: 'National ID / Fayda ID photo or PDF is required.' });
    }
    if (!validateFileUrl(national_id_url)) {
      return res.status(400).json({ error: 'Uploaded National ID / Fayda ID must be in PDF, JPG, JPEG, or PNG format.' });
    }

    if (!images || !Array.isArray(images) || images.length === 0 || !images[0]) {
      return res.status(400).json({ error: 'At least one vehicle photo is required.' });
    }

    const result = await query(
      `UPDATE Vehicles SET 
        name = $1, category = $2, description = $3, price_per_day = $4, location = $5, 
        image_url = $6, image_urls = $7, fuel_type = $8, transmission = $9, 
        seats = $10, availability_status = $11,
        plate_number = $12, ownership_book_url = $13, insurance_cert_url = $14, national_id_url = $15
      WHERE vehicle_id = $16 RETURNING *`,
      [
        name, 
        category, 
        description, 
        price, 
        location, 
        images && images.length > 0 ? images[0] : null,
        JSON.stringify(images || []),
        fuel_type,
        transmission,
        cap,
        availability_status,
        plate_number,
        ownership_book_url || null,
        insurance_cert_url || null,
        national_id_url || null,
        vehicleId
      ]
    );
    res.json(mapVehicle(result.rows[0]));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteVehicle = async (req: any, res: any) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const vehicleId = req.params.id;
  try {
    const activeBookings = await query(
      "SELECT * FROM Bookings WHERE vehicle_id = $1 AND status IN ('pending', 'approved', 'paid', 'confirmed')",
      [vehicleId]
    );

    if (activeBookings.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete vehicle with active or upcoming bookings.' });
    }

    const vResult = await query('SELECT owner_id FROM Vehicles WHERE vehicle_id = $1', [vehicleId]);
    if (vResult.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    if (vResult.rows[0].owner_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await query('DELETE FROM Reviews WHERE vehicle_id = $1', [vehicleId]);
    await query('DELETE FROM Payments WHERE booking_id IN (SELECT booking_id FROM Bookings WHERE vehicle_id = $1)', [vehicleId]);
    await query('DELETE FROM Commissions WHERE booking_id IN (SELECT booking_id FROM Bookings WHERE vehicle_id = $1) OR vehicle_id = $1', [vehicleId]);
    await query('DELETE FROM Bookings WHERE vehicle_id = $1', [vehicleId]);
    await query('DELETE FROM Vehicles WHERE vehicle_id = $1', [vehicleId]);
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getOwnerVehicles = async (req: any, res: any) => {
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
};
