import mongoose, { Schema, Document, Types } from 'mongoose';

export enum LeaveType {
  SICK = 'Sick',
  CASUAL = 'Casual',
  EARNED = 'Earned',
  UNPAID = 'Unpaid',
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface ILeave extends Document {
  employee: Types.ObjectId;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: Types.ObjectId;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    leaveType: {
      type: String,
      enum: Object.values(LeaveType),
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(LeaveStatus),
      default: LeaveStatus.PENDING,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    reviewNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

LeaveSchema.index({ employee: 1, status: 1 });
LeaveSchema.index({ startDate: 1 });
LeaveSchema.index({ endDate: 1 });

export const Leave = mongoose.model<ILeave>('Leave', LeaveSchema);
