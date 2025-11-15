'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UnifiedSidebar } from './UnifiedSidebar';
import { Home, Settings, BookOpen, Brain, MessageCircle } from 'lucide-react';

interface ModeOption {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
}

interface UnifiedLayoutProps {
  children: React.ReactNode;
  userRole: 'student' | 'admin';
  title?: string;
  subjectName?: string;
  modeOptions?: ModeOption[];
  activeMode?: string;
  onModeChange?: (mode: string) => void;
  showCourseTabs?: boolean;
  courseId?: string;
  activeTab?: string;
  fullScreen?: boolean;
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  children,
  userRole,
  title,
  subjectName,
  modeOptions,
  activeMode,
  onModeChange,
  showCourseTabs = false,
  courseId,
  activeTab,
  fullScreen = false
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="px-6 flex items-center gap-4">
            <h1 className="text-lg font-semibold">
              {subjectName || getPageTitle()}
            </h1>

            {/* Course Tabs */}
            {showCourseTabs && courseId && (
              <nav className="flex space-x-6 ml-8">
                <button
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                    activeTab === 'overview'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => router.push(`/learning/${courseId}/overview`)}
                >
                  Overview
                </button>
                <button
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                    activeTab === 'learn'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => router.push(`/learning/${courseId}/learn`)}
                >
                  <BookOpen className="h-4 w-4" />
                  Learn
                </button>
                <button
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                    activeTab === 'evaluate'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => router.push(`/learning/${courseId}/evaluate`)}
                >
                  <Brain className="h-4 w-4" />
                  Evaluate
                </button>
                <button
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                    activeTab === 'chat'
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => router.push(`/learning/${courseId}/chat`)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </button>
                </nav>
            )}
          </div>

          <div className="px-6 flex items-center gap-4">
            {/* Mode selection for subject pages */}
            {modeOptions && onModeChange && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-4">
                {modeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => onModeChange(option.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeMode === option.id
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <option.icon className="h-4 w-4" />
                    <span>{option.name}</span>
                  </button>
                ))}
              </div>
            )}

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
        <main className={`flex-1 ${fullScreen ? 'bg-white' : 'bg-gray-50/50'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export { UnifiedLayout };