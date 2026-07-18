import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export enum Role {
  SUPER_ADMIN = 'Super Admin',
  HR_MANAGER = 'HR Manager',
  EMPLOYEE = 'Employee',
}

export enum Status {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export interface IEmployee extends Document {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  department?: string;
  designation?: string;
  salary?: number;
  joiningDate?: Date;
  status: Status;
  role: Role;
  reportingManager?: Types.ObjectId;
  profileImage?: string;
  refreshTokens: string[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  forcePasswordChange: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
    },
    password: {
      type: String,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    salary: {
      type: Number,
      min: 0,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(Status),
      default: Status.ACTIVE,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.EMPLOYEE,
    },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    profileImage: {
      type: String,
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    loginAttempts: {
      type: Number,
      required: true,
      default: 0
    },
    lockUntil: {
      type: Date
    },
    forcePasswordChange: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ role: 1 });
EmployeeSchema.index({ status: 1 });

EmployeeSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Hash password before saving
EmployeeSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Compare password method
EmployeeSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
