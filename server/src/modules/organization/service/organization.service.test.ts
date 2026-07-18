import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService } from './organization.service';
import { organizationRepository } from '../repository/organization.repository';
import { AppError } from '../../../utils/AppError';

vi.mock('../repository/organization.repository', () => ({
  organizationRepository: {
    findByIdWithManager: vi.fn(),
    updateManager: vi.fn(),
    findDirectReports: vi.fn(),
    findAllActive: vi.fn(),
  },
}));

describe('OrganizationService', () => {
  const service = new OrganizationService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assignManager — circular reference detection', () => {
    it('rejects when an employee would become their own manager', async () => {
      await expect(service.assignManager('emp-a', 'emp-a')).rejects.toMatchObject({
        message: 'An employee cannot be their own manager.',
        statusCode: 400,
      });
    });

    it('rejects circular reporting chains', async () => {
      vi.mocked(organizationRepository.findByIdWithManager).mockImplementation(async (id) => {
        if (id === 'manager-b') {
          return {
            _id: 'manager-b',
            reportingManager: { _id: 'emp-a' },
          } as any;
        }
        return { _id: id } as any;
      });

      await expect(service.assignManager('emp-a', 'manager-b')).rejects.toMatchObject({
        message: 'Cannot assign manager: this would create a circular reporting chain.',
        statusCode: 400,
      });
    });

    it('assigns manager when the chain is valid', async () => {
      vi.mocked(organizationRepository.findByIdWithManager).mockResolvedValue({
        _id: 'manager-b',
        reportingManager: null,
      } as any);
      vi.mocked(organizationRepository.updateManager).mockResolvedValue({
        _id: 'emp-a',
        reportingManager: 'manager-b',
      } as any);

      const result = await service.assignManager('emp-a', 'manager-b');

      expect(result).toMatchObject({ _id: 'emp-a' });
      expect(organizationRepository.updateManager).toHaveBeenCalledWith('emp-a', 'manager-b');
    });

    it('throws 404 when proposed manager does not exist', async () => {
      vi.mocked(organizationRepository.findByIdWithManager).mockResolvedValue(null);

      await expect(service.assignManager('emp-a', 'missing-manager')).rejects.toMatchObject({
        message: 'Proposed manager not found.',
        statusCode: 404,
      });
    });
  });
});
