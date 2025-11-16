'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/components/AuthProvider';
import {
  BarChart3,
  BookOpen,
  Users,
  Video,
  Settings,
  FileText,
  ChevronDown,
  ChevronRight,
  Menu,
  Home,
  LogOut,
  User,
  TrendingUp,
  Network,
  Target,
  Clock,
  Award,
  Search,
  Play,
  ChevronLeft,
  ChevronRight as ChevronCollapseRight,
  Calendar,
  CheckSquare,
} from 'lucide-react';

interface UnifiedSidebarProps {
  userRole?: 'student' | 'admin';
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({ userRole: propUserRole, isOpen, onOpenChange, isCollapsed, onToggleCollapse }) => {
  const { isAdmin, isStudent, user: authUser, isAuthenticated, isLoading } = useAuth();
  // Use actual user role from AuthProvider, fallback to prop for backward compatibility
  const userRole = isAdmin ? 'admin' : 'student';

  
  // Prevent hydration mismatch by initializing state in useEffect
  const [mounted, setMounted] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => pathname === href;

  // Student navigation items
  const studentNavigation = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', href: '/dashboard/overview', icon: BarChart3 },
        { name: 'Progress', href: '/dashboard/progress', icon: TrendingUp },
      ],
    },
    {
      title: 'Courses',
      items: [
        { name: 'My Courses', href: '/dashboard/learning/courses/my', icon: Play },
        { name: 'Browse Courses', href: '/dashboard/learning/courses/browse', icon: Search },
      ],
    },
    {
      title: 'Learning Tools',
      items: [
        { name: 'Study Calendar', href: '/dashboard/tools/calendar', icon: Calendar, comingSoon: true },
        { name: 'Tasks', href: '/dashboard/tools/tasks', icon: CheckSquare, comingSoon: true },
        { name: 'Notes', href: '/dashboard/tools/notes', icon: FileText, comingSoon: true },
      ],
    },
    {
      title: 'Settings',
      items: [
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ],
      collapsible: true,
      open: settingsOpen,
      setOpen: setSettingsOpen,
    },
  ];

  // Admin navigation items (extends student navigation with admin-specific items)
  const adminNavigation = [
    {
      title: 'Main',
      items: [
        { name: 'Admin Overview', href: '/dashboard/admin/overview', icon: BarChart3 },
        { name: 'Student Dashboard', href: '/dashboard/overview', icon: Home },
      ],
    },
    {
      title: 'Course Management',
      items: [
        { name: 'All Courses', href: '/dashboard/admin/courses', icon: BookOpen },
        { name: 'Create Course', href: '/dashboard/admin/courses/new', icon: BookOpen },
        { name: 'Course Categories', href: '/dashboard/admin/courses/categories', icon: FileText },
      ],
      collapsible: true,
      open: coursesOpen,
      setOpen: setCoursesOpen,
    },
    {
      title: 'User Management',
      items: [
        { name: 'All Students', href: '/dashboard/admin/students', icon: Users },
        { name: 'User Analytics', href: '/dashboard/admin/students/analytics', icon: TrendingUp },
      ],
    },
    {
      title: 'Content Management',
      items: [
        { name: 'Video Library', href: '/dashboard/admin/videos', icon: Video },
        { name: 'Assessments', href: '/dashboard/admin/assessments', icon: FileText },
        { name: 'Learning Materials', href: '/dashboard/admin/materials', icon: BookOpen },
      ],
      collapsible: true,
      open: contentOpen,
      setOpen: setContentOpen,
    },
    {
      title: 'Admin Settings',
      items: [
        { name: 'General Settings', href: '/dashboard/admin/settings', icon: Settings },
        { name: 'Integrations', href: '/dashboard/admin/settings/integrations', icon: Settings },
        { name: 'User Settings', href: '/dashboard/settings', icon: Settings },
      ],
      collapsible: true,
      open: settingsOpen,
      setOpen: setSettingsOpen,
    },
  ];

  const navigation = userRole === 'admin' ? adminNavigation : studentNavigation;

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''} ${isCollapsed ? 'w-full' : 'gap-2'}`}>
          <Link href={userRole === 'admin' ? '/dashboard/admin/overview' : '/dashboard'} className="flex items-center">
            <div className={`flex items-center justify-center ${isCollapsed ? 'w-8' : ''} ${isCollapsed ? '' : 'pl-4'}`}>
              <Image
                src="/logo-full.png"
                alt="GCSEPal"
                width={isCollapsed ? 32 : 100}
                height={isCollapsed ? 32 : 44}
                className="object-contain"
                quality={100}
                priority
              />
            </div>
          </Link>
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-1">
            {/* Collapse Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => onOpenChange(false)}
            >
              ×
            </Button>
          </div>
        )}
      </div>
      {/* Expand button for collapsed state */}
      {isCollapsed && (
        <div className="flex items-center justify-center py-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex"
            onClick={onToggleCollapse}
            title="Expand sidebar"
          >
            <ChevronCollapseRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2 py-4' : 'p-4'}`}>
        {navigation.map((section) => (
          <div key={section.title}>
            {section.collapsible ? (
              isCollapsed ? (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-center rounded-lg text-sm font-medium transition-colors group px-3 py-3 ${
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground crayon-effect'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                      title={item.name}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                mounted ? (
                  <Collapsible open={section.open} onOpenChange={section.setOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between px-3 h-auto py-2 font-semibold text-sm text-muted-foreground hover:text-foreground"
                      >
                        {section.title}
                        {section.open ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center justify-start gap-3 rounded-lg text-sm font-medium transition-colors group px-3 py-2 ${
                            isActive(item.href)
                              ? 'bg-primary text-primary-foreground crayon-effect'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                          title={item.name}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="truncate">{item.name}</span>
                          {item.comingSoon && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                              Soon
                            </span>
                          )}
                        </div>
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  // Fallback for SSR - show expanded content
                  <div className="space-y-1 mt-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-between px-3 h-auto py-2 font-semibold text-sm text-muted-foreground hover:text-foreground pointer-events-none"
                      disabled
                    >
                      {section.title}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="space-y-1 mt-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center justify-start gap-3 rounded-lg text-sm font-medium transition-colors group px-3 py-2 ${
                            isActive(item.href)
                              ? 'bg-primary text-primary-foreground crayon-effect'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                          title={item.name}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="truncate">{item.name}</span>
                          {item.comingSoon && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                              Soon
                            </span>
                          )}
                        </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="space-y-3">
                {!isCollapsed && (
                  <p className="text-sm font-semibold text-muted-foreground px-3">
                    {section.title}
                  </p>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center rounded-lg text-sm font-medium transition-colors group ${
                        isCollapsed
                          ? 'justify-center px-3 py-3'
                          : 'justify-start gap-3 px-3 py-2'
                      } ${
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground crayon-effect'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="truncate">{item.name}</span>
                          {item.comingSoon && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                              Soon
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {section !== navigation[navigation.length - 1] && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className={`border-t ${isCollapsed ? 'px-2 py-4' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center mb-4' : 'gap-3 mb-4'}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary flex-shrink-0">
            <User className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-medium">{authUser?.name || (userRole === 'admin' ? 'Admin User' : 'Student User')}</p>
              <p className="text-xs text-muted-foreground">{authUser?.email || (userRole === 'admin' ? 'admin@gcsepal.com' : 'student@gcsepal.com')}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className={`${isCollapsed ? 'w-auto px-3 py-3' : 'w-full justify-start'}`}
          asChild
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <Link href="/auth/signin" className={isCollapsed ? 'flex items-center justify-center' : ''}>
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      {mounted ? (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden fixed top-4 left-4 z-40"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      ) : (
        // Fallback for SSR - show a simple button
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden fixed top-4 left-4 z-40 pointer-events-none"
          disabled
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Desktop sidebar - shown by default on larger screens */}
      <div className="hidden lg:block h-screen">
        <div className={`border-r bg-background transition-all duration-300 ease-in-out h-full ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}>
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export { UnifiedSidebar };