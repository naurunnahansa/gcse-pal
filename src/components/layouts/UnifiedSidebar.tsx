'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserButton } from '@clerk/nextjs';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  BarChart3,
  BookOpen,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Home,
  Search,
  Play,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';

interface UnifiedSidebarProps {
  userRole: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  userRole,
  isOpen,
  onOpenChange,
  isCollapsed,
  onToggleCollapse
}) => {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => pathname === href;
  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';
  const canManage = isAdmin || isTeacher;

  // Student navigation items
  const studentNavigation = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'AI Chat', href: '/dashboard/chat', icon: MessageSquare },
      ],
    },
    {
      title: 'Courses',
      items: [
        { name: 'My Courses', href: '/dashboard/my-courses', icon: Play },
        { name: 'Browse Courses', href: '/dashboard/courses', icon: Search },
      ],
    },
    {
      title: 'Settings',
      items: [
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ];

  // Admin/Teacher navigation items
  const adminNavigation = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'AI Chat', href: '/dashboard/chat', icon: MessageSquare },
      ],
    },
    {
      title: 'Courses',
      items: [
        { name: 'My Courses', href: '/dashboard/my-courses', icon: Play },
        { name: 'Browse Courses', href: '/dashboard/courses', icon: Search },
      ],
    },
    {
      title: 'Management',
      items: [
        { name: 'Manage Courses', href: '/dashboard/admin/courses', icon: BookOpen },
        ...(isAdmin ? [{ name: 'Users', href: '/dashboard/admin/users', icon: Users }] : []),
      ],
    },
    {
      title: 'Settings',
      items: [
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ];

  const navigation = canManage ? adminNavigation : studentNavigation;

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''} ${isCollapsed ? 'w-full' : 'gap-2'}`}>
          <Link href="/dashboard" className="flex items-center">
            <div className={`flex items-center justify-center ${isCollapsed ? 'w-8' : ''} ${isCollapsed ? '' : 'pl-4'}`}>
              <Image
                src="/logo-full.png"
                alt="Pal AI"
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
          <div className="flex items-center gap-1 pr-2">
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
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2 py-4' : 'p-4'}`}>
        {navigation.map((section) => (
          <div key={section.title}>
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
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
            {section !== navigation[navigation.length - 1] && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className={`border-t ${isCollapsed ? 'px-2 py-4' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <UserButton afterSignOutUrl="/" />
          {!isCollapsed && (
            <div className="flex-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                userRole === 'admin'
                  ? 'bg-red-100 text-red-700'
                  : userRole === 'teacher'
                  ? 'bg-blue-100 text-blue-700'
                  : userRole === 'pro_student'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {userRole === 'admin' ? 'ADMIN' :
                 userRole === 'teacher' ? 'TEACHER' :
                 userRole === 'pro_student' ? 'PRO' : 'FREE'}
              </span>
            </div>
          )}
        </div>
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
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden fixed top-4 left-4 z-40 pointer-events-none"
          disabled
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Desktop sidebar */}
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
