'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Award, 
  X,
  Shield,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
    label: 'Projects & Payments',
    href: '/projects',
    icon: FolderKanban
  },
  {
    label: 'Certificates & Docs',
    href: '/certificates',
    icon: Award
  }
];

export default function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const displayName = user?.full_name || user?.name || 'Staff User';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container: w-64 when expanded, w-20 when collapsed on desktop */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`h-20 border-b border-slate-100 flex items-center transition-all ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}>
          <Link 
            href="/" 
            className="flex items-center gap-3 group"
            title="Hertzsoft ERP Portal"
          >
            <div className="relative w-11 h-11 rounded-lg overflow-hidden shadow-2xs border border-slate-200/80 bg-white p-1 flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="Hertzsoft Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden animate-in fade-in duration-200">
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors whitespace-nowrap">
                  HERTZSOFT
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-sky-600 -mt-1 whitespace-nowrap">
                  ERP Portal
                </span>
              </div>
            )}
          </Link>

          {/* Action buttons in header */}
          <div className="flex items-center gap-1">
            {/* Desktop Collapse / Expand Toggle Button */}
            {!isCollapsed && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                type="button"
                className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Collapse Sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Close button on mobile */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div className={`flex-1 py-6 space-y-2 overflow-y-auto ${
          isCollapsed ? 'px-2' : 'px-4'
        }`}>
          {!isCollapsed ? (
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 animate-in fade-in duration-200">
              Main Navigation
            </div>
          ) : (
            <div className="w-8 h-[1px] bg-slate-200 mx-auto my-2" />
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-lg text-sm font-medium transition-all group relative ${
                  isCollapsed
                    ? 'justify-center p-2.5 w-12 h-12 mx-auto'
                    : 'gap-3.5 px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80'
                }`}
              >
                <Icon className={`w-6 h-6 flex-shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
                {!isCollapsed && (
                  <span className="truncate animate-in fade-in duration-200">
                    {item.label}
                  </span>
                )}

                {/* Floating Tooltip when sidebar is collapsed */}
                {isCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card & System Footnote */}
        <div className={`border-t border-slate-100 bg-slate-50/60 transition-all ${
          isCollapsed ? 'p-2' : 'p-4'
        }`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200/90 shadow-2xs">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-2xs flex-shrink-0">
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {displayName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {(user?.role?.toLowerCase().includes('admin')) ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60">
                        <Shield className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/60">
                        <UserCheck className="w-2.5 h-2.5" />
                        {user?.role || 'Staff'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 px-2 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Hertzsoft ERP</span>
                <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                  v1.0
                </span>
              </div>
            </>
          ) : (
            <div 
              className="flex justify-center p-1.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs group relative cursor-pointer"
              title={`${displayName} (${user?.role || 'Staff'})`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-2xs">
                {userInitial}
              </div>

              {/* Floating Tooltip */}
              <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex flex-col px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150">
                <span>{displayName}</span>
                <span className="text-[10px] text-slate-300 font-normal">
                  {user?.role || 'Staff User'}
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
