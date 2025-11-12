'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => pathname === href;

  const navigation = [
    {
      title: 'Main',
      items: [
        { name: 'Overview', href: '/admin', icon: BarChart3 },
        { name: 'Dashboard', href: '/dashboard', icon: Home },
      ],
    },
    {
      title: 'Course Management',
      items: [
        { name: 'All Courses', href: '/admin/courses', icon: BookOpen },
        { name: 'Create Course', href: '/admin/courses/new', icon: BookOpen },
        { name: 'Course Categories', href: '/admin/courses/categories', icon: FileText },
      ],
      collapsible: true,
      open: coursesOpen,
      setOpen: setCoursesOpen,
    },
    {
      title: 'User Management',
      items: [
        { name: 'All Students', href: '/admin/students', icon: Users },
        { name: 'User Analytics', href: '/admin/students/analytics', icon: TrendingUp },
      ],
    },
    {
      title: 'Content',
      items: [
        { name: 'Video Library', href: '/admin/videos', icon: Video },
        { name: 'Assessments', href: '/admin/assessments', icon: FileText },
      ],
      collapsible: true,
      open: analyticsOpen,
      setOpen: setAnalyticsOpen,
    },
    {
      title: 'Settings',
      items: [
        { name: 'General', href: '/admin/settings', icon: Settings },
        { name: 'Integrations', href: '/admin/settings/integrations', icon: Settings },
      ],
      collapsible: true,
      open: settingsOpen,
      setOpen: setSettingsOpen,
    },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary crayon-effect">
            <span className="text-lg font-bold text-primary-foreground">G</span>
          </div>
          <span className="text-xl font-bold">Admin Panel</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          ×
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 p-4 overflow-y-auto">
        {navigation.map((section) => (
          <div key={section.title}>
            {section.collapsible ? (
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
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground crayon-effect'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground px-3">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary text-primary-foreground crayon-effect'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
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
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || 'admin@gcsepal.com'}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/">
            <LogOut className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
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

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="w-64 border-r bg-background">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="px-6 flex items-center gap-4">
            <h1 className="text-lg font-semibold">
              {navigation
                .flatMap(section => section.items)
                .find(item => isActive(item.href))?.name || 'Admin Panel'}
            </h1>
          </div>

          <div className="px-6 flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Student Dashboard
              </Link>
            </Button>
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

export { AdminLayout };