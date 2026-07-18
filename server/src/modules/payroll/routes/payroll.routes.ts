import { Router } from 'express';
import { payrollController } from '../controller/payroll.controller';
import { verifyTokenMiddleware } from '../../../middleware/auth.middleware';
import { checkRole } from '../../../middleware/role.middleware';
import { Role } from '../../../models/Employee';

const router = Router();

// Protect all routes
router.use(verifyTokenMiddleware);

// Employee routes
router.get('/me', payrollController.getMyPayslips);

// HR / Admin routes
router.use(checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER));
router.post('/generate', payrollController.generatePayroll);
router.get('/all', payrollController.getAllPayroll);
router.patch('/:id/pay', payrollController.markAsPaid);

export default router;
