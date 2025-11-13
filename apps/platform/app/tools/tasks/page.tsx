'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  CheckSquare,
  Clock,
  Target,
  AlertCircle,
  ChevronRight,
  Plus,
  Filter,
  Calendar,
  BookOpen,
  BarChart3,
  Star,
  Flag,
  CheckCircle,
  Circle,
  Archive,
} from "lucide-react";

const Tasks = () => {
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
          <p className="text-muted-foreground mb-4">Please sign in to access your tasks.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <UnifiedLayout userRole="student" title="Tasks">
      <div className="bg-gray-50 flex-1">
        <div className="px-6 py-8">
          {/* Coming Soon Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 mx-auto">
              <CheckSquare className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Tasks</h1>
            <p className="text-xl text-gray-600 mb-8">Coming Soon!</p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              We're building a comprehensive task management system to help you organize assignments, set goals, and track your academic progress. Get ready to boost your productivity!
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <CheckSquare className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Task Management</h3>
                </div>
                <p className="text-gray-700">
                  Create, organize, and track assignments, homework, and personal study tasks with priority levels.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Target className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">Goal Setting</h3>
                </div>
                <div className="text-gray-700">
                  Set SMART goals for your academic achievements and track your progress towards them.
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-purple-900">Progress Analytics</h3>
                </div>
                <p className="text-gray-700">
                  Visualize your task completion patterns and improve your time management skills.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Task List Placeholder */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">My Tasks</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>

              {/* Task Categories */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4 text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>High Priority (0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Medium Priority (0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Low Priority (0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>Completed (0)</span>
                  </div>
                </div>
              </div>

              {/* Task List Placeholder */}
              <div className="space-y-3">
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">Task List</p>
                  <p className="text-gray-400">
                    Your organized task list will appear here once launched.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Categories Preview */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="font-semibold">Academic Tasks</h3>
                </div>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Homework assignments</span>
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Project deadlines</span>
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Exam preparation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Star className="w-6 h-6 text-yellow-600 mr-3" />
                  <h3 className="font-semibold">Personal Goals</h3>
                </div>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Daily study targets</span>
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Weekly objectives</span>
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Skill development</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="w-6 h-6 text-purple-600 mr-3" />
                  <h3 className="font-semibold">Recurring Tasks</h3>
                </div>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Daily reviews</span>
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Weekly summaries</span>
                  </li>
                  <li className="flex items-center">
                    <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Monthly goals</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Preview */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Task Analytics</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-900">24</p>
                  <p className="text-sm text-blue-700">Tasks Created</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-900">18</p>
                  <p className="text-sm text-green-700">Tasks Completed</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-900">75%</p>
                  <p className="text-sm text-yellow-700">Completion Rate</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-900">3.5</p>
                  <p className="text-sm text-purple-700">Avg. Days/Task</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Get Notified</h3>
                <p className="text-green-800">
                  Want early access to the Tasks manager and special features?
                  <Button variant="link" className="text-green-600 underline ml-1 p-0 h-auto">
                    Join our beta program
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

export default Tasks;