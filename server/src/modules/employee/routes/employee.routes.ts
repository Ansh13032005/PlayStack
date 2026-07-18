import { Router } from 'express';
import { employeeController } from '../controller/employee.controller';
import { organizationController } from '../../organization/controller/organization.controller';
import { verifyTokenMiddleware } from '../../../middleware/auth.middleware';
import { checkRole } from '../../../middleware/role.middleware';
import { uploadProfileImage, uploadCSV } from '../../../middleware/upload.middleware';
import { Role } from '../../../models/Employee';

const router = Router();

// All employee routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/employees/export — Super Admin, HR Manager
router.get(
  '/export',
  checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER),
  (req, res, next) => employeeController.exportCSV(req, res, next)
);

// POST /api/employees/bulk-upload — Super Admin, HR Manager
router.post(
  '/bulk-upload',
  checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER),
  uploadCSV,
  (req, res, next) => employeeController.bulkUploadCSV(req, res, next)
);

// GET /api/employees/me — Any authenticated user (must be before /:id)
router.get('/me', (req, res, next) =>
  employeeController.getOwnProfile(req, res, next)
);

// PUT /api/employees/me/change-password
router.put('/me/change-password', (req, res, next) =>
  employeeController.changePassword(req, res, next)
);

// GET /api/employees — Super Admin, HR Manager
router.get(
  '/',
  checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER),
  (req, res, next) => employeeController.getAllEmployees(req, res, next)
);

// POST /api/employees — Super Admin, HR Manager
router.post(
  '/',
  checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER),
  (req, res, next) => employeeController.createEmployee(req, res, next)
);

// GET /api/employees/:id — All roles (Employee can only access own)
router.get('/:id', (req, res, next) =>
  employeeController.getEmployeeById(req, res, next)
);

// PUT /api/employees/:id — All roles (Employee can only update own + limited fields)
router.put('/:id', (req, res, next) =>
  employeeController.updateEmployee(req, res, next)
);

// DELETE /api/employees/:id — Super Admin only (soft delete)
router.delete(
  '/:id',
  checkRole(Role.SUPER_ADMIN),
  (req, res, next) => employeeController.deleteEmployee(req, res, next)
);

// PATCH /api/employees/:id/avatar — Upload profile image (Cloudinary)
router.patch(
  '/:id/avatar',
  uploadProfileImage,
  (req, res, next) => employeeController.uploadProfileImage(req, res, next)
);

// GET /api/employees/:id/reportees — Direct reports (All roles, Employee sees own only)
router.get(
  '/:id/reportees',
  (req, res, next) => organizationController.getDirectReports(req, res, next)
);

// PATCH /api/employees/:id/manager — Assign/remove manager (Super Admin, HR Manager)
router.patch(
  '/:id/manager',
  checkRole(Role.SUPER_ADMIN, Role.HR_MANAGER),
  (req, res, next) => organizationController.assignManager(req, res, next)
);

export default router;
