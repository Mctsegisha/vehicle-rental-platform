import express from 'express';
import { 
  getStats, 
  getPayments, 
  verifyPayment, 
  getUsers, 
  getBookings, 
  getVerifications, 
  updateUser,
  getPendingVehicles,
  updateVehicleApproval,
  getCommissions,
  getOwnerVerificationRequests,
  updateOwnerVerificationRequestStatus
} from '../controllers/adminController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/stats', authenticate, getStats);
router.get('/payments', authenticate, getPayments);
router.put('/payments/:id/verify', authenticate, verifyPayment);
router.get('/users', authenticate, getUsers);
router.put('/users/:id', authenticate, updateUser);
router.get('/bookings', authenticate, getBookings);
router.get('/verifications', authenticate, getVerifications);
router.get('/vehicles/pending', authenticate, getPendingVehicles);
router.put('/vehicles/:id/approval', authenticate, updateVehicleApproval);
router.get('/commissions', authenticate, getCommissions);

export default router;
