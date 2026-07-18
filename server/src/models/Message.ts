import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  subject: string;
  content: string;
  isRead: boolean;
  attachments: { filename: string; url: string; size: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Sender is required'],
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Recipient is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [100, 'Subject cannot exceed 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        filename: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model<IMessage>('Message', messageSchema);
