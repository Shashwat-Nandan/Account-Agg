'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/otp/request', { phone: `+91${phone}` });
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{
        accessToken: string;
        user: { id: string; phone: string; email: string | null; kycStatus: string };
      }>('/auth/otp/verify', { phone: `+91${phone}`, otp });
      setAuth(res.user, res.accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary-700 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Account Aggregator</h1>
            <p className="text-gray-500 mt-1">Privacy-first financial data sharing</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit number"
                  className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={otpSent}
                />
              </div>
            </div>

            {otpSent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={otpSent ? verifyOtp : requestOtp}
              disabled={loading || (!otpSent && phone.length !== 10) || (otpSent && otp.length !== 6)}
              className="w-full bg-primary-700 text-white py-2.5 rounded-lg font-medium hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Please wait...' : otpSent ? 'Verify OTP' : 'Request OTP'}
            </button>

            {otpSent && (
              <button
                onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Change phone number
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
