'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
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
} from "lucide-react";

const Settings = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Settings state
  const [profileSettings, setProfileSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
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

  const saveSettings = () => {
    // TODO: Implement actual settings save
    console.log('Saving settings...');
  };

  return (
    <DashboardLayout>
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
                          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-12 w-12 text-gray-400" />
                          </div>
                          <div>
                            <Button variant="outline" className="mb-2">
                              <Camera className="h-4 w-4 mr-2" />
                              Upload Photo
                            </Button>
                            <p className="text-sm text-gray-600">
                              JPG, PNG or GIF. Maximum 2MB.
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
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={profileSettings.name}
                              onChange={(e) => setProfileSettings(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={profileSettings.email}
                              onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
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
                      <CardContent className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">Change Password</p>
                              <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                            </div>
                            <Button variant="outline">Change Password</Button>
                          </div>

                          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                            </div>
                            <Button variant="outline">Enable 2FA</Button>
                          </div>
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
                            <Button variant="outline">Download Data</Button>
                          </div>

                          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">Privacy Policy</p>
                              <p className="text-sm text-gray-600">Read about how we protect and use your data</p>
                            </div>
                            <Button variant="outline">View Policy</Button>
                          </div>

                          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                            <div>
                              <p className="font-medium text-red-900">Delete Account</p>
                              <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                            </div>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
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
    </DashboardLayout>
  );
};

export default Settings;