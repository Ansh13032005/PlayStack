import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../api/axios';
import { useAuthStore } from '../store/authStore';
import {
  Loader2, Eye, EyeOff, ArrowRight,
  Briefcase, CheckCircle, Shield, Zap, Cloud, Users,
} from 'lucide-react';
import { cn } from '../lib/utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const highlights = [
  { icon: Shield, title: 'Secure & Private', desc: 'Enterprise-grade encryption for your data.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Optimized performance for seamless workflows.' },
  { icon: Cloud, title: 'Always Available', desc: 'Cloud-based access from any device.' },
  { icon: Users, title: 'Smart Roles', desc: 'Granular permissions for every team member.' },
];

/** Enterprise standard: one login URL, route by role after authentication. */
function getHomeRoute(role: string): string {
  if (role === 'Employee') return '/profile';
  return '/';
}

export function Login() {
  const navigate = useNavigate();
  const { login, token, user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (token && user) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', data);
      const { employee, accessToken } = response.data.data;

      login(
        {
          userId: employee._id,
          role: employee.role,
          forcePasswordChange: employee.forcePasswordChange ?? false,
        },
        accessToken
      );

      navigate(getHomeRoute(employee.role));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 border border-white/20 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">NexaHR</span>
              <span className="block text-gray-400 text-[10px] uppercase tracking-widest font-medium">Enterprise Suite</span>
            </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-3">
            Manage your <span className="text-emerald-400">workforce</span> smarter.
          </h1>
          <p className="text-gray-400 text-sm xl:text-base leading-relaxed">
            One secure sign-in for your entire organization. Your role determines what you can access — employees, HR, and administrators all use the same login.
          </p>
        </div>

        <div className="relative z-10 flex flex-col gap-3 mt-6">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-emerald-500/30 transition-all duration-300 rounded-2xl p-3.5 flex items-start gap-4"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm mb-0.5">{item.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          NexaHR Enterprise · Secured with 256-bit encryption
        </p>
      </div>

      {/* Right — single login form */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
              <Briefcase className="w-4 h-4 text-gray-700" />
            </div>
            <span className="font-bold text-gray-900">NexaHR</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            All systems operational
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-emerald-600 font-semibold text-sm uppercase tracking-widest mb-2">
                Welcome back
              </p>
              <h1 className="text-2xl font-bold text-gray-900">Sign in to NexaHR</h1>
              <p className="text-sm text-gray-500 mt-2">
                Enter your company email and password. You will be directed to the workspace that matches your role.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={cn(
                    'block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder-gray-400 shadow-sm',
                    'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-shadow',
                    errors.email && 'border-red-300 focus:border-red-500 focus:ring-red-50'
                  )}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={cn(
                      'block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm placeholder-gray-400 shadow-sm',
                      'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-shadow',
                      errors.password && 'border-red-300 focus:border-red-500 focus:ring-red-50'
                    )}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'w-full py-3 px-6 rounded-xl text-sm font-semibold text-white shadow-sm',
                  'bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all duration-200',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">After sign-in</p>
              <ul className="space-y-1.5">
                {[
                  'Employees → Profile, attendance, leaves, payslips',
                  'HR Managers → Dashboard, employees, org chart, payroll',
                  'Administrators → Full system access & audit logs',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-xs text-gray-500">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              NexaHR Enterprise Suite · © {new Date().getFullYear()} · Secured & Encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
