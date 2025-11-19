'use client';

import React, { useState } from 'react';
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
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';

const AdminSettingsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

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