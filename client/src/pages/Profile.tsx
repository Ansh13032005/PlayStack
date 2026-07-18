import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Camera, User, Users, Phone, Mail, Building, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const profileSchema = z.object({
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function Profile() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.userId],
    queryFn: async () => {
      const res = await api.get('/employees/me');
      return res.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { isSubmitting: isSubmittingPassword, errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        phone: profile.phone || '',
      });
    }
  }, [profile, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await api.put(`/employees/${profile._id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      setSuccessMsg('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: Omit<PasswordForm, 'confirmPassword'>) => {
      const res = await api.put('/employees/me/change-password', data);
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg('Password changed successfully!');
      resetPassword();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to change password');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      setIsUploading(true);
      await api.patch(`/employees/${profile._id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSuccessMsg('Profile image updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload image');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-10 text-gray-500">Profile not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-dark-900">My Profile</h1>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {errorMsg}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        {/* Header / Avatar */}
        <div className="bg-primary-600 h-32 relative">
          <div className="absolute -bottom-12 left-8 flex items-end">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
              </label>
            </div>
            <div className="ml-4 mb-2 text-white">
              <h2 className="text-xl font-bold">{profile.firstName} {profile.lastName}</h2>
              <p className="text-sm opacity-90">{profile.designation}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Read Only Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <Mail className="h-4 w-4 mr-2" /> Email
                </label>
                <div className="text-gray-900 font-medium py-2">{profile.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <User className="h-4 w-4 mr-2" /> Employee ID
                </label>
                <div className="text-gray-900 font-medium py-2">{profile.employeeId}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <Building className="h-4 w-4 mr-2" /> Department
                </label>
                <div className="text-gray-900 font-medium py-2">{profile.department || 'Not Assigned'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" /> Role
                </label>
                <div className="text-gray-900 font-medium py-2">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium",
                    profile.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' :
                    profile.role === 'HR Manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  )}>
                    {profile.role}
                  </span>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="md:col-span-2 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Phone className="h-4 w-4 mr-2" /> Phone Number
                </label>
                <input
                  type="text"
                  className="block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Enter your phone number"
                  {...register('phone')}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-gray-100">
              <button
                type="submit"
                disabled={!isDirty || isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              >
                {isSubmitting || updateProfileMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </button>
            </div>
          </form>

          {/* Change Password Section */}
          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6 mt-12 border-t pt-8">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Change Password</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Enter current password"
                  {...registerPassword('currentPassword')}
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Enter new password"
                  {...registerPassword('newPassword')}
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Confirm new password"
                  {...registerPassword('confirmPassword')}
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-gray-100">
              <button
                type="submit"
                disabled={isSubmittingPassword || changePasswordMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
              >
                {isSubmittingPassword || changePasswordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Update Password
              </button>
            </div>
          </form>

          {/* Direct Reports Section */}
          {profile && (
            <DirectReports employeeId={profile._id} />
          )}
        </div>
      </div>
    </div>
  );
}

function DirectReports({ employeeId }: { employeeId: string }) {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['directReports', employeeId],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}/reportees`);
      return res.data.data.directReports || [];
    },
  });

  return (
    <div className="space-y-6 mt-12 border-t pt-8">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
        <Users className="h-5 w-5 mr-2 text-primary-600" />
        Direct Reports
        {!isLoading && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-700 font-semibold">
            {reports.length}
          </span>
        )}
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No direct reports assigned.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reports.map((emp: any) => (
            <div key={emp._id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                {emp.profileImage ? (
                  <img src={emp.profileImage} alt={emp.firstName} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-primary-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{emp.firstName} {emp.lastName}</p>
                <p className="text-xs text-gray-500 truncate">{emp.designation || emp.role}</p>
              </div>
              <span className={`ml-auto shrink-0 px-2 py-0.5 text-xs rounded-full font-medium ${
                emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {emp.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
