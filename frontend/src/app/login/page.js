'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ email, password });
      toast.success(`Welcome back, ${res?.data?.user?.full_name || 'Admin'}!`);
      // AuthContext automatically redirects to '/'
    } catch (err) {
      const msg = err.message || 'Invalid email or password. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fe] flex flex-col font-sans text-[#525f7f]">
      {/* Top Banner Header: OJT bg-gradient-primary */}
      <div className="bg-gradient-to-r from-[#4689C8] to-[#120ab3] pt-10 pb-28 sm:pt-14 sm:pb-32 text-center text-white px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
            Welcome!
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm font-normal">
            Please Login to Access your Account.
          </p>
        </div>
      </div>

      {/* Main Content Card with Negative Margin Overlap (-mt-20 sm:-mt-24) */}
      <div className="flex-1 -mt-20 sm:-mt-24 px-4 pb-12 flex flex-col items-center justify-start">
        <div className="w-full max-w-[450px] bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Card Header with Hertzsoft Official Logo & Title */}
          <div className="pt-7 pb-4 px-6 sm:px-8 text-center border-b border-slate-100/90 bg-white">
            <div className="flex justify-center mb-3">
              <Image
                src="/logo.svg"
                alt="Hertzsoft Technologies"
                width={260}
                height={68}
                className="h-12 sm:h-13 w-auto object-contain"
                priority
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight">
              Login
            </h2>
            <p className="text-[11px] font-semibold text-[#8898aa] uppercase tracking-wider mt-1">
              Centralized ERP & Operations Portal
            </p>
          </div>

          {/* Card Body & Login Form */}
          <div className="p-6 sm:p-7">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address Field with OJT input-group-alternative style */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#525f7f] mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-xs transition-all focus-within:shadow-md border border-slate-200 focus-within:border-[#4689C8] focus-within:ring-2 focus-within:ring-[#4689C8]/20 bg-white overflow-hidden">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8898aa]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@hertzsoft.com"
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 text-sm text-[#32325d] bg-transparent outline-none placeholder-[#adb5bd] font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#525f7f]">
                    Password
                  </label>
                  <span className="text-xs text-[#8898aa] hover:text-[#4689C8] transition-colors cursor-pointer font-medium">
                    Forgot password?
                  </span>
                </div>
                <div className="relative rounded-lg shadow-xs transition-all focus-within:shadow-md border border-slate-200 focus-within:border-[#4689C8] focus-within:ring-2 focus-within:ring-[#4689C8]/20 bg-white overflow-hidden">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8898aa]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 text-sm text-[#32325d] bg-transparent outline-none placeholder-[#adb5bd] font-medium"
                  />
                </div>
              </div>

              {/* Submit Button: OJT btn-primary (#4689C8) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 sm:py-3 px-4 rounded-lg text-white font-bold text-xs sm:text-sm uppercase tracking-wider bg-[#4689C8] hover:bg-[#3876b0] shadow-md shadow-[#4689C8]/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Copyright: Exactly as OJT footer */}
        <div className="mt-8 text-center text-xs text-[#8898aa]">
          <p>
            &copy; 2026 | All rights reserved | Designed & Developed by{' '}
            <a
              href="https://www.hertzsoft.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#4689C8] font-semibold hover:underline"
            >
              Hertzsoft
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
