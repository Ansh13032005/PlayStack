import { Router } from 'express';
import { attendanceController } from '../controller/attendance.controller';
import { verifyTokenMiddleware } from '../../../middleware/auth.middleware';
import { checkRole } from '../../../middleware/role.middleware';
import { Role } from '../../../models/Employee';

const router = Router();

// All attendance routes require authentication
router.use((req, res, next) => verifyTokenMiddleware(req, res, next));

// Employee actions
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/today', attendanceController.getTodayStatus);
router.get('/me', attendanceController.getMyAttendance);

// HR/Admin actions
router.get(
  '/all',
  checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER),
  attendanceController.getAllAttendance
);

export default router;
