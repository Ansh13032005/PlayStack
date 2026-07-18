import { Router } from 'express';
import { notificationController } from '../controller/notification.controller';
import { verifyTokenMiddleware } from '../../../middleware/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use((req, res, next) => verifyTokenMiddleware(req, res, next));

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
