import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { authRepository } from '../repository/auth.repository';

vi.mock('../repository/auth.repository', () => ({
  authRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findByResetTokenAndEmail: vi.fn(),
  },
}));

vi.mock('../../../utils/jwt', () => ({
  generateToken: vi.fn().mockReturnValue('access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('refresh-token'),
  verifyRefreshToken: vi.fn(),
}));

vi.mock('../../../utils/email', () => ({
  sendOTPPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../audit/service/audit.service', () => ({
  auditService: { log: vi.fn().mockResolvedValue(undefined) },
}));

describe('AuthService', () => {
  const service = new AuthService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logout', () => {
    it('removes the refresh token from the employee record', async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const employee = {
        refreshTokens: ['token-a', 'token-b'],
        save,
      };

      vi.mocked(authRepository.findById).mockResolvedValue(employee as any);

      await service.logout('user-1', 'token-a');

      expect(employee.refreshTokens).toEqual(['token-b']);
      expect(save).toHaveBeenCalled();
    });

    it('does nothing when employee is not found', async () => {
      vi.mocked(authRepository.findById).mockResolvedValue(null);

      await expect(service.logout('missing-user', 'token-a')).resolves.toBeUndefined();
    });
  });

  describe('login', () => {
    it('rejects invalid credentials', async () => {
      vi.mocked(authRepository.findByEmail).mockResolvedValue({
        status: 'Active',
        isLocked: false,
        loginAttempts: 0,
        comparePassword: vi.fn().mockResolvedValue(false),
        save: vi.fn(),
      } as any);

      await expect(
        service.login({ email: 'user@company.com', password: 'wrong' })
      ).rejects.toMatchObject({
        message: 'Invalid email or password',
        statusCode: 401,
      });
    });

    it('returns tokens on successful login', async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      vi.mocked(authRepository.findByEmail).mockResolvedValue({
        _id: 'user-1',
        role: 'Employee',
        status: 'Active',
        isLocked: false,
        loginAttempts: 0,
        refreshTokens: [],
        comparePassword: vi.fn().mockResolvedValue(true),
        toObject: vi.fn().mockReturnValue({ _id: 'user-1', role: 'Employee' }),
        save,
      } as any);

      const result = await service.login({
        email: 'user@company.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(save).toHaveBeenCalled();
    });
  });
});
