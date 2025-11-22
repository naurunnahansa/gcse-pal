'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Settings,
  Shield,
  Bell,
  Users,
  Database,
  Globe,
  Palette,
  Mail,
  Lock,
  Key,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  User,
  Crown,
  GraduationCap,
  BookOpen,
  Eye,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';
import { AdminOnly } from '@/components/RBACWrapper';
import { Role, getAssignableRoles } from '@/lib/permissions';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

const AdminSettingsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Role management state
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  // Role management functions
  const searchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (targetUserId: string, newRole: Role) => {
    try {
      const response = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, role: newRole }),
      });

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(u =>
          u.id === targetUserId ? { ...u, role: newRole } : u
        ));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'admin': return Crown;
      case 'teacher': return GraduationCap;
      case 'student': return BookOpen;
      default: return Eye;
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100 border-red-200';
      case 'teacher': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'student': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  useEffect(() => {
    if (searchTerm.length > 2 || searchTerm.length === 0) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  const assignableRoles = getAssignableRoles(user?.role as Role || 'student');

  if (!isAuthenticated || !user) {
    return (
      <UnifiedLayout userRole="admin" title="Authentication Required">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access admin settings.</p>
            <Button asChild>
              <a href="/auth/signin">Sign In</a>
            </Button>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
          <p className="text-muted-foreground">
            Manage platform settings and configurations
          </p>
        </div>

        <div className="max-w-4xl space-y-8">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <p className="text-sm text-muted-foreground">Name displayed throughout the platform</p>
                </div>
                <Input id="platform-name" defaultValue="GCSEPal" className="w-64" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="platform-email">Platform Email</Label>
                  <p className="text-sm text-muted-foreground">Email used for system notifications</p>
                </div>
                <Input id="platform-email" type="email" defaultValue="admin@gcsepal.com" className="w-64" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Temporarily disable access for all users</p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="new-registrations">Allow New Registrations</Label>
                  <p className="text-sm text-muted-foreground">Control new user sign-ups</p>
                </div>
                <Switch id="new-registrations" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="admin-notifications">Admin Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts for important events</p>
                </div>
                <Switch
                  id="admin-notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-alerts">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Send daily/weekly summary emails</p>
                </div>
                <Switch
                  id="email-alerts"
                  checked={emailAlerts}
                  onCheckedChange={setEmailAlerts}
                />
              </div>

              <div>
                <Label htmlFor="notification-frequency">Notification Frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly Digest</SelectItem>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                </div>
                <Switch
                  id="two-factor"
                  checked={twoFactorAuth}
                  onCheckedChange={setTwoFactorAuth}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="session-timeout">Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">Auto-logout period for inactive users</p>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>IP Whitelist</Label>
                <Input placeholder="Add IP address" />
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add IP
                </Button>
              </div>

              <div className="flex gap-2">
                <Button>
                  <Lock className="h-4 w-4 mr-2" />
                  Update Security Settings
                </Button>
                <Button variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  Regenerate API Keys
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data & Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data & Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Automatic Backups</p>
                    <p className="text-sm text-muted-foreground">Last backup: 2 hours ago</p>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Active</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Data Retention</p>
                    <p className="text-sm text-muted-foreground">Keep data for 365 days</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore Backup
                </Button>
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Manual Backup
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Role Management Section */}
          <AdminOnly>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Role Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search for users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={searchUsers} disabled={loading}>
                      {loading ? 'Searching...' : 'Search'}
                    </Button>
                  </div>

                  {users.length > 0 && (
                    <div className="space-y-3">
                      {users.map((userItem) => {
                        const RoleIcon = getRoleIcon(userItem.role);
                        return (
                          <div
                            key={userItem.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {userItem.firstName} {userItem.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{userItem.email}</p>
                              </div>
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(userItem.role)}`}>
                                <RoleIcon className="h-3 w-3" />
                                {userItem.role || 'viewer'}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {assignableRoles.map((role) => (
                                <Button
                                  key={role}
                                  size="sm"
                                  variant={userItem.role === role ? "default" : "outline"}
                                  onClick={() => updateUserRole(userItem.id, role)}
                                  disabled={userItem.id === user.id} // Can't change own role
                                >
                                  Make {role.charAt(0).toUpperCase() + role.slice(1)}
                                </Button>
                              ))}

                              {userItem.role && userItem.role !== 'viewer' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateUserRole(userItem.id, 'viewer' as Role)}
                                  disabled={userItem.id === user.id}
                                >
                                  Remove Role
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {users.length === 0 && searchTerm && (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No users found matching "{searchTerm}"</p>
                    </div>
                  )}

                  {!searchTerm && users.length === 0 && (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Search for users to manage their roles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </AdminOnly>

          {/* Alert Banner */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Important Notice</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Changes to security settings will take effect immediately. Please ensure you have
                    alternative access methods before enabling strict security measures.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default AdminSettingsPage;