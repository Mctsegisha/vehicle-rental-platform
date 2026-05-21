import express from 'express';
import { getVehicleReviews, createReview } from '../controllers/reviewController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/vehicles/:id/reviews', getVehicleReviews);
router.post('/', authenticate, createReview);

export default router;
