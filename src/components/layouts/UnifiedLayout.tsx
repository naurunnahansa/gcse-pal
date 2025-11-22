'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from './UnifiedSidebar';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  userRole: string | null;
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  children,
  userRole,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Determine page title based on current route
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.includes('/chat')) return 'AI Chat';
    if (pathname.includes('/courses') && pathname.includes('/admin')) return 'Course Management';
    if (pathname.includes('/courses')) return 'Courses';
    if (pathname.includes('/my-courses')) return 'My Courses';
    if (pathname.includes('/users')) return 'User Management';
    if (pathname.includes('/learning')) return 'Learning';
    if (pathname.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  // Check if we're on a chat page (needs full height without padding)
  const isChatPage = pathname.includes('/chat');

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <UnifiedSidebar
        userRole={userRole}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="px-6 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center lg:hidden">
                <Image
                  src="/badge-logo.png"
                  alt="Pal AI"
                  width={40}
                  height={40}
                  className="object-contain"
                  quality={100}
                  priority
                />
              </div>
              <h1 className="text-lg font-semibold">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="px-6 flex items-center gap-4">
            {/* Can add additional header items here */}
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 bg-gray-50/50 ${isChatPage ? '' : 'overflow-auto'}`}>
          <div className={isChatPage ? 'h-full' : 'p-6'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export { UnifiedLayout };
