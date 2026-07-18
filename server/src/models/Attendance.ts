import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LATE = 'Late',
  HALF_DAY = 'Half-Day',
  ON_LEAVE = 'On Leave',
}

export interface IAttendance extends Document {
  employee: Types.ObjectId;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  totalHours?: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    clockIn: {
      type: Date,
    },
    clockOut: {
      type: Date,
    },
    totalHours: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.PRESENT,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// One attendance record per employee per day
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ status: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
