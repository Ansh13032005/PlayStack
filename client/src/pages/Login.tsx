import { useState } from 'react';
import { useNavigate, Navigate, Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../api/axios';
import { useAuthStore } from '../store/authStore';
import {
  Loader2, Eye, EyeOff, ArrowLeft, ArrowRight,
  Users, Shield, Briefcase, CheckCircle, Building2,
  BarChart3, Clock, Globe, Zap, Cloud
} from 'lucide-react';
import { cn } from '../lib/utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const roleParamToExpectedRole: Record<string, string> = {
  employee: 'Employee',
  hr: 'HR Manager',
  admin: 'Super Admin',
};

const portals = [
  {
    key: 'employee',
    title: 'Employee Portal',
    subtitle: 'For team members',
    description: 'Access your profile, payslips, leave requests, attendance records, and messages.',
    icon: Users,
    gradient: 'from-slate-700 to-slate-900',
    accent: 'border-slate-600',
    pill: 'bg-slate-100 text-slate-700',
    btn: 'bg-slate-800 hover:bg-slate-900',
    ring: 'ring-slate-200',
    features: ['Personal Profile', 'Leave Management', 'Attendance Tracker'],
  },
  {
    key: 'hr',
    title: 'HR Management',
    subtitle: 'For HR teams',
    description: 'Onboard employees, manage departments, review leave requests, and build org charts.',
    icon: Building2,
    gradient: 'from-emerald-600 to-teal-700',
    accent: 'border-emerald-400',
    pill: 'bg-emerald-50 text-emerald-700',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    ring: 'ring-emerald-200',
    features: ['Employee Directory', 'Org Chart', 'Leave Approvals'],
    recommended: true,
  },
  {
    key: 'admin',
    title: 'System Admin',
    subtitle: 'For administrators',
    description: 'Full platform control — manage roles, system config, security, and analytics.',
    icon: Shield,
    gradient: 'from-blue-600 to-cyan-700',
    accent: 'border-blue-400',
    pill: 'bg-blue-50 text-blue-700',
    btn: 'bg-blue-600 hover:bg-blue-700',
    ring: 'ring-blue-200',
    features: ['Role Management', 'System Config', 'Full Access'],
  },
];

const highlights = [
  { icon: Shield, title: 'Secure & Private', desc: 'Enterprise-grade encryption for your data.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Optimized performance for seamless workflows.' },
  { icon: Cloud, title: 'Always Available', desc: 'Cloud-based access from any device.' },
  { icon: Users, title: 'Smart Roles', desc: 'Granular permissions for every team member.' },
];

// ── Portal Selection Screen ─────────────────────────────────────────────────
function PortalSelection() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
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
            The all-in-one HR platform for modern organizations — from hiring to retirement, we've got every touchpoint covered.
          </p>
        </div>

        {/* Highlights */}
        <div className="relative z-10 flex flex-col gap-3 mt-6">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="group bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-emerald-500/30 transition-all duration-300 rounded-2xl p-3.5 flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
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
      </div>

      {/* Right Panel — Portal Cards */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        {/* Top bar */}
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

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-8 py-12 max-w-5xl mx-auto w-full">
          <div className="mb-10">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-widest mb-2">Welcome to NexaHR</p>
            <h2 className="text-3xl font-bold text-gray-900">Select your portal</h2>
            <p className="text-gray-500 mt-2">Choose the portal that matches your role to get started.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.key}
                  to={`/login/${portal.key}`}
                  className={cn(
                    "group relative bg-white rounded-2xl border border-gray-200 shadow-sm",
                    "hover:shadow-xl hover:border-transparent hover:-translate-y-1",
                    "transition-all duration-300 overflow-hidden flex flex-col"
                  )}
                >
                  {portal.recommended && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Popular
                    </div>
                  )}

                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${portal.gradient} p-6 flex items-center justify-between`}>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit mb-3", portal.pill)}>
                      {portal.subtitle}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{portal.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{portal.description}</p>

                    {/* Features */}
                    <div className="space-y-1.5 mt-auto">
                      {portal.features.map(f => (
                        <div key={f} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-xs text-gray-600">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom CTA */}
                  <div className={`mx-5 mb-5 py-2.5 px-4 rounded-xl text-white text-sm font-semibold text-center ${portal.btn} transition-colors`}>
                    Sign in →
                  </div>
                </Link>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            NexaHR Enterprise Suite · © {new Date().getFullYear()} · Secured & Encrypted
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Login Form Screen ───────────────────────────────────────────────────────
export function Login() {
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();
  const { login, token } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (token) return <Navigate to="/" replace />;

  if (!role || !portals.find(p => p.key === role)) return <PortalSelection />;

  const portal = portals.find(p => p.key === role)!;
  const Icon = portal.icon;

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', data);
      const { employee, accessToken } = response.data.data;

      const expectedRole = roleParamToExpectedRole[role];
      if (expectedRole && employee.role !== expectedRole) {
        setError(`Unauthorized for this portal. Your role is "${employee.role}", but this is the "${expectedRole}" portal.`);
        return;
      }

      login(employee, accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className={`hidden lg:flex w-[420px] shrink-0 bg-gradient-to-br ${portal.gradient} flex-col justify-between p-12 relative overflow-hidden`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-16 w-64 h-64 bg-black/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 border border-white/20 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">NexaHR</span>
              <span className="block text-white/60 text-[10px] uppercase tracking-widest font-medium">Enterprise Suite</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
            <Icon className="w-10 h-10 text-white mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{portal.title}</h2>
            <p className="text-white/70 text-sm leading-relaxed">{portal.description}</p>
          </div>

          <div className="space-y-3">
            {portal.features.map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          NexaHR Enterprise · Secured with 256-bit encryption
        </p>
      </div>

      {/* Right login form */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Portals
          </Link>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            All systems operational
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                <Briefcase className="w-4 h-4 text-gray-700" />
              </div>
              <span className="font-bold text-gray-900">NexaHR</span>
            </div>

            <div className="mb-8">
              <span className={cn("text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full", portal.pill)}>
                {portal.subtitle}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-4">Sign in to {portal.title}</h1>
              <p className="text-sm text-gray-500 mt-1">Enter your credentials to access the platform.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
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
                    "block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder-gray-400 shadow-sm",
                    "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-shadow",
                    errors.email && "border-red-300 focus:border-red-500 focus:ring-red-50"
                  )}
                  {...register('email')}
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
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
                      "block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm placeholder-gray-400 shadow-sm",
                      "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-shadow",
                      errors.password && "border-red-300 focus:border-red-500 focus:ring-red-50"
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
                {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <div className="flex justify-end">
                <Link to={`/forgot-password/${role}`} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full py-3 px-6 rounded-xl text-sm font-semibold text-white shadow-sm",
                  "flex items-center justify-center gap-2 transition-all duration-200",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                  portal.btn
                )}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign in to {portal.title} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-8">
              Protected by NexaHR Security · 256-bit TLS encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
