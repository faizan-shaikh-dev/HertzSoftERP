'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, Shield, UserCheck, ChevronDown, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { EditProfileModal } from '@/components/modals';

export default function Navbar({ 
  onMenuToggle, 
  onMobileToggle, 
  onToggleCollapse, 
  isCollapsed = false, 
  title = 'Operations Dashboard' 
}) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleToggleClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      if (onMobileToggle) onMobileToggle();
      else if (onMenuToggle) onMenuToggle();
    } else {
      if (onToggleCollapse) onToggleCollapse();
      else if (onMenuToggle) onMenuToggle();
    }
  };

  const displayName = user?.full_name || user?.name || 'Staff User';
  const displayEmail = user?.email || 'admin@hertzsoft.com';
  const userInitial = displayName.charAt(0).toUpperCase();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
      {/* Left: Menu Toggler (Mobile Drawer & Desktop Collapse) & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={handleToggleClick}
          type="button"
          className="p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle navigation"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 font-medium">
            Hertzsoft Technologies Centralized Operations
          </p>
        </div>
      </div>

      {/* Right: User Profile Dropdown */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            type="button"
            className="flex items-center gap-2.5 p-1.5 sm:px-2.5 rounded-lg hover:bg-slate-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            {/* User Details (Desktop) */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {displayName}
              </span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight">
                {displayEmail}
              </span>
            </div>

            {/* Avatar Circle */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 text-white font-bold text-sm flex items-center justify-center shadow-2xs border border-blue-400/40">
              {userInitial}
            </div>

            {/* Chevron Arrow */}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Box */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown Header Info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Signed in as
                </p>
                <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {displayEmail}
                </p>
                <div className="mt-2">
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60">
                      <Shield className="w-3 h-3" />
                      Administrator
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/60">
                      <UserCheck className="w-3 h-3" />
                      {user?.role || 'Staff Member'}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Actions */}
              <div className="p-1.5 space-y-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Edit Profile & Account</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    toast.info('Logged out successfully.');
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign out / Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </header>
  );
}
