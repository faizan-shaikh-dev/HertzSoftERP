'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  // 1. Display loading state while session verification is in progress
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F8FC] text-[#19324D]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#4689C8] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center">
            <h3 className="text-base font-bold text-[#19324D] tracking-wide">HERTZSOFT ERP</h3>
            <p className="text-xs text-[#71869B] mt-1">Verifying secure session...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Prevent rendering protected content if unauthenticated
  if (!isAuthenticated) {
    return null;
  }

  // 3. Role-Based Access Control (RBAC) enforcement
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F8FC] text-[#19324D] p-6">
        <div className="max-w-md w-full bg-white border border-[#DFEAF2] rounded-2xl p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-[#19324D] mb-2">Access Restricted</h2>
          <p className="text-[#71869B] text-sm mb-6 leading-relaxed">
            Your role (<span className="text-[#4689C8] font-bold">{user.role}</span>) does not have authorization to view this module.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 bg-[#4689C8] hover:bg-[#3475B2] text-white rounded-lg text-sm font-bold shadow-md shadow-[#4689C8]/25 transition cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
}
