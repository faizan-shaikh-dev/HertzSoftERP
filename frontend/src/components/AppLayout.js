'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { useSidebar } from '@/context/SidebarContext';

export default function AppLayout({ children, title, allowedRoles, requiredRoles }) {
  const { isCollapsed, toggleCollapse, mobileOpen, setMobileOpen, toggleMobile } = useSidebar();
  const roles = allowedRoles || requiredRoles || [];

  return (
    <ProtectedRoute allowedRoles={roles}>
      <div className="min-h-screen bg-[#f8f9fe] flex font-sans antialiased text-[#525f7f]">
        {/* Left Vertical Sidenav (template-hz collapsible style) */}
        <Sidebar 
          isOpen={mobileOpen} 
          onClose={() => setMobileOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Main Panel Content Area: dynamically shifts margin based on isCollapsed */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}>
          {/* Top Sticky Header */}
          <Navbar 
            title={title}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            onMenuToggle={toggleMobile}
            onMobileToggle={toggleMobile}
          />

          {/* Dynamic Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
            <div className="max-w-7xl mx-auto w-full space-y-6">
              {children}
            </div>

            {/* OJT Standard Portal Footer */}
            <footer className="max-w-7xl mx-auto w-full mt-10 pt-4 pb-2 text-center text-xs text-[#8898aa]">
              © 2026 | All rights reserved | Designed & Developed by{' '}
              <a
                href="https://www.hertzsoft.com"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#4689C8] hover:underline"
              >
                Hertzsoft
              </a>
            </footer>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
