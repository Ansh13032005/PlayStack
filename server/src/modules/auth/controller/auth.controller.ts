import { Request, Response, NextFunction } from 'express';
import { authService } from '../service/auth.service';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validation/auth.validation';
import { sendResponse } from '../../../utils/response';
import { ENV } from '../../../config/env';

export class AuthController {
  private setTokenCookie(res: Response, token: string) {
    const cookieOptions = {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    res.cookie('jwt_refresh', token, cookieOptions);
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        sendResponse(res, 400, false, 'Validation failed', null, parsed.error.flatten().fieldErrors);
        return;
      }

      const result = await authService.login(parsed.data);
      
      this.setTokenCookie(res, result.refreshToken);

      sendResponse(res, 200, true, 'Login successful', {
        accessToken: result.accessToken,
        employee: result.employee,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.jwt_refresh;
      if (req.user && refreshToken) {
        await authService.logout(req.user.userId, refreshToken);
      }
      
      res.clearCookie('jwt_refresh');
      sendResponse(res, 200, true, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async refreshTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const oldRefreshToken = req.cookies?.jwt_refresh;
      if (!oldRefreshToken) {
        sendResponse(res, 401, false, 'Refresh token required');
        return;
      }

      const result = await authService.refreshTokens(oldRefreshToken);
      
      this.setTokenCookie(res, result.refreshToken);

      sendResponse(res, 200, true, 'Tokens refreshed successfully', {
        accessToken: result.accessToken,
        employee: result.employee,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        sendResponse(res, 400, false, 'Validation failed', null, parsed.error.flatten().fieldErrors);
        return;
      }

      await authService.forgotPassword(parsed.data.email);

      sendResponse(res, 200, true, 'Email sent');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        sendResponse(res, 400, false, 'Validation failed', null, parsed.error.flatten().fieldErrors);
        return;
      }

      await authService.resetPassword(parsed.data.email, parsed.data.otp, parsed.data.password);

      sendResponse(res, 200, true, 'Password updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
