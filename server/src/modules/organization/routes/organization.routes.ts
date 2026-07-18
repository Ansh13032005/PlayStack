import { Router } from 'express';
import { organizationController } from '../controller/organization.controller';
import { verifyTokenMiddleware } from '../../../middleware/auth.middleware';
import { checkRole } from '../../../middleware/role.middleware';
import { Role } from '../../../models/Employee';

const router = Router();

// All organization routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/organization/tree — Full org chart (Super Admin, HR Manager)
router.get(
  '/tree',
  checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER),
  (req, res, next) => organizationController.getOrganizationTree(req, res, next)
);

export default router;
