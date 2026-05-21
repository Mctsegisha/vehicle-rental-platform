import express from 'express';
import { register, login, getProfile, updateProfileVerification, getMyVerificationRequests, changePassword, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', authenticate, changePassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticate, getProfile);
router.get('/profile/verification-requests', authenticate, getMyVerificationRequests);
router.put('/profile/verification', authenticate, updateProfileVerification);

export default router;
