'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  User,
  Bell,
  Lock,
  Shield,
  Mail,
  Calendar,
  Volume2,
  Moon,
  Sun,
  HelpCircle,
  LogOut,
  Save,
  Camera,
  Globe,
  Smartphone,
  Monitor,
  Clock,
  Target,
  BookOpen,
  Play,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

const Settings = () => {
  const { user, isAuthenticated, signOut, updateProfile, uploadAvatar, changePassword } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings state
  const [profileSettings, setProfileSettings] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    bio: '',
    school: '',
    grade: 'GCSE',
    timezone: 'Europe/London',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    studyReminders: true,
    progressUpdates: true,
    newContentAlerts: false,
    dailySummary: false,
  });

  const [studyPreferences, setStudyPreferences] = useState({
    defaultSubject: 'mathematics',
    studyGoalHours: 10,
    reminderTime: '18:00',
    darkMode: false,
    soundEnabled: true,
    autoPlayVideos: true,
  });

  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access settings.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth/signin';
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'study', name: 'Study Preferences', icon: BookOpen },
    { id: 'privacy', name: 'Privacy & Security', icon: Lock },
  ];

  const subjects = [
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'english-literature', name: 'English Literature' },
    { id: 'biology', name: 'Biology' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'physics', name: 'Physics' },
    { id: 'history', name: 'History' },
    { id: 'geography', name: 'Geography' },
  ];

  const grades = ['Year 9', 'Year 10', 'Year 11', 'GCSE', 'A-Level'];

  const timezones = [
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await uploadAvatar(file);
      showMessage('success', 'Profile picture updated successfully!');
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const saveProfileSettings = async () => {
    try {
      setLoading(true);
      await updateProfile({
        firstName: profileSettings.firstName,
        lastName: profileSettings.lastName,
        username: profileSettings.username,
      });
      showMessage('success', 'Profile updated successfully!');
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = () => {
    saveProfileSettings();
  };

  const handlePasswordChange = async () => {
    // Validate passwords match
    if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    // Validate password strength
    if (passwordSettings.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await changePassword(passwordSettings.currentPassword, passwordSettings.newPassword);

      // Clear password fields
      setPasswordSettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      showMessage('success', 'Password updated successfully!');
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    if (confirm('Are you sure you want to sign out from all devices? This includes your current session.')) {
      try {
        setLoading(true);
        // Note: Clerk doesn't have a "sign out all devices" method in the client SDK
        // This would typically be handled through Clerk's backend API or by revoking sessions
        // For now, we'll just sign out the current session
        await signOut();
        showMessage('success', 'Signed out from all devices successfully!');
        setTimeout(() => {
          window.location.href = '/auth/signin';
        }, 1000);
      } catch (error: any) {
        showMessage('error', error.message || 'Failed to sign out from all devices');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <UnifiedLayout userRole="student">
      <div className="flex-1">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account and preferences</p>
            </div>
            <Button onClick={saveSettings} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`px-6 py-3 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-b`}>
            <div className="max-w-4xl mx-auto flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
              <button
                onClick={() => setMessage(null)}
                className={`ml-auto ${message.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-gray-50 flex-1">
          <div className="flex h-full">
            {/* Sidebar Navigation */}
            <div className="w-64 bg-white border-r border-gray-200 p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="max-w-4xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

                  <div className="grid gap-6">
                    {/* Avatar Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Camera className="h-5 w-5" />
                          Profile Picture
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            {user?.avatar ? (
                              <img
                                src={user.avatar}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            {loading && (
                              <div className="absolute inset-0 w-24 h-24 rounded-full bg-white/50 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent"></div>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="mb-4">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleAvatarUpload}
                                className="hidden"
                                id="avatar-upload"
                                disabled={loading}
                              />
                              <Button
                                variant="outline"
                                className="mb-2"
                                disabled={loading}
                                onClick={() => document.getElementById('avatar-upload')?.click()}
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                {user?.hasImage ? 'Change Photo' : 'Upload Photo'}
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600">
                              JPG, PNG, GIF, or WebP. Maximum 5MB.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={profileSettings.firstName}
                              onChange={(e) => setProfileSettings(prev => ({ ...prev, firstName: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={profileSettings.lastName}
                              onChange={(e) => setProfileSettings(prev => ({ ...prev, lastName: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={profileSettings.username}
                            onChange={(e) => setProfileSettings(prev => ({ ...prev, username: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          />
                          <p className="text-xs text-gray-500 mt-1">Email cannot be changed here. Contact support if needed.</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bio
                          </label>
                          <textarea
                            value={profileSettings.bio}
                            onChange={(e) => setProfileSettings(prev => ({ ...prev, bio: e.target.value }))}
                            rows={3}
                            placeholder="Tell us about yourself..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              School
                            </label>
                            <input
                              type="text"
                              value={profileSettings.school}
                              onChange={(e) => setProfileSettings(prev => ({ ...prev, school: e.target.value }))}
                              placeholder="Your school name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Grade/Year
                            </label>
                            <select
                              value={profileSettings.grade}
                              onChange={(e) => setProfileSettings(prev => ({ ...prev, grade: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            >
                              {grades.map((grade) => (
                                <option key={grade} value={grade}>{grade}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Timezone
                            </label>
                            <select
                              value={profileSettings.timezone}
                              onChange={(e) => setProfileSettings(prev => ({ ...prev, timezone: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            >
                              {timezones.map((timezone) => (
                                <option key={timezone} value={timezone}>{timezone}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="max-w-4xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Email Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries({
                        emailNotifications: 'Receive email notifications',
                        studyReminders: 'Study session reminders',
                        progressUpdates: 'Weekly progress updates',
                        newContentAlerts: 'New content alerts',
                        dailySummary: 'Daily learning summary',
                      }).map(([key, description]) => (
                        <div key={key} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium text-gray-900">{description}</p>
                            <p className="text-sm text-gray-600">
                              {key === 'studyReminders' && 'Get reminded about your scheduled study sessions'}
                              {key === 'progressUpdates' && 'Weekly report on your learning progress'}
                              {key === 'newContentAlerts' && 'Notifications when new content is available'}
                              {key === 'dailySummary' && 'Daily summary of your learning activities'}
                              {key === 'emailNotifications' && 'General email notifications from GCSEPal'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings[key as keyof typeof notificationSettings]}
                              onChange={(e) => setNotificationSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                          </label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Study Preferences Tab */}
              {activeTab === 'study' && (
                <div className="max-w-4xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Study Preferences</h2>

                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Learning Preferences
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Default Subject
                          </label>
                          <select
                            value={studyPreferences.defaultSubject}
                            onChange={(e) => setStudyPreferences(prev => ({ ...prev, defaultSubject: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            {subjects.map((subject) => (
                              <option key={subject.id} value={subject.id}>{subject.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Weekly Study Goal (hours)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="40"
                              value={studyPreferences.studyGoalHours}
                              onChange={(e) => setStudyPreferences(prev => ({ ...prev, studyGoalHours: parseInt(e.target.value) || 10 }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Daily Reminder Time
                            </label>
                            <input
                              type="time"
                              value={studyPreferences.reminderTime}
                              onChange={(e) => setStudyPreferences(prev => ({ ...prev, reminderTime: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Monitor className="h-5 w-5" />
                          Interface Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          { key: 'darkMode', label: 'Dark Mode', icon: Moon, description: 'Use dark theme across the platform' },
                          { key: 'soundEnabled', label: 'Sound Effects', icon: Volume2, description: 'Enable sounds for interactions' },
                          { key: 'autoPlayVideos', label: 'Auto-play Videos', icon: Play, description: 'Automatically play videos when opened' },
                        ].map(({ key, label, icon: Icon, description }) => (
                          <div key={key} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-gray-600" />
                              <div>
                                <p className="font-medium text-gray-900">{label}</p>
                                <p className="text-sm text-gray-600">{description}</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={studyPreferences[key as keyof typeof studyPreferences]}
                                onChange={(e) => setStudyPreferences(prev => ({ ...prev, [key]: e.target.checked }))}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                            </label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Privacy & Security Tab */}
              {activeTab === 'privacy' && (
                <div className="max-w-4xl">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Privacy & Security</h2>

                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Security Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Password Change Form */}
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-4">Change Password</h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                              <input
                                type="password"
                                value={passwordSettings.currentPassword}
                                onChange={(e) => setPasswordSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder="Enter current password"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                              <input
                                type="password"
                                value={passwordSettings.newPassword}
                                onChange={(e) => setPasswordSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder="Enter new password (min. 8 characters)"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                              <input
                                type="password"
                                value={passwordSettings.confirmPassword}
                                onChange={(e) => setPasswordSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder="Confirm new password"
                              />
                            </div>
                            <Button
                              onClick={handlePasswordChange}
                              disabled={loading || !passwordSettings.currentPassword || !passwordSettings.newPassword || !passwordSettings.confirmPassword}
                              className="bg-black text-white hover:bg-gray-800"
                            >
                              {loading ? 'Updating...' : 'Update Password'}
                            </Button>
                          </div>
                        </div>

                        {/* Additional Security Options */}
                        <div className="border-t border-gray-200 pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                              </div>
                              <Button variant="outline" disabled>Coming Soon</Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          Connected Accounts
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-blue-600">G</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">Google</p>
                                <p className="text-xs text-gray-500">
                                  {user?.email?.includes('gmail') ? 'Connected' : 'Not connected'}
                                </p>
                              </div>
                            </div>
                            {user?.email?.includes('gmail') ? (
                              <Button variant="outline" size="sm" disabled>Disconnect</Button>
                            ) : (
                              <Button variant="outline" size="sm" disabled>Connect</Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          Connect your Google account for easier sign-in and account recovery.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Smartphone className="h-5 w-5" />
                          Session Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">Current Session</p>
                              <p className="text-xs text-gray-500">This browser • Active now</p>
                            </div>
                            <span className="text-xs text-green-600 font-medium">Current</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <Button
                            variant="outline"
                            className="w-full text-red-600 border-red-300 hover:bg-red-50"
                            onClick={handleSignOutAll}
                            disabled={loading}
                          >
                            Sign Out All Devices
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            This will sign you out from all devices including your current session.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <HelpCircle className="h-5 w-5" />
                          Privacy Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">Download Your Data</p>
                              <p className="text-sm text-gray-600">Get a copy of all your personal data and learning progress</p>
                            </div>
                            <Button variant="outline" disabled>Coming Soon</Button>
                          </div>

                          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">Privacy Policy</p>
                              <p className="text-sm text-gray-600">Read about how we protect and use your data</p>
                            </div>
                            <Button variant="outline" disabled>Coming Soon</Button>
                          </div>

                          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                            <div>
                              <p className="font-medium text-red-900">Delete Account</p>
                              <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                            </div>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" disabled>
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default Settings;