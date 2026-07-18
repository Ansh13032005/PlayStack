import { Router } from 'express';
import { messageController } from '../controller/message.controller';
import { verifyTokenMiddleware } from '../../../middleware/auth.middleware';
import { uploadMessageAttachments } from '../../../middleware/upload.middleware';

const router = Router();

// All message routes require authentication
router.use((req, res, next) => verifyTokenMiddleware(req, res, next));

router.post('/send', uploadMessageAttachments, messageController.sendMessage);
router.get('/recipients', messageController.getRecipients);
router.get('/inbox', messageController.getInbox);
router.get('/sent', messageController.getSentMessages);
router.get('/unread-count', messageController.getUnreadCount);
router.patch('/:id/read', messageController.markAsRead);

export default router;
