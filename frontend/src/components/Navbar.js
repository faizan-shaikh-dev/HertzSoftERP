'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Menu, LogOut, Shield, UserCheck, ChevronDown, User, Sun, Moon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { EditProfileModal } from '@/components/modals';

export default function Navbar({ 
  onMenuToggle, 
  onMobileToggle, 
  onToggleCollapse, 
  isCollapsed = false, 
  title = 'Operations Dashboard' 
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark, mounted } = useTheme();
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
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-[#0077B6] dark:bg-[#0F172A] border-b border-[#005f92] dark:border-[#1E293B] px-5 sm:px-8 flex items-center justify-between shadow-xs transition-colors duration-150">
      {/* Left: Mobile Drawer Toggler (Hidden on Desktop) & White Typography Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={handleToggleClick}
          type="button"
          className="lg:hidden p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
          title="Toggle Navigation Menu"
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
          <p className="hidden sm:block text-[11px] text-blue-100 dark:text-[#94A3B8] font-medium leading-none mt-1">
            Hertzsoft Technologies Centralized Operations
          </p>
        </div>
      </div>

      {/* Right: Theme Toggle & User Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2 sm:px-2.5 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/30"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {mounted && isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-300 animate-in spin-in-180 duration-200" />
              <span className="hidden md:inline text-xs font-semibold text-white">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-blue-100" />
              <span className="hidden md:inline text-xs font-semibold text-white">Dark</span>
            </>
          )}
        </button>

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
              <span className="text-[10px] text-blue-100 dark:text-[#94A3B8] font-medium leading-tight">
                {displayEmail}
              </span>
            </div>

            {/* Circular Avatar from OJT avatar.png */}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-white/60 shadow-xs flex-shrink-0 bg-white">
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
              className={`w-3.5 h-3.5 text-white/85 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Box */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1E293B] rounded-xl shadow-xl border border-[#DFEAF2] dark:border-[#334155] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown Header Info */}
              <div className="px-4 py-3 border-b border-[#DFEAF2] dark:border-[#334155]">
                <p className="text-[10px] font-bold text-[#71869B] dark:text-[#94A3B8] uppercase tracking-wider">
                  Welcome!
                </p>
                <p className="text-sm font-bold text-[#19324D] dark:text-[#F8FAFC] truncate mt-0.5">
                  {displayName}
                </p>
                <p className="text-xs text-[#71869B] dark:text-[#94A3B8] truncate">
                  {displayEmail}
                </p>
                <div className="mt-2">
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                      <Shield className="w-3 h-3" />
                      Administrator
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EAF3FB] dark:bg-[#0F172A] text-[#4689C8] dark:text-[#5FC8D6] border border-[#78A9D7]/30 dark:border-[#334155]">
                      <UserCheck className="w-3 h-3" />
                      {user?.role || 'Staff Member'}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Actions */}
              <div className="p-1.5 space-y-1">
                {/* Theme toggle option inside menu */}
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#19324D] dark:text-[#F8FAFC] hover:text-[#4689C8] dark:hover:text-[#5FC8D6] hover:bg-[#EAF3FB] dark:hover:bg-[#334155]/60 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-[#4689C8]" />
                    )}
                    <span>Appearance</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#71869B] dark:text-[#94A3B8] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0F172A]">
                    {isDark ? 'Dark' : 'Light'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#19324D] dark:text-[#F8FAFC] hover:text-[#4689C8] dark:hover:text-[#5FC8D6] hover:bg-[#EAF3FB] dark:hover:bg-[#334155]/60 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#4689C8] dark:text-[#5FC8D6]" />
                  <span>Edit Profile & Account</span>
                </button>

                <div className="border-t border-[#DFEAF2] dark:border-[#334155] my-1" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    toast.info('Logged out successfully.');
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left cursor-pointer"
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
