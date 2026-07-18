import { Router } from 'express';
import { auditController } from '../controller/audit.controller';
import { verifyTokenMiddleware } from '../../../middleware/auth.middleware';
import { checkRole } from '../../../middleware/role.middleware';
import { Role } from '../../../models/Employee';

const router = Router();

// Only Super Admin can view audit logs
router.use((req, res, next) => verifyTokenMiddleware(req, res, next));
router.use(checkRole(Role.SUPER_ADMIN));

router.get('/', auditController.getLogs);

export default router;
