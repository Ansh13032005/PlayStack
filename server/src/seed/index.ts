import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { Employee, Status } from '../models/Employee';
import { Department } from '../models/Department';
import { Attendance } from '../models/Attendance';
import { Leave } from '../models/Leave';
import { Payroll } from '../models/Payroll';
import { Message } from '../models/Message';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import {
  ADMIN_PASSWORD,
  DEFAULT_PASSWORD,
  DEPARTMENTS,
  EMPLOYEES,
  LEAVE_SEEDS,
  MESSAGE_SEEDS,
  NOTIFICATION_SEEDS,
  AttendanceStatus,
  PayrollStatus,
  AuditAction,
} from './data';

type EmployeeMap = Map<string, mongoose.Types.ObjectId>;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(start: Date, end: Date): number {
  const ms = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
}

async function clearDatabase() {
  await Promise.all([
    AuditLog.deleteMany({}),
    Notification.deleteMany({}),
    Message.deleteMany({}),
    Payroll.deleteMany({}),
    Leave.deleteMany({}),
    Attendance.deleteMany({}),
    Employee.deleteMany({}),
    Department.deleteMany({}),
  ]);
}

async function seedDepartments(): Promise<void> {
  for (const dept of DEPARTMENTS) {
    await Department.create(dept);
  }
  console.log(`  ✓ ${DEPARTMENTS.length} departments`);
}

async function seedEmployees(): Promise<EmployeeMap> {
  const employeeMap: EmployeeMap = new Map();

  for (const def of EMPLOYEES) {
    const password = def.key === 'admin' ? ADMIN_PASSWORD : DEFAULT_PASSWORD;
    const employee = await Employee.create({
      employeeId: def.employeeId,
      firstName: def.firstName,
      lastName: def.lastName,
      email: def.email,
      password,
      phone: def.phone,
      department: def.department,
      designation: def.designation,
      salary: def.salary,
      role: def.role,
      status: def.status,
      joiningDate: new Date(def.joiningDate),
      profileImage: def.profileImage,
      loginAttempts: 0,
      forcePasswordChange: false,
    });
    employeeMap.set(def.key, employee._id);
  }

  for (const def of EMPLOYEES) {
    if (!def.managerKey) continue;
    const employeeId = employeeMap.get(def.key);
    const managerId = employeeMap.get(def.managerKey);
    if (employeeId && managerId) {
      await Employee.findByIdAndUpdate(employeeId, { reportingManager: managerId });
    }
  }

  const headAssignments: Record<string, string> = {
    Engineering: 'eng_head',
    'Human Resources': 'hr',
    Sales: 'sales_head',
    Marketing: 'marketing_head',
    Finance: 'finance_head',
  };

  for (const [deptName, headKey] of Object.entries(headAssignments)) {
    const headId = employeeMap.get(headKey);
    if (headId) {
      await Department.findOneAndUpdate({ name: deptName }, { headOfDepartment: headId });
    }
  }

  console.log(`  ✓ ${EMPLOYEES.length} employees (with org hierarchy)`);
  return employeeMap;
}

async function seedAttendance(employeeMap: EmployeeMap): Promise<void> {
  const today = startOfDay(new Date());
  let count = 0;
  const statuses = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.HALF_DAY,
  ];

  for (const def of EMPLOYEES) {
    if (def.status !== Status.ACTIVE || def.salary === 0) continue;
    const employeeId = employeeMap.get(def.key);
    if (!employeeId) continue;

    for (let dayOffset = -29; dayOffset <= 0; dayOffset++) {
      const date = startOfDay(addDays(today, dayOffset));
      if (date.getDay() === 0) continue; // skip Sundays

      const status = statuses[(dayOffset + 29) % statuses.length];
      const clockIn = new Date(date);
      clockIn.setHours(status === AttendanceStatus.LATE ? 10 : 9, 15, 0, 0);

      const clockOut = new Date(date);
      clockOut.setHours(status === AttendanceStatus.HALF_DAY ? 13 : 18, 0, 0, 0);

      const totalHours =
        status === AttendanceStatus.HALF_DAY
          ? 3.5
          : status === AttendanceStatus.LATE
            ? 7.5
            : 8.5;

      await Attendance.create({
        employee: employeeId,
        date,
        clockIn,
        clockOut,
        totalHours,
        status,
      });
      count++;
    }
  }

  console.log(`  ✓ ${count} attendance records (last 30 weekdays)`);
}

async function seedLeaves(employeeMap: EmployeeMap): Promise<void> {
  const today = startOfDay(new Date());

  for (const seed of LEAVE_SEEDS) {
    const employeeId = employeeMap.get(seed.employeeKey);
    if (!employeeId) continue;

    const startDate = startOfDay(addDays(today, seed.startOffsetDays));
    const endDate = startOfDay(addDays(today, seed.endOffsetDays));
    const totalDays = daysBetween(startDate, endDate);

    await Leave.create({
      employee: employeeId,
      leaveType: seed.leaveType,
      startDate,
      endDate,
      totalDays,
      reason: seed.reason,
      status: seed.status,
      reviewedBy: seed.reviewerKey ? employeeMap.get(seed.reviewerKey) : undefined,
      reviewNote: seed.reviewNote,
    });
  }

  console.log(`  ✓ ${LEAVE_SEEDS.length} leave requests`);
}

async function seedPayroll(employeeMap: EmployeeMap): Promise<void> {
  const now = new Date();
  const months = [
    { month: now.getMonth() === 0 ? 12 : now.getMonth(), year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear() },
    { month: now.getMonth() + 1, year: now.getFullYear() },
  ];

  let count = 0;
  for (const { month, year } of months) {
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    for (const def of EMPLOYEES) {
      if (def.status !== Status.ACTIVE || !def.salary || def.salary <= 0) continue;
      const employeeId = employeeMap.get(def.key);
      if (!employeeId) continue;

      const perDaySalary = def.salary / totalDaysInMonth;
      const unpaidLeaveDays = def.key === 'accountant' && month === months[0].month ? 2 : 0;
      const halfDays = def.key === 'senior_dev_1' ? 1 : 0;
      const totalDeductionDays = unpaidLeaveDays + halfDays * 0.5;
      const deductionAmount = totalDeductionDays * perDaySalary;
      const netPay = Math.max(0, def.salary - deductionAmount);

      const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

      await Payroll.create({
        employee: employeeId,
        month,
        year,
        baseSalary: def.salary,
        perDaySalary,
        totalDaysInMonth,
        unpaidLeaveDays,
        halfDays,
        lateDays: def.key === 'junior_dev' ? 2 : 0,
        totalDeductionDays,
        deductionAmount,
        netPay,
        status: isCurrentMonth ? PayrollStatus.DRAFT : PayrollStatus.PAID,
        processedBy: employeeMap.get('hr'),
      });
      count++;
    }
  }

  console.log(`  ✓ ${count} payroll records`);
}

async function seedMessages(employeeMap: EmployeeMap): Promise<void> {
  for (const msg of MESSAGE_SEEDS) {
    const sender = employeeMap.get(msg.senderKey);
    const recipient = employeeMap.get(msg.recipientKey);
    if (!sender || !recipient) continue;

    await Message.create({
      sender,
      recipient,
      subject: msg.subject,
      content: msg.content,
      isRead: msg.isRead,
      attachments: [],
    });
  }

  console.log(`  ✓ ${MESSAGE_SEEDS.length} messages`);
}

async function seedNotifications(employeeMap: EmployeeMap): Promise<void> {
  for (const n of NOTIFICATION_SEEDS) {
    const recipient = employeeMap.get(n.recipientKey);
    if (!recipient) continue;

    await Notification.create({
      recipient,
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link,
      isRead: n.isRead,
    });
  }

  console.log(`  ✓ ${NOTIFICATION_SEEDS.length} notifications`);
}

async function seedAuditLogs(employeeMap: EmployeeMap): Promise<void> {
  const adminId = employeeMap.get('admin');
  const hrId = employeeMap.get('hr');
  if (!adminId || !hrId) return;

  const logs = [
    { user: adminId, action: AuditAction.LOGIN, resource: 'Auth', details: 'Super Admin logged in' },
    { user: hrId, action: AuditAction.LOGIN, resource: 'Auth', details: 'HR Manager logged in' },
    { user: adminId, action: AuditAction.CREATE, resource: 'Employee', details: 'Created employee Amit Verma', resourceId: employeeMap.get('junior_dev')?.toString() },
    { user: hrId, action: AuditAction.UPDATE, resource: 'Leave', details: 'Approved leave for Divya Nair' },
    { user: adminId, action: AuditAction.UPDATE, resource: 'Employee', details: 'Updated employee profile for Rohan Kapoor' },
    { user: hrId, action: AuditAction.OTHER, resource: 'Payroll', details: 'Generated March payroll batch' },
  ];

  for (const log of logs) {
    await AuditLog.create(log);
  }

  console.log(`  ✓ ${logs.length} audit log entries`);
}

function printLoginCredentials() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  DEMO LOGIN CREDENTIALS (for screenshots)');
  console.log('══════════════════════════════════════════════════════════');
  console.log('  Super Admin : admin@company.com     / Admin@123');
  console.log('  HR Manager  : hr@company.com        / Password123!');
  console.log('  Employee    : amit.verma@company.com / Password123!');
  console.log('──────────────────────────────────────────────────────────');
  console.log('  All other employees use password: Password123!');
  console.log('══════════════════════════════════════════════════════════\n');
}

function printSummary() {
  console.log('Screenshots tip:');
  console.log('  • Login as admin@company.com → Dashboard + Org Chart');
  console.log('  • Login as hr@company.com → Leaves (pending requests) + Payroll');
  console.log('  • Login as amit.verma@company.com → Employee self-service view');
}

async function runSeed(reset: boolean) {
  console.log('\n🌱 EMS Demo Data Seeder\n');

  if (ENV.NODE_ENV === 'production' && reset) {
    console.error('❌ Refusing to reset database in production.');
    process.exit(1);
  }

  await mongoose.connect(ENV.MONGO_URI);
  console.log(`Connected to MongoDB\n`);

  if (reset) {
    console.log('Clearing existing data...');
    await clearDatabase();
    console.log('  ✓ Database cleared\n');
  } else {
    const existing = await Employee.countDocuments();
    if (existing > 0) {
      console.log(`⚠️  Found ${existing} existing employees.`);
      console.log('   Run with --reset to wipe and reseed:\n');
      console.log('   npm run seed:reset\n');
      await mongoose.disconnect();
      process.exit(0);
    }
  }

  console.log('Seeding demo data...');
  await seedDepartments();
  const employeeMap = await seedEmployees();
  await seedAttendance(employeeMap);
  await seedLeaves(employeeMap);
  await seedPayroll(employeeMap);
  await seedMessages(employeeMap);
  await seedNotifications(employeeMap);
  await seedAuditLogs(employeeMap);

  console.log('\n✅ Demo data seeded successfully!');
  printLoginCredentials();
  printSummary();

  await mongoose.disconnect();
  process.exit(0);
}

const reset = process.argv.includes('--reset');
runSeed(reset).catch(async (err) => {
  console.error('❌ Seed failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
