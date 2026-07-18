import { Request, Response, NextFunction } from 'express';
import { auditService } from '../service/audit.service';
import { sendResponse } from '../../../utils/response';

export class AuditController {
  getLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const filter: any = {};
      if (req.query.action) filter.action = req.query.action;
      if (req.query.resource) filter.resource = req.query.resource;
      if (req.query.user) filter.user = req.query.user;

      const data = await auditService.getLogs(page, limit, filter);
      sendResponse(res, 200, true, 'Audit logs fetched', data);
    } catch (error) {
      next(error);
    }
  };
}

export const auditController = new AuditController();
