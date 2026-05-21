import express from 'express';
import authRoutes from './auth';
import vehicleRoutes from './vehicles';
import bookingRoutes from './bookings';
import reviewRoutes from './reviews';
import adminRoutes from './admin';
import ownerRoutes from './owner';
import { upload } from '../config/cloudinary';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/owner', ownerRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload route
router.post('/upload', authenticate, (req: any, res: any, next: any) => {
  upload.array('images', 5)(req, res, (err: any) => {
    if (err) {
      console.error('Multer/Cloudinary Error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Limit is 5MB per file.' });
      }
      return res.status(400).json({ error: err.message || 'Upload failed. Only pdf, jpg, png, jpeg formats and max 5MB files are allowed.' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const urls = req.files.map((file: any) => file.path);
    res.json({ urls });
  });
});

export default router;
