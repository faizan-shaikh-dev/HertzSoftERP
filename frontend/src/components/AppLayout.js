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
      <div className="min-h-screen bg-slate-100 flex font-sans antialiased text-slate-900">
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
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
