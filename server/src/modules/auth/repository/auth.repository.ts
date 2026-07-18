import { Employee, IEmployee } from '../../../models/Employee';

export class AuthRepository {
  async findByEmail(email: string): Promise<IEmployee | null> {
    return Employee.findOne({ email, isDeleted: false }).select('+password');
  }

  async findById(id: string): Promise<IEmployee | null> {
    return Employee.findOne({ _id: id, isDeleted: false });
  }

  async findByResetTokenAndEmail(token: string, email: string): Promise<IEmployee | null> {
    return Employee.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
      isDeleted: false,
    });
  }
}

export const authRepository = new AuthRepository();
