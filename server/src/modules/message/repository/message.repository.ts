import { Message, IMessage } from '../../../models/Message';
import { Types } from 'mongoose';

export class MessageRepository {
  async createMessage(data: Partial<IMessage>): Promise<IMessage> {
    const message = new Message(data);
    return message.save();
  }

  async getInbox(employeeId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { recipient: new Types.ObjectId(employeeId) };
    
    const [records, total] = await Promise.all([
      Message.find(filter)
        .populate('sender', 'firstName lastName profileImage role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(filter),
    ]);

    return { records, total, page, pages: Math.ceil(total / limit) };
  }

  async getSentMessages(employeeId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { sender: new Types.ObjectId(employeeId) };
    
    const [records, total] = await Promise.all([
      Message.find(filter)
        .populate('recipient', 'firstName lastName profileImage role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(filter),
    ]);

    return { records, total, page, pages: Math.ceil(total / limit) };
  }

  async markAsRead(messageId: string, recipientId: string): Promise<IMessage | null> {
    return Message.findOneAndUpdate(
      { _id: new Types.ObjectId(messageId), recipient: new Types.ObjectId(recipientId) },
      { isRead: true },
      { new: true }
    );
  }

  async getUnreadCount(employeeId: string): Promise<number> {
    return Message.countDocuments({
      recipient: new Types.ObjectId(employeeId),
      isRead: false,
    });
  }
}

export const messageRepository = new MessageRepository();
