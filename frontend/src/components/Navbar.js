'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
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
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-[#172b4d] border-b border-[#111f38] px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-md">
      {/* Left: Menu Toggler (OJT Sidenav Toggler) & White Typography Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={handleToggleClick}
          type="button"
          className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle navigation"
        >
          {/* Sidenav 3-line Toggler Icon */}
          <div className="w-5 h-3.5 flex flex-col justify-between">
            <span className="block h-0.5 w-full bg-white rounded-full"></span>
            <span className="block h-0.5 w-3/4 bg-white rounded-full"></span>
            <span className="block h-0.5 w-full bg-white rounded-full"></span>
          </div>
        </button>

        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-white leading-tight">
            {title}
          </h1>
          <p className="hidden sm:block text-[11px] text-blue-200/80 font-medium leading-none mt-0.5">
            Hertzsoft Technologies Centralized Operations
          </p>
        </div>
      </div>

      {/* Right: User Profile Dropdown (OJT avatar.png & white typography) */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            type="button"
            className="flex items-center gap-2.5 p-1 sm:px-2.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer text-left"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            {/* User Details (Desktop) */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-blue-200/80 font-medium leading-tight">
                {displayEmail}
              </span>
            </div>

            {/* Circular Avatar from OJT avatar.png */}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-white/30 shadow-xs flex-shrink-0 bg-white">
              <Image
                src="/avatar.png"
                alt={displayName}
                width={36}
                height={36}
                className="object-cover w-full h-full"
                priority
              />
            </div>

            {/* Chevron Arrow */}
            <ChevronDown
              className={`w-3.5 h-3.5 text-blue-200 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Box */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown Header Info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[10px] font-bold text-[#8898aa] uppercase tracking-wider">
                  Welcome!
                </p>
                <p className="text-sm font-bold text-[#172b4d] truncate mt-0.5">
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#0a48b3] hover:bg-blue-50/80 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#0a48b3]" />
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
