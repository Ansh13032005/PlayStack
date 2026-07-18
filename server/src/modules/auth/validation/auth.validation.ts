import { z } from 'zod';

export const loginPortalSchema = z.enum(['employee', 'hr', 'admin']);

// Zod v4 uses `error` instead of `required_error`/`invalid_type_error`
export const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email format'),
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
  portal: loginPortalSchema.optional(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Invalid email format'),
  otp: z
    .string({ error: 'OTP is required' })
    .length(6, 'OTP must be exactly 6 digits'),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
