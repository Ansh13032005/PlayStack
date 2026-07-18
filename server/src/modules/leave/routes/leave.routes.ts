import { Router } from 'express';
import { leaveController } from '../controller/leave.controller';
import { verifyTokenMiddleware } from '../../../middleware/auth.middleware';
import { checkRole } from '../../../middleware/role.middleware';
import { Role } from '../../../models/Employee';

const router = Router();

// All leave routes require authentication
router.use((req, res, next) => verifyTokenMiddleware(req, res, next));

// Employee actions
router.post('/apply', leaveController.applyForLeave);
router.get('/me', leaveController.getMyLeaves);
router.delete('/:id/cancel', leaveController.cancelLeave);

// HR/Admin actions
router.get(
  '/all',
  checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER),
  leaveController.getAllLeaves
);

router.patch(
  '/:id/review',
  checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER),
  leaveController.reviewLeave
);

export default router;
