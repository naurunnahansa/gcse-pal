'use client';

import { BarChart3, Settings, Zap, LogOut, Home, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupLabel,
  SidebarGroup,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  tenantName?: string;
  tenantDomain?: string;
  role?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export function AppSidebar({ tenantName, tenantDomain, role, user }: AppSidebarProps) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut({
        returnTo: process.env.NEXT_PUBLIC_WORKOS_LOGOUT_REDIRECT_URI || 'http://localhost:3000/sign-in',
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navigationItems = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      icon: Zap,
      label: 'Agents',
      href: '/dashboard/agents',
    },
    {
      icon: BarChart3,
      label: 'Knowledge Base',
      href: '/dashboard/knowledge-base',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/dashboard/settings',
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
            <Briefcase className="size-6" />
          </div>
          <div className="flex flex-col gap-0.5 leading-tight">
            <span className="font-semibold text-sm">{tenantName || 'Organization'}</span>
            <span className="text-xs text-sidebar-foreground/60">{tenantDomain || 'No domain'}</span>
            <span className="text-xs font-medium text-blue-600 capitalize">{role}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-4" />

        <div className="px-2 py-3 text-xs text-sidebar-foreground/60">
          <p className="font-medium mb-2">Quick Stats</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Active Agents</span>
              <span className="font-semibold text-sidebar-foreground">0</span>
            </div>
            <div className="flex justify-between">
              <span>Knowledge Items</span>
              <span className="font-semibold text-sidebar-foreground">0</span>
            </div>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-3">
          <div className="px-2 py-3 bg-sidebar-accent rounded-lg border border-sidebar-border">
            <p className="text-xs font-medium text-sidebar-foreground mb-1">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
