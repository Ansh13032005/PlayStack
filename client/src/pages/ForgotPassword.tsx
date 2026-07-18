import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../api/axios';
import { Loader2, ArrowLeft, CheckCircle2, Users, Building2, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

const emailSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type EmailForm = z.infer<typeof emailSchema>;
type OTPForm = z.infer<typeof otpSchema>;

const portals = [
  {
    key: 'employee',
    title: 'Employee Portal',
    icon: Users,
    gradient: 'from-slate-700 to-slate-900',
    accent: 'border-slate-600',
    pill: 'bg-slate-100 text-slate-700',
    btn: 'bg-slate-800 hover:bg-slate-900',
    ring: 'ring-slate-200',
    text: 'text-slate-600',
    iconBg: 'bg-slate-50',
    iconBorder: 'border-slate-200',
    btnLink: 'text-slate-600 hover:text-slate-700',
  },
  {
    key: 'hr',
    title: 'HR Management',
    icon: Building2,
    gradient: 'from-emerald-600 to-teal-700',
    accent: 'border-emerald-400',
    pill: 'bg-emerald-50 text-emerald-700',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    ring: 'ring-emerald-200',
    text: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    iconBorder: 'border-emerald-200',
    btnLink: 'text-emerald-600 hover:text-emerald-700',
  },
  {
    key: 'admin',
    title: 'System Admin',
    icon: Shield,
    gradient: 'from-blue-600 to-cyan-700',
    accent: 'border-blue-400',
    pill: 'bg-blue-50 text-blue-700',
    btn: 'bg-blue-600 hover:bg-blue-700',
    ring: 'ring-blue-200',
    text: 'text-blue-600',
    iconBg: 'bg-blue-50',
    iconBorder: 'border-blue-200',
    btnLink: 'text-blue-600 hover:text-blue-700',
  },
];

export function ForgotPassword() {
  const navigate = useNavigate();
  const { role } = useParams<{ role: string }>();
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'SUCCESS'>('EMAIL');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [expiryTimer, setExpiryTimer] = useState(0);

  // Default to employee if role is not provided or invalid
  const portal = portals.find(p => p.key === role) || portals[0];
  const Icon = portal.icon;

  useEffect(() => {
    let timer: any;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && expiryTimer > 0) {
      timer = setInterval(() => {
        setExpiryTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [expiryTimer, step]);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
  });

  const onEmailSubmit = async (data: EmailForm) => {
    try {
      setError(null);
      await api.post('/auth/forgot-password', data);
      setEmail(data.email);
      setStep('OTP');
      setResendTimer(60);
      setExpiryTimer(10 * 60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    try {
      setError(null);
      await api.post('/auth/forgot-password', { email });
      setResendTimer(60);
      setExpiryTimer(10 * 60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    }
  };

  const onOTPSubmit = async (data: OTPForm) => {
    try {
      setError(null);
      await api.post('/auth/reset-password', {
        email,
        otp: data.otp,
        password: data.password,
      });
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Check your OTP.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration matching portal */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-10 bg-gradient-to-br ${portal.gradient}`} />
        <div className={`absolute top-1/2 right-0 w-80 h-80 rounded-full blur-3xl opacity-5 bg-gradient-to-br ${portal.gradient}`} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className={cn("h-16 w-16 rounded-xl border flex items-center justify-center shadow-sm", portal.iconBg, portal.iconBorder)}>
            <Icon className={cn("w-8 h-8", portal.text)} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          Reset your password
        </h2>
        <div className="flex justify-center mt-2">
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit", portal.pill)}>
            {portal.title}
          </span>
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          {step === 'EMAIL' && "Enter your email and we'll send you a 6-digit OTP."}
          {step === 'OTP' && `Enter the OTP sent to ${email} and your new password.`}
          {step === 'SUCCESS' && "Your password has been successfully reset."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-8 border border-gray-100 sm:rounded-2xl shadow-lg">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              {error}
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 mb-4 border border-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset Successful</h3>
              <p className="text-sm text-gray-500 mb-8">
                You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate(`/login/${role || 'employee'}`)}
                className={cn(
                  "w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-white shadow-sm transition-all",
                  portal.btn
                )}
              >
                Return to login
              </button>
            </div>
          )}

          {step === 'EMAIL' && (
            <form className="space-y-6" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className={cn(
                      "block w-full appearance-none rounded-xl border border-gray-200 px-4 py-3 placeholder-gray-400 shadow-sm",
                      "focus:outline-none focus:ring-2 transition-shadow",
                      portal.ring,
                      emailForm.formState.errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-50" : "focus:border-transparent"
                    )}
                    {...emailForm.register('email')}
                  />
                  {emailForm.formState.errors.email && (
                    <p className="mt-1.5 text-xs text-red-600">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={emailForm.formState.isSubmitting}
                  className={cn(
                    "flex w-full justify-center items-center rounded-xl py-3 px-4 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed",
                    portal.btn
                  )}
                >
                  {emailForm.formState.isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'OTP' && (
            <form className="space-y-6" onSubmit={otpForm.handleSubmit(onOTPSubmit)}>
              {expiryTimer === 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
                  OTP has expired. Please request a new one.
                </div>
              )}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1.5">
                  6-Digit OTP
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="••••••"
                    className={cn(
                      "block w-full appearance-none rounded-xl border border-gray-200 px-4 py-3 placeholder-gray-300 shadow-sm text-center text-2xl tracking-[0.5em] font-mono",
                      "focus:outline-none focus:ring-2 transition-shadow",
                      portal.ring,
                      otpForm.formState.errors.otp ? "border-red-300 focus:border-red-500 focus:ring-red-50" : "focus:border-transparent"
                    )}
                    {...otpForm.register('otp')}
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="mt-1.5 text-xs text-red-600 text-center">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    className={cn(
                      "block w-full appearance-none rounded-xl border border-gray-200 px-4 py-3 placeholder-gray-400 shadow-sm",
                      "focus:outline-none focus:ring-2 transition-shadow",
                      portal.ring,
                      otpForm.formState.errors.password ? "border-red-300 focus:border-red-500 focus:ring-red-50" : "focus:border-transparent"
                    )}
                    {...otpForm.register('password')}
                  />
                  {otpForm.formState.errors.password && (
                    <p className="mt-1.5 text-xs text-red-600">{otpForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={otpForm.formState.isSubmitting || expiryTimer === 0}
                  className={cn(
                    "flex w-full justify-center items-center rounded-xl py-3 px-4 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed",
                    portal.btn
                  )}
                >
                  {otpForm.formState.isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={handleResendOTP}
                  className={cn(
                    "text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    portal.btnLink
                  )}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
                <div className="mt-2 text-xs text-gray-400">
                  {expiryTimer > 0 ? `OTP expires in ${Math.floor(expiryTimer / 60)}:${(expiryTimer % 60).toString().padStart(2, '0')}` : 'OTP expired'}
                </div>
              </div>
            </form>
          )}

          {step !== 'SUCCESS' && (
            <div className="text-center mt-8 pt-6 border-t border-gray-100">
              <Link to={`/login/${role || 'employee'}`} className={cn(
                "inline-flex items-center text-sm font-medium transition-colors",
                portal.btnLink
              )}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
