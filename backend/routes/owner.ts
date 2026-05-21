import express from 'express';
import { 
  getOwnerVehicles 
} from '../controllers/vehicleController';
import { 
  getOwnerBookings 
} from '../controllers/bookingController';
import {
  getOwnerVerificationRequests,
  updateOwnerVerificationRequestStatus,
  getOwnerPayments,
  verifyPayment
} from '../controllers/adminController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/vehicles', authenticate, getOwnerVehicles);
router.get('/bookings', authenticate, getOwnerBookings);
router.get('/verification-requests', authenticate, getOwnerVerificationRequests);
router.put('/verification-requests/:id/status', authenticate, updateOwnerVerificationRequestStatus);
router.get('/payments', authenticate, getOwnerPayments);
router.put('/payments/:id/verify', authenticate, verifyPayment);

export default router;
