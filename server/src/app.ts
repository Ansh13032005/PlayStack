import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './modules/auth/routes/auth.routes';
import employeeRoutes from './modules/employee/routes/employee.routes';
import departmentRoutes from './modules/department/routes/department.routes';
import organizationRoutes from './modules/organization/routes/organization.routes';
import dashboardRoutes from './modules/dashboard/routes/dashboard.routes';
import attendanceRoutes from './modules/attendance/routes/attendance.routes';
import leaveRoutes from './modules/leave/routes/leave.routes';
import messageRoutes from './modules/message/routes/message.routes';
import notificationRoutes from './modules/notification/routes/notification.routes';
import auditRoutes from './modules/audit/routes/audit.routes';
import payrollRoutes from './modules/payroll/routes/payroll.routes';

const app = express();

// Middlewares
app.use(helmet()); // Security headers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running', version: 'v1' });
});

// v1 API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/payroll', payrollRoutes);

// Error Middleware
app.use(errorHandler);

export default app;
