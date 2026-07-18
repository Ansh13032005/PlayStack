import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { checkRole } from './role.middleware';
import { Role } from '../models/Employee';
import { AppError } from '../utils/AppError';

describe('checkRole middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {};
    next = vi.fn();
  });

  it('returns 401 when user is not authenticated', () => {
    checkRole(Role.SUPER_ADMIN)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
  });

  it('returns 403 when user role is not allowed', () => {
    req.user = { userId: '1', role: Role.EMPLOYEE };
    checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(403);
  });

  it('calls next when user has an allowed role', () => {
    req.user = { userId: '1', role: Role.HR_MANAGER };
    checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
  });
});
