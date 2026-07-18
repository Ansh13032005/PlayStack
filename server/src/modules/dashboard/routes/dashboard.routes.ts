import { Router } from 'express';
import { dashboardController } from '../controller/dashboard.controller';
import { verifyTokenMiddleware } from '../../../middleware/auth.middleware';
import { checkRole } from '../../../middleware/role.middleware';
import { Role } from '../../../models/Employee';

const router = Router();

// All dashboard routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/dashboard/stats — Super Admin, HR Manager
router.get(
  '/stats',
  checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER),
  (req, res, next) => dashboardController.getDashboardStats(req, res, next)
);

export default router;
