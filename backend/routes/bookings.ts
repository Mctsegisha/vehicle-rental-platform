import express from 'express';
import { 
  createBooking, 
  getCustomerBookings, 
  getOwnerBookings, 
  updateBookingStatus 
} from '../controllers/bookingController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authenticate, createBooking);
router.get('/customer', authenticate, getCustomerBookings);

// These were specific paths used for proxy compatibility
router.post('/u-b-s', authenticate, updateBookingStatus);
router.put('/u-b-s', authenticate, updateBookingStatus);

export default router;
