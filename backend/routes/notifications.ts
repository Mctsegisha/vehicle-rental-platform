import express from 'express';
import { 
  getMyNotifications, 
  markNotificationAsRead, 
  markAllNotificationsRead, 
  deleteNotification 
} from '../controllers/notificationController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticate, getMyNotifications);
router.post('/mark-all-read', authenticate, markAllNotificationsRead);
router.put('/:id/read', authenticate, markNotificationAsRead);
router.delete('/:id', authenticate, deleteNotification);

export default router;
