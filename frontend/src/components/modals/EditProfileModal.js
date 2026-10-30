'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { 
  XCircle, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Ensure portal only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state whenever modal opens or user profile changes
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || user.name || '');
      setEmail(user.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordSection(false);
      setError('');
      setSuccess('');
    }
  }, [user, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase()
      };

      if (showPasswordSection && newPassword) {
        if (!currentPassword) {
          const msg = 'Please provide your current password to set a new password.';
          setError(msg);
          toast.warning(msg);
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          const msg = 'New password must be at least 6 characters long.';
          setError(msg);
          toast.warning(msg);
          setLoading(false);
          return;
        }
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      await updateProfile(payload);
      toast.success('Profile updated successfully!');
      setSuccess('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordSection(false);

      // Auto-close after brief confirmation
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to update account profile:', err);
      const msg = 
        err.response?.data?.error?.message || 
        err.message || 
        'Failed to update profile. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-[#e9ecef] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - OJT Style */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e9ecef] bg-white">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight">
              Edit Profile
            </h3>
            <p className="text-xs text-[#8898aa] mt-0.5">
              Update your display name, contact email, and credentials
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-[#172b4d] hover:text-[#525f7f] transition cursor-pointer p-0.5 rounded-full"
            aria-label="Close modal"
          >
            <XCircle className="w-7 h-7 stroke-[1.5]" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          {/* Success Banner */}
          {success && (
            <div className="p-3.5 rounded-md bg-[#eafaf1] border border-[#2dce89]/30 flex items-center gap-2.5 text-[#2dce89] text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 flex items-center gap-2.5 text-[#f5365c] text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name Field */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Full Name <span className="text-[#f5365c] font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
            />
          </div>

          {/* Email Address Field */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Email Address <span className="text-[#f5365c] font-bold ml-0.5">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hertzsoft.com"
              className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
            />
          </div>

          {/* Role Display (Read-Only) */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              System Role
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#f8f9fe] rounded-md border border-[#dee2e6] text-[#525f7f] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#4689C8]" />
              <span className="text-[#172b4d]">{user?.role || 'Administrator'}</span>
              <span className="text-[10px] text-[#8898aa] font-normal ml-auto">(Assigned by System)</span>
            </div>
          </div>

          {/* Password Change Toggle */}
          <div className="pt-2">
            {!showPasswordSection ? (
              <button
                type="button"
                onClick={() => setShowPasswordSection(true)}
                className="text-xs font-bold text-[#4689C8] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Want to change your password?</span>
              </button>
            ) : (
              <div className="p-4 rounded-md bg-[#f8f9fe] border border-[#dee2e6] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172b4d] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#4689C8]" />
                    Change Password
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword('');
                      setNewPassword('');
                    }}
                    className="text-[11px] font-semibold text-[#f5365c] hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#525f7f] mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 bg-white text-[#172b4d] text-xs rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#525f7f] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full px-3 py-2 bg-white text-[#172b4d] text-xs rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Full-Width Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4689C8] hover:bg-[#3876b0] text-white font-bold text-sm rounded shadow-md shadow-[#4689C8]/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
