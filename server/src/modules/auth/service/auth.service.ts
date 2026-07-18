import crypto from 'crypto';
import { AppError } from '../../../utils/AppError';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../../../utils/jwt';
import { authRepository } from '../repository/auth.repository';
import { LoginDto, AuthTokens } from '../dto/auth.dto';
import { sendOTPPasswordResetEmail } from '../../../utils/email';
import { auditService } from '../../audit/service/audit.service';
import { AuditAction } from '../../../models/AuditLog';
import { Role } from '../../../models/Employee';

const PORTAL_ROLE_MAP: Record<NonNullable<LoginDto['portal']>, Role> = {
  employee: Role.EMPLOYEE,
  hr: Role.HR_MANAGER,
  admin: Role.SUPER_ADMIN,
};

const PORTAL_LABELS: Record<NonNullable<LoginDto['portal']>, string> = {
  employee: 'Employee Portal',
  hr: 'HR Management Portal',
  admin: 'System Admin Portal',
};

export class AuthService {
  async login(data: LoginDto): Promise<AuthTokens> {
    const { email, password, portal } = data;

    const employee = await authRepository.findByEmail(email);
    if (!employee) {
      throw new AppError('Invalid email or password', 401);
    }

    if (employee.status === 'Inactive') {
      throw new AppError('Your account has been deactivated. Please contact HR.', 403);
    }

    if (employee.isLocked) {
      throw new AppError('Account is temporarily locked due to too many failed login attempts. Please try again later.', 403);
    }

    const isPasswordMatch = await employee.comparePassword(password);
    if (!isPasswordMatch) {
      employee.loginAttempts += 1;
      
      if (employee.loginAttempts >= 5) {
        employee.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        await employee.save();
        throw new AppError('Account locked due to 5 failed attempts. Try again in 15 minutes.', 403);
      }
      
      await employee.save();
      throw new AppError('Invalid email or password', 401);
    }

    // Reset login attempts on successful login
    if (employee.loginAttempts > 0 || employee.lockUntil) {
      employee.loginAttempts = 0;
      employee.lockUntil = undefined;
      await employee.save();
    }

    if (portal) {
      const expectedRole = PORTAL_ROLE_MAP[portal];
      if (employee.role !== expectedRole) {
        throw new AppError(
          `This account is not authorized for the ${PORTAL_LABELS[portal]}. Your role is "${employee.role}" — please sign in through the correct portal.`,
          403
        );
      }
    }

    const accessToken = generateToken({
      userId: employee._id.toString(),
      role: employee.role,
    });

    const refreshToken = generateRefreshToken({
      userId: employee._id.toString(),
      role: employee.role,
    });

    // Save refresh token to employee
    employee.refreshTokens.push(refreshToken);
    await employee.save();

    // Log the successful login
    await auditService.log(
      employee._id.toString(),
      AuditAction.LOGIN,
      'Auth',
      'User logged in successfully'
    );

    const employeeData = employee.toObject();
    delete employeeData.password;
    delete employeeData.refreshTokens;
    delete employeeData.resetPasswordToken;
    delete employeeData.resetPasswordExpire;

    return {
      accessToken,
      refreshToken,
      employee: employeeData,
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const employee = await authRepository.findById(userId);
    if (employee) {
      employee.refreshTokens = employee.refreshTokens.filter((token) => token !== refreshToken);
      await employee.save();
    }
  }

  async refreshTokens(oldRefreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = verifyRefreshToken(oldRefreshToken);
      const employee = await authRepository.findById(decoded.userId);

      if (!employee || !employee.refreshTokens.includes(oldRefreshToken)) {
        throw new AppError('Invalid refresh token', 403);
      }

      // Token rotation
      employee.refreshTokens = employee.refreshTokens.filter((t) => t !== oldRefreshToken);

      const accessToken = generateToken({
        userId: employee._id.toString(),
        role: employee.role,
      });

      const newRefreshToken = generateRefreshToken({
        userId: employee._id.toString(),
        role: employee.role,
      });

      employee.refreshTokens.push(newRefreshToken);
      await employee.save();

      const employeeData = employee.toObject();
      delete employeeData.password;
      delete employeeData.refreshTokens;
      delete employeeData.resetPasswordToken;
      delete employeeData.resetPasswordExpire;

      return {
        accessToken,
        refreshToken: newRefreshToken,
        employee: employeeData,
      };
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 403);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const employee = await authRepository.findByEmail(email);
    if (!employee) {
      throw new AppError('There is no user with that email', 404);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP and set to resetPasswordToken field
    employee.resetPasswordToken = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Set expire to 10 minutes
    employee.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

    await employee.save({ validateBeforeSave: false });

    try {
      await sendOTPPasswordResetEmail(employee.email, otp);
    } catch (error) {
      employee.resetPasswordToken = undefined;
      employee.resetPasswordExpire = undefined;
      await employee.save({ validateBeforeSave: false });
      throw new AppError('Email could not be sent', 500);
    }
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    // Get hashed OTP
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    const employee = await authRepository.findByResetTokenAndEmail(resetPasswordToken, email);

    if (!employee) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Set new password
    employee.password = newPassword;
    employee.resetPasswordToken = undefined;
    employee.resetPasswordExpire = undefined;
    
    // Invalidate all active sessions on password reset
    employee.refreshTokens = [];

    await employee.save();

    // Log password reset
    await auditService.log(
      employee._id.toString(),
      AuditAction.PASSWORD_RESET,
      'Auth',
      'User reset their password via token'
    );
  }
}

export const authService = new AuthService();
