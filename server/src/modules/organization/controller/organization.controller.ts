import { Request, Response, NextFunction } from 'express';
import { organizationService } from '../service/organization.service';
import { sendResponse } from '../../../utils/response';
import { Role } from '../../../models/Employee';

export class OrganizationController {

  // GET /api/organization/tree — Super Admin, HR Manager
  async getOrganizationTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await organizationService.getOrganizationTree();
      sendResponse(res, 200, true, 'Organization tree fetched successfully', tree);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/organization/:id/reportees — Super Admin, HR Manager
  async getDirectReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const managerId = String(req.params['id']);

      // Employee can only view their own direct reports
      if (req.user!.role === Role.EMPLOYEE && req.user!.userId !== managerId) {
        sendResponse(res, 403, false, 'You can only view your own direct reports.');
        return;
      }

      const result = await organizationService.getDirectReports(managerId);
      sendResponse(res, 200, true, 'Direct reports fetched successfully', result);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/organization/:id/manager — Super Admin, HR Manager
  async assignManager(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeId = String(req.params['id']);
      const { managerId } = req.body as { managerId: string | null };

      if (managerId === undefined) {
        sendResponse(res, 400, false, 'managerId is required in request body. Send null to remove manager.');
        return;
      }

      const updated = await organizationService.assignManager(employeeId, managerId);
      const message = managerId
        ? 'Reporting manager assigned successfully'
        : 'Reporting manager removed successfully';

      sendResponse(res, 200, true, message, updated);
    } catch (error) {
      next(error);
    }
  }
}

export const organizationController = new OrganizationController();
