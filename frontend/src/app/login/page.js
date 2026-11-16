'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Mail, Lock, AlertCircle, Loader2, ArrowRight, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { isDark, toggleTheme, mounted } = useTheme();
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
    <div className="min-h-screen bg-[#F4F8FC] dark:bg-[#0B132B] flex flex-col font-sans text-[#19324D] dark:text-[#F8FAFC] transition-colors duration-150">
      {/* Top Banner Header: Primary Blue to Secondary Cyan Gradient */}
      <div className="relative bg-gradient-to-r from-[#3475B2] via-[#4689C8] to-[#5FC8D6] dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] pt-10 pb-28 sm:pt-14 sm:pb-32 text-center text-white px-4">
        {/* Theme Toggle Button in top right */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            type="button"
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {mounted && isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
            Welcome!
          </h1>
          <p className="text-[#E8F8FA] dark:text-[#94A3B8] text-xs sm:text-sm font-normal">
            Please Login to Access your Account.
          </p>
        </div>
      </div>

      {/* Main Content Card with Negative Margin Overlap (-mt-20 sm:-mt-24) */}
      <div className="flex-1 -mt-20 sm:-mt-24 px-4 pb-12 flex flex-col items-center justify-start">
        <div className="w-full max-w-[450px] bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-[#DFEAF2] dark:border-[#334155] overflow-hidden">
          {/* Card Header with Hertzsoft Official Logo & Title */}
          <div className="pt-7 pb-4 px-6 sm:px-8 text-center border-b border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#1E293B]">
            <div className="flex justify-center mb-3">
              <div className="dark:bg-white/10 dark:px-3 dark:py-1.5 dark:rounded-lg">
                <Image
                  src="/logo.svg"
                  alt="Hertzsoft Technologies"
                  width={260}
                  height={68}
                  className="h-12 sm:h-13 w-auto object-contain"
                  priority
                />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#19324D] dark:text-[#F8FAFC] tracking-tight">
              Login
            </h2>
            <p className="text-[11px] font-semibold text-[#71869B] dark:text-[#94A3B8] uppercase tracking-wider mt-1">
              Centralized ERP & Operations Portal
            </p>
          </div>

          {/* Card Body & Login Form */}
          <div className="p-6 sm:p-7">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-[#FDF2F2] dark:bg-red-950/40 border border-[#F5365C]/30 text-[#F5365C] dark:text-red-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#F5365C]" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#19324D] dark:text-[#F8FAFC] mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-xs transition-all focus-within:shadow-md border border-[#DFEAF2] dark:border-[#334155] focus-within:border-[#4689C8] focus-within:ring-2 focus-within:ring-[#5FC8D6]/20 bg-white dark:bg-[#0F172A] overflow-hidden">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71869B] dark:text-[#64748B]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@hertzsoft.com"
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 text-sm text-[#19324D] dark:text-[#F8FAFC] bg-transparent outline-none placeholder-[#71869B] dark:placeholder-[#64748B] font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#19324D] dark:text-[#F8FAFC]">
                    Password
                  </label>
                  <span className="text-xs text-[#71869B] dark:text-[#94A3B8] hover:text-[#4689C8] dark:hover:text-[#5FC8D6] transition-colors cursor-pointer font-medium">
                    Forgot password?
                  </span>
                </div>
                <div className="relative rounded-lg shadow-xs transition-all focus-within:shadow-md border border-[#DFEAF2] dark:border-[#334155] focus-within:border-[#4689C8] focus-within:ring-2 focus-within:ring-[#5FC8D6]/20 bg-white dark:bg-[#0F172A] overflow-hidden">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71869B] dark:text-[#64748B]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 text-sm text-[#19324D] dark:text-[#F8FAFC] bg-transparent outline-none placeholder-[#71869B] dark:placeholder-[#64748B] font-medium"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 sm:py-3 px-4 rounded-lg text-white font-bold text-xs sm:text-sm uppercase tracking-wider bg-[#4689C8] hover:bg-[#3475B2] shadow-md shadow-[#4689C8]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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

        {/* Footer Copyright */}
        <div className="mt-8 text-center text-xs text-[#71869B]">
          <p>
            &copy; 2026 | All rights reserved | Designed & Developed by{' '}
            <a
              href="https://www.hertzsoft.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#4689C8] font-semibold hover:text-[#3475B2] hover:underline"
            >
              Hertzsoft
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
