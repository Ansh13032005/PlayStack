import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { Employee } from '../models/Employee';
import { Role } from '../models/Employee';

// Extend Express Request to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
      };
    }
  }
}

export const verifyTokenMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided. Access denied.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verify the employee still exists and is active
    const employee = await Employee.findById(decoded.userId).select('role status isDeleted');
    if (!employee || employee.isDeleted) {
      throw new AppError('User no longer exists.', 401);
    }
    if (employee.status === 'Inactive') {
      throw new AppError('Your account has been deactivated.', 403);
    }

    req.user = { userId: decoded.userId, role: decoded.role as Role };
    next();
  } catch (error) {
    next(error);
  }
};
