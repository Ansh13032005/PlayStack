import { z } from 'zod';
import { Role, Status } from '../../../models/Employee';

export const createEmployeeSchema = z.object({
  firstName: z.string({ error: 'First name is required' }).min(2, 'First name must be at least 2 characters').trim(),
  lastName: z.string({ error: 'Last name is required' }).min(2, 'Last name must be at least 2 characters').trim(),
  email: z.string({ error: 'Email is required' }).email('Invalid email format').toLowerCase(),
  password: z.string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be a valid 10-digit number').optional(),
  department: z.string().optional(),
  designation: z.string().min(2, 'Designation must be at least 2 characters').optional(),
  salary: z.number().min(0, 'Salary cannot be negative').optional(),
  joiningDate: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
  role: z.nativeEnum(Role).optional(),
  reportingManager: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(2).trim().optional(),
  lastName: z.string().min(2).trim().optional(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be a valid 10-digit number').optional(),
  department: z.string().optional(),
  designation: z.string().min(2).optional(),
  salary: z.number().min(0).optional(),
  joiningDate: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
  role: z.nativeEnum(Role).optional(),
  reportingManager: z.string().optional(),
  profileImage: z.string().optional(),
});

// Limited fields an Employee role can update on their own profile
export const updateOwnProfileSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be a valid 10-digit number').optional(),
  designation: z.string().min(2).optional(),
  profileImage: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({ error: 'Current password is required' }),
  newPassword: z.string({ error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
