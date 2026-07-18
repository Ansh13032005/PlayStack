import mongoose from 'mongoose';
import { ENV } from './config/env';
import { Employee, Role, Status } from './models/Employee';
import bcrypt from 'bcrypt';

async function seed() {
  await mongoose.connect(ENV.MONGO_URI);

  const employees = await Employee.find({});
  if (employees.length > 0) {
    console.log('--- FOUND EXISTING EMPLOYEES ---');
    for (const emp of employees) {
      console.log(`Email: ${emp.email}, Role: ${emp.role}`);
    }
    // Update password for the first super admin to a known one if needed
    const superAdmin = employees.find(e => e.role === Role.SUPER_ADMIN);
    if (superAdmin) {
      superAdmin.password = 'Admin123!';
      await superAdmin.save();
      console.log(`\nPassword for ${superAdmin.email} has been reset to: Admin123!`);
    } else {
      console.log("No super admin found, please check logs.");
    }
  } else {
    console.log('--- CREATING DEFAULT SUPER ADMIN ---');
    const admin = new Employee({
      employeeId: 'EMP-001',
      firstName: 'Super',
      lastName: 'Admin',
      email: '22IT433@bvmengineering.ac.in',
      password: 'admin@123',
      role: Role.SUPER_ADMIN,
      status: Status.ACTIVE,
    });
    await admin.save();
    console.log('Created default admin: admin@enterprise.com / Admin123!');
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed();
