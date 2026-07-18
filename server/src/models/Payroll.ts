import mongoose, { Schema, Document, Types } from 'mongoose';

export enum PayrollStatus {
  DRAFT = 'Draft',
  PROCESSED = 'Processed',
  PAID = 'Paid',
}

export interface IPayroll extends Document {
  employee: Types.ObjectId;
  month: number; // 1 to 12
  year: number;
  baseSalary: number;
  perDaySalary: number;
  totalDaysInMonth: number;
  unpaidLeaveDays: number;
  halfDays: number; // count of half-days (not covered by leave)
  lateDays: number; // count of late clock-ins
  totalDeductionDays: number;
  deductionAmount: number;
  netPay: number;
  status: PayrollStatus;
  processedBy?: Types.ObjectId; // HR who processed it
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema = new Schema<IPayroll>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    perDaySalary: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDaysInMonth: {
      type: Number,
      required: true,
      min: 28,
      max: 31,
    },
    unpaidLeaveDays: {
      type: Number,
      default: 0,
    },
    halfDays: {
      type: Number,
      default: 0,
    },
    lateDays: {
      type: Number,
      default: 0,
    },
    totalDeductionDays: {
      type: Number,
      default: 0,
    },
    deductionAmount: {
      type: Number,
      default: 0,
    },
    netPay: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(PayrollStatus),
      default: PayrollStatus.DRAFT,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
  },
  { timestamps: true }
);

// Prevent duplicate payroll records for the same employee in the same month
PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
PayrollSchema.index({ status: 1 });

export const Payroll = mongoose.model<IPayroll>('Payroll', PayrollSchema);
