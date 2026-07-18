import { messageRepository } from '../repository/message.repository';
import { IMessage } from '../../../models/Message';
import { Employee } from '../../../models/Employee';
import { sendNewMessageEmail } from '../../../utils/email';
import { notificationService } from '../../notification/service/notification.service';
import { NotificationType } from '../../../models/Notification';
import { AppError } from '../../../utils/AppError';
import { Types } from 'mongoose';

export class MessageService {
  async sendMessage(
    senderId: string,
    recipientId: string,
    subject: string,
    content: string,
    attachments?: { filename: string; url: string; size: number }[]
  ) {
    if (senderId === recipientId) {
      throw new AppError('Cannot send a message to yourself.', 400);
    }

    const [sender, recipient] = await Promise.all([
      Employee.findById(senderId),
      Employee.findById(recipientId),
    ]);

    if (!recipient) {
      throw new AppError('Recipient not found.', 404);
    }

    const message = await messageRepository.createMessage({
      sender: new Types.ObjectId(senderId),
      recipient: new Types.ObjectId(recipientId),
      subject,
      content,
      attachments: attachments || [],
    });

    // Send email notification asynchronously
    if (sender) {
      sendNewMessageEmail(
        recipient.email,
        `${sender.firstName} ${sender.lastName}`,
        subject,
        content.length > 100 ? content.substring(0, 100) + '...' : content
      ).catch((err) => console.error('Email failed:', err));

      // Create in-app notification
      notificationService.createNotification(
        recipientId,
        `New Message from ${sender.firstName}`,
        subject,
        NotificationType.MESSAGE,
        '/messages'
      ).catch((err) => console.error('Notification failed:', err));
    }

    return message;
  }

  async getInbox(employeeId: string, page: number, limit: number) {
    return messageRepository.getInbox(employeeId, page, limit);
  }

  async getSentMessages(employeeId: string, page: number, limit: number) {
    return messageRepository.getSentMessages(employeeId, page, limit);
  }

  async markAsRead(messageId: string, employeeId: string) {
    const message = await messageRepository.markAsRead(messageId, employeeId);
    if (!message) {
      throw new AppError('Message not found or not authorized.', 404);
    }
    return message;
  }

  async getUnreadCount(employeeId: string) {
    return messageRepository.getUnreadCount(employeeId);
  }
}

export const messageService = new MessageService();
