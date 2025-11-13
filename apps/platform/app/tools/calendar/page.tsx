'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  Calendar,
  Clock,
  BookOpen,
  Target,
  AlertCircle,
  ChevronRight,
  Plus,
  Filter,
  BarChart3,
} from "lucide-react";

const StudyCalendar = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access your study calendar.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <UnifiedLayout userRole="student" title="Study Calendar">
      <div className="bg-gray-50 flex-1">
        <div className="px-6 py-8">
          {/* Coming Soon Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 mx-auto">
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Study Calendar</h1>
            <p className="text-xl text-gray-600 mb-8">Coming Soon!</p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              We're working on a comprehensive study calendar to help you plan and track your learning schedule. Stay tuned for updates!
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">Smart Scheduling</h3>
                </div>
                <p className="text-gray-700">
                  Plan your study sessions with intelligent scheduling based on your course progress and learning goals.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <BookOpen className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Course Integration</h3>
                </div>
                <p className="text-gray-700">
                  Automatically sync with your enrolled courses and deadlines to create the perfect study plan.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-purple-900">Progress Tracking</h3>
                </div>
                <p className="text-gray-700">
                  Visualize your study habits and track your progress across all subjects with detailed analytics.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Placeholder */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Calendar View</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </div>
              </div>

              {/* Calendar Grid Placeholder */}
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">Interactive Calendar</p>
                <p className="text-gray-400">
                  Your personalized study calendar will appear here once launched.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Features */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">📅 Study Sessions</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-green-500 mr-2" />
                    <span>Scheduled video lessons</span>
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-green-500 mr-2" />
                    <span>Reading assignments</span>
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-green-500 mr-2" />
                    <span>Quiz and exam reminders</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">⚡ Smart Features</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-blue-500 mr-2" />
                    <span>AI-powered scheduling</span>
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-blue-500 mr-2" />
                    <span>Optimal study time suggestions</span>
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-blue-500 mr-2" />
                    <span>Deadline tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Notification */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Stay Updated</h3>
                <p className="text-blue-800">
                  Want to be notified when the Study Calendar launches?
                  <Button variant="link" className="text-blue-600 underline ml-1 p-0 h-auto">
                    Join our waitlist
                  </Button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default StudyCalendar;