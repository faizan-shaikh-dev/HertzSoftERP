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
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';

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
    label: 'Quotations',
    href: '/quotations',
    icon: FileSpreadsheet
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderKanban
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
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`h-16 sm:h-20 border-b border-slate-100 flex items-center transition-all bg-white ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4 sm:px-5'
        }`}>
          <Link 
            href="/" 
            className="flex items-center gap-2 group"
            title="Hertzsoft ERP Portal"
          >
            {isCollapsed ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white p-1 flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Image
                  src="/logo-icon.svg"
                  alt="Hertzsoft Logo"
                  width={34}
                  height={34}
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="flex flex-col items-start py-1 group-hover:opacity-90 transition-opacity">
                <Image
                  src="/logo.svg"
                  alt="Hertzsoft Technologies"
                  width={160}
                  height={42}
                  className="h-9 w-auto object-contain"
                  priority
                />
              </div>
            )}
          </Link>

          {/* Action buttons in header (mobile close button) */}
          <div className="flex items-center gap-1">
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

        {/* Desktop Centered Sidebar Arrow Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            type="button"
            className="hidden lg:flex items-center justify-center absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 w-7 h-7 rounded-full bg-white border border-[#dee2e6] text-[#525f7f] hover:text-[#4689C8] hover:border-[#4689C8] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[#4689C8] transition-transform duration-200 group-hover:scale-110" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-[#525f7f] group-hover:text-[#4689C8] transition-transform duration-200 group-hover:scale-110" />
            )}
          </button>
        )}

        {/* Navigation Menu Links (Exact OJT Vertical Nav Style) */}
        <div className={`flex-1 py-4 space-y-1.5 overflow-y-auto ${
          isCollapsed ? 'px-2' : 'px-3'
        }`}>
          {!isCollapsed ? (
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
              Navigation
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
                className={`flex items-center text-xs sm:text-sm transition-all group relative rounded-md ${
                  isCollapsed
                    ? 'justify-center p-2.5 w-12 h-12 mx-auto'
                    : 'gap-3 px-3.5 py-2.5 mx-1'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-[#4689C8] to-[#3a7ab7] text-white font-bold shadow-md shadow-[#4689C8]/25'
                    : 'text-[#525f7f] hover:text-[#4689C8] hover:bg-[#f0f7fd] font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-[#8898aa] group-hover:text-[#4689C8]'
                }`} />

                {!isCollapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}

                {/* Floating Tooltip when sidebar is collapsed */}
                {isCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 text-xs font-semibold text-white bg-[#326fa8] rounded-md shadow-lg whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Clean Footer (No overflowing user card - user profile is in top Navbar) */}
        <div className="py-3 px-4 border-t border-slate-100 bg-[#f8f9fe] text-center">
          <p className="text-[10px] font-semibold text-[#8898aa] uppercase tracking-wider truncate">
            {!isCollapsed ? 'Hertzsoft ERP • v2.0' : 'v2.0'}
          </p>
        </div>
      </aside>
    </>
  );
}
