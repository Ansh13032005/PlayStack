import { Request, Response, NextFunction } from 'express';
import { messageService } from '../service/message.service';
import { sendResponse } from '../../../utils/response';

export class MessageController {
  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const senderId = req.user!.userId;
      const { recipientId, subject, content } = req.body;

      if (!recipientId || !subject || !content) {
        sendResponse(res, 400, false, 'Recipient, subject, and content are required.');
        return;
      }

      // Build attachments from uploaded files (if any)
      const files = req.files as Express.Multer.File[];
      const attachments = files?.map((f: any) => ({
        filename: f.originalname,
        url: f.path, // Cloudinary URL
        size: f.size,
      })) || [];

      const message = await messageService.sendMessage(senderId, recipientId, subject, content, attachments);
      sendResponse(res, 201, true, 'Message sent successfully', message);
    } catch (error) {
      next(error);
    }
  };

  getInbox = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const data = await messageService.getInbox(employeeId, page, limit);
      sendResponse(res, 200, true, 'Inbox fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getSentMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const data = await messageService.getSentMessages(employeeId, page, limit);
      sendResponse(res, 200, true, 'Sent messages fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messageId = String(req.params['id'] || req.params.id);
      const employeeId = req.user!.userId;
      
      const message = await messageService.markAsRead(messageId, employeeId);
      sendResponse(res, 200, true, 'Message marked as read', message);
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.userId;
      const count = await messageService.getUnreadCount(employeeId);
      sendResponse(res, 200, true, 'Unread count fetched', { count });
    } catch (error) {
      next(error);
    }
  };
}

export const messageController = new MessageController();
