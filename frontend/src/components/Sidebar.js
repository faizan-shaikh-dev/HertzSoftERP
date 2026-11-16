'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck,
  FolderKanban, 
  Award, 
  X,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard
  },
  {
    label: 'Leads Management',
    href: '/leads',
    icon: Users
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: UserCheck
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderKanban
  },
  {
    label: 'Quotations',
    href: '/quotations',
    icon: FileSpreadsheet
  },
  {
    label: 'Payments',
    href: '/payments',
    icon: CreditCard
  },
  {
    label: 'Certificates & Docs',
    href: '/certificates',
    icon: Award
  }
];

export default function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) {
  const pathname = usePathname();
  const { theme, toggleTheme, isDark, mounted } = useTheme();

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: w-64 when expanded, w-20 when collapsed on desktop */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-[#0F172A] border-r border-[#DFEAF2] dark:border-[#1E293B] flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`h-16 sm:h-20 border-b border-[#DFEAF2] dark:border-[#1E293B] flex items-center bg-white dark:bg-[#0F172A] ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5 sm:px-6'
        }`}>
          <Link 
            href="/" 
            className="flex items-center gap-2"
            title="Hertzsoft ERP Portal"
          >
            {isCollapsed ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#DFEAF2] dark:border-[#334155] bg-[#F4F8FC] dark:bg-[#1E293B] p-1.5 flex-shrink-0 flex items-center justify-center shadow-2xs">
                <Image
                  src="/logo-icon.svg"
                  alt="Hertzsoft Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="flex flex-col items-start py-1">
                <div className="dark:bg-white/10 dark:px-2.5 dark:py-1 dark:rounded-md transition-colors">
                  <Image
                    src="/logo.svg"
                    alt="Hertzsoft Technologies"
                    width={155}
                    height={40}
                    className="h-8.5 w-auto object-contain"
                    priority
                  />
                </div>
              </div>
            )}
          </Link>

          {/* Action buttons in header (mobile close button) */}
          <div className="flex items-center gap-1">
            {/* Close button on mobile */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#71869B] dark:text-[#94A3B8] hover:text-[#19324D] dark:hover:text-[#F8FAFC] hover:bg-[#EAF3FB] dark:hover:bg-[#1E293B] lg:hidden cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div className={`flex-1 py-5 space-y-2 overflow-y-auto no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isCollapsed ? 'px-2' : 'px-3.5'
        }`}>
          {!isCollapsed ? (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#71869B] dark:text-[#64748B]">
              Navigation
            </div>
          ) : (
            <div className="w-8 h-[1px] bg-[#DFEAF2] dark:bg-[#1E293B] mx-auto my-2" />
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/'
              ? pathname === '/'
              : item.href === '/leads'
              ? pathname === '/leads' || pathname.startsWith('/leads/view')
              : item.href === '/clients'
              ? pathname === '/clients' || pathname.startsWith('/clients/') || pathname.startsWith('/leads/converted')
              : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center text-xs sm:text-sm group relative rounded-lg transition-colors ${
                  isCollapsed
                    ? 'justify-center p-2.5 w-11 h-11 mx-auto'
                    : 'gap-3 px-3.5 py-2.5 mx-0.5'
                } ${
                  isActive
                    ? 'bg-[#EAF3FB] dark:bg-[#1E293B] text-[#0077B6] dark:text-[#5FC8D6] font-bold shadow-2xs border border-[#0077B6]/20 dark:border-[#5FC8D6]/30'
                    : 'text-[#71869B] dark:text-[#94A3B8] hover:text-[#19324D] dark:hover:text-[#F8FAFC] hover:bg-[#F4F8FC] dark:hover:bg-[#1E293B] font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-[#0077B6] dark:text-[#5FC8D6]' : 'text-[#71869B] dark:text-[#94A3B8] group-hover:text-[#19324D] dark:group-hover:text-[#F8FAFC]'
                }`} />

                {!isCollapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}

                {/* Floating Tooltip when sidebar is collapsed */}
                {isCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 text-xs font-semibold text-white bg-[#19324D] dark:bg-[#1E293B] dark:border dark:border-[#334155] rounded-md shadow-lg whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Clean Footer with Theme Switcher & Version */}
        <div className="py-3 px-3 border-t border-[#DFEAF2] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B132B] text-center space-y-2">
          {/* Quick theme toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-xs font-semibold text-[#19324D] dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#253349] transition-colors cursor-pointer ${
              isCollapsed ? 'px-1' : 'px-3'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {mounted && isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                {!isCollapsed && <span>Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#0077B6]" />
                {!isCollapsed && <span>Dark Mode</span>}
              </>
            )}
          </button>

          <p className="text-[10px] font-semibold text-[#71869B] dark:text-[#64748B] uppercase tracking-wider truncate">
            {!isCollapsed ? 'Hertzsoft ERP • v2.0' : 'v2.0'}
          </p>
        </div>

        {/* Desktop Centered Sidebar Arrow Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            type="button"
            className="hidden lg:flex items-center justify-center absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 w-7 h-7 rounded-full bg-white dark:bg-[#1E293B] border border-[#DFEAF2] dark:border-[#334155] text-[#71869B] dark:text-[#94A3B8] hover:text-[#0077B6] dark:hover:text-[#5FC8D6] hover:border-[#0077B6] dark:hover:border-[#5FC8D6] shadow-xs hover:shadow-sm cursor-pointer group"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[#0077B6] dark:text-[#5FC8D6]" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-[#71869B] dark:text-[#94A3B8] group-hover:text-[#0077B6] dark:group-hover:text-[#5FC8D6]" />
            )}
          </button>
        )}
      </aside>
    </>
  );
}
