import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'ethiorent-dev-secret-key-2024';

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

export const getMyVerificationRequests = async (req: any, res: any) => {
  try {
    const result = await query(
      'SELECT vr.*, u.name as owner_name FROM VerificationRequests vr JOIN Users u ON vr.owner_id = u.user_id WHERE vr.customer_id = $1',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const register = async (req: any, res: any) => {
  let { name, email, password, role, phone } = req.body;
  try {
    // 1. Check for empty required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full Legal Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email Address is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    name = name.trim();
    email = email.trim().toLowerCase();

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // 3. Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
    }

    // 4. Validate phone format if provided
    if (phone && phone.trim()) {
      phone = phone.trim();
      const phoneRegex = /^(\+?[0-9\s-]{9,15})$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Please enter a valid phone number (9-15 digits, numbers/spaces/dashes)' });
      }
    } else {
      phone = null;
    }

    // 5. Validate Name contents (prevent numbers or special symbols if needed, basic check)
    if (name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }
    const nameRegex = /^[A-Za-z\s'\-\.]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ error: 'Name can only contain letters, spaces, hyphens, and periods' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    const result = await query(
      'INSERT INTO Users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, role, phone]
    );
    
    const user = mapUser(result.rows[0]);
    const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET);
    res.json({ user, token });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
};

export const login = async (req: any, res: any) => {
  let { email, password } = req.body;
  try {
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    email = email.trim().toLowerCase();

    const result = await query('SELECT * FROM Users WHERE email = $1', [email]);
    const dbUser = result.rows[0];
    
    if (!dbUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, dbUser.password);
    
    if (isMatch) {
      const user = mapUser(dbUser);

      // Block deactivated accounts from logging in
      if (user.status === 'inactive') {
        return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
      }

      const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET);
      res.json({ user, token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

export const changePassword = async (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const userResult = await query('SELECT * FROM Users WHERE user_id = $1', [req.user.userId]);
    const dbUser = userResult.rows[0];
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, dbUser.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password rules
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: 'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    await query('UPDATE Users SET password = $1 WHERE user_id = $2', [hashedPassword, req.user.userId]);
    res.json({ message: 'Password changed successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to change password' });
  }
};

export const resetPassword = async (req: any, res: any) => {
  let { email, newPassword } = req.body;
  try {
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    email = email.trim().toLowerCase();

    // Validate new password rules
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
    }

    const userResult = await query('SELECT * FROM Users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    const dbUser = userResult.rows[0];
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    await query('UPDATE Users SET password = $1 WHERE user_id = $2', [hashedPassword, dbUser.user_id]);
    res.json({ message: 'Password reset successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reset password' });
  }
};

export const getProfile = async (req: any, res: any) => {
  try {
    const result = await query('SELECT * FROM Users WHERE user_id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(mapUser(result.rows[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfileVerification = async (req: any, res: any) => {
  const { age, driverLicenseNumber, idPhotoUrl, licensePhotoUrl, targetOwnerId } = req.body;
  console.log(`[Auth] Updating verification for user ${req.user.userId}:`, { age, driverLicenseNumber, targetOwnerId });
  
  try {
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

    // Force age to be a number if it exists
    const finalAge = age ? parseInt(age.toString()) : null;

    const result = await query(
      `UPDATE Users SET 
        age = CASE WHEN $1::integer IS NOT NULL THEN $1::integer ELSE age END, 
        driver_license_number = CASE WHEN $2::text IS NOT NULL THEN $2::text ELSE driver_license_number END, 
        id_photo_url = CASE WHEN $3::text IS NOT NULL THEN $3::text ELSE id_photo_url END, 
        license_photo_url = CASE WHEN $4::text IS NOT NULL THEN $4::text ELSE license_photo_url END,
        is_verified = TRUE
       WHERE user_id = $5 RETURNING *`,
      [finalAge, driverLicenseNumber || null, idPhotoUrl || null, licensePhotoUrl || null, req.user.userId]
    );
    
    console.log(`[Auth] User ${req.user.userId} updated. Age is now: ${result.rows[0].age}`);
    res.json(mapUser(result.rows[0]));
  } catch (err: any) {
    console.error(`[Auth] Update verification error for user ${req.user.userId}:`, err.message);
    res.status(400).json({ error: err.message });
  }
};
