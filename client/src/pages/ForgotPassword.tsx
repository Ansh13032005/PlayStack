import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../api/axios';
import { Loader2, ArrowLeft, CheckCircle2, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';

const emailSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
});

type EmailForm = z.infer<typeof emailSchema>;
type OTPForm = z.infer<typeof otpSchema>;

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'SUCCESS'>('EMAIL');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [expiryTimer, setExpiryTimer] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (step === 'OTP' && expiryTimer > 0) {
      timer = setInterval(() => setExpiryTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [expiryTimer, step]);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm<OTPForm>({ resolver: zodResolver(otpSchema) });

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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-10 bg-gradient-to-br from-emerald-600 to-teal-700" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-center shadow-sm">
            <Briefcase className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          Reset your password
        </h2>
        <p className="mt-4 text-center text-sm text-gray-600">
          {step === 'EMAIL' && "Enter your company email and we'll send you a 6-digit OTP."}
          {step === 'OTP' && `Enter the OTP sent to ${email} and your new password.`}
          {step === 'SUCCESS' && 'Your password has been successfully reset.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-8 border border-gray-100 sm:rounded-2xl shadow-lg">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 mb-4 border border-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset Successful</h3>
              <p className="text-sm text-gray-500 mb-8">You can now sign in with your new password.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
              >
                Return to sign in
              </button>
            </div>
          )}

          {step === 'EMAIL' && (
            <form className="space-y-6" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={cn(
                    'block w-full rounded-xl border border-gray-200 px-4 py-3 placeholder-gray-400 shadow-sm',
                    'focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500',
                    emailForm.formState.errors.email && 'border-red-300'
                  )}
                  {...emailForm.register('email')}
                />
                {emailForm.formState.errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={emailForm.formState.isSubmitting}
                className="flex w-full justify-center items-center rounded-xl py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-70"
              >
                {emailForm.formState.isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
              </button>
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
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="••••••"
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                  {...otpForm.register('otp')}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                  {...otpForm.register('password')}
                />
                {otpForm.formState.errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{otpForm.formState.errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={otpForm.formState.isSubmitting || expiryTimer === 0}
                className="flex w-full justify-center items-center rounded-xl py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70"
              >
                {otpForm.formState.isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={handleResendOTP}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {step !== 'SUCCESS' && (
            <div className="text-center mt-8 pt-6 border-t border-gray-100">
              <Link to="/login" className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
