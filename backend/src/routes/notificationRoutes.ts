import { Router } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '../controllers/notificationController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadNotificationCount);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/read-all', markAllNotificationsAsRead);

export default router;
