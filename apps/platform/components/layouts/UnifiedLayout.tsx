'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UnifiedSidebar } from './UnifiedSidebar';
import { Home, Settings } from 'lucide-react';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  userRole: 'student' | 'admin';
  title?: string;
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  children,
  userRole,
  title
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Determine page title based on current route
  const getPageTitle = () => {
    if (title) return title;

    // Admin paths
    if (pathname.startsWith('/admin')) {
      if (pathname === '/admin') return 'Overview';
      if (pathname.includes('/courses')) return 'Course Management';
      if (pathname.includes('/students')) return 'User Management';
      if (pathname.includes('/videos') || pathname.includes('/assessments')) return 'Content Management';
      if (pathname.includes('/settings')) return 'Settings';
      return 'Admin Panel';
    }

    // Student paths
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.includes('/learning')) return 'Learning';
    if (pathname.includes('/evals')) return 'Assessments';
    if (pathname.includes('/progress')) return 'Progress';
    if (pathname.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <UnifiedSidebar
        userRole={userRole}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="px-6 flex items-center gap-4">
            <h1 className="text-lg font-semibold">
              {getPageTitle()}
            </h1>
          </div>

          <div className="px-6 flex items-center gap-4">
            {/* Quick navigation between admin and student dashboards */}
            {userRole === 'admin' ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Student Dashboard
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Panel
                </Link>
              </Button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-gray-50/50">
          {children}
        </main>
      </div>
    </div>
  );
};

export { UnifiedLayout };