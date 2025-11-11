'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import {
  BarChart3,
  Users,
  BookOpen,
  Video,
  Plus,
  TrendingUp,
  Clock,
  Target,
  Award,
  Settings,
  FileText,
  Edit3,
  Trash2,
  Eye,
  Download,
  Upload,
  Monitor,
  Brain,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Mock admin data
  const dashboardStats = {
    totalStudents: 1247,
    activeStudents: 892,
    totalCourses: 12,
    totalVideos: 156,
    totalQuestions: 2340,
    averageScore: 76,
    completionRate: 68,
    weeklyActiveStudents: 567,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'student_enrolled',
      message: '25 new students enrolled this week',
      time: '2 hours ago',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      id: 2,
      type: 'video_uploaded',
      message: 'New video "Cell Division" uploaded',
      time: '4 hours ago',
      icon: Video,
      color: 'text-green-600',
    },
    {
      id: 3,
      type: 'course_created',
      message: 'Course "Advanced Chemistry" published',
      time: '1 day ago',
      icon: BookOpen,
      color: 'text-purple-600',
    },
    {
      id: 4,
      type: 'high_score',
      message: 'New high score record: 98% on Mathematics quiz',
      time: '2 days ago',
      icon: Award,
      color: 'text-yellow-600',
    },
  ];

  const topPerformingCourses = [
    {
      id: 'mathematics',
      name: 'Mathematics',
      students: 456,
      avgScore: 82,
      completion: 74,
      trend: 'up',
      icon: BarChart3,
    },
    {
      id: 'biology',
      name: 'Biology',
      students: 389,
      avgScore: 78,
      completion: 81,
      trend: 'up',
      icon: Brain,
    },
    {
      id: 'english',
      name: 'English Literature',
      students: 312,
      avgScore: 71,
      completion: 62,
      trend: 'down',
      icon: FileText,
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      students: 267,
      avgScore: 76,
      completion: 69,
      trend: 'stable',
      icon: Monitor,
    },
  ];

  const contentManagement = {
    pendingVideos: 8,
    pendingQuestions: 23,
    draftCourses: 3,
    scheduledContent: 5,
  };

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  // Simple admin check - in real app, this would check user roles
  const isAdmin = user?.email?.includes('admin') || true;

  if (!isAuthenticated || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Admin access required to view this page.</p>
          <Button asChild>
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage courses, content, and monitor student progress</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
              <Button asChild>
                <a href="/dashboard">
                  <Monitor className="h-4 w-4 mr-1" />
                  View Student View
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create Course</h3>
                    <p className="text-sm text-gray-600">Add new learning path</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Upload className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Upload Video</h3>
                    <p className="text-sm text-gray-600">Add video content</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Edit3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Questions</h3>
                    <p className="text-sm text-gray-600">Edit quiz content</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">View Students</h3>
                    <p className="text-sm text-gray-600">Student management</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalStudents.toLocaleString()}</p>
                  <p className="text-sm text-green-600">+{dashboardStats.weeklyActiveStudents} this week</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalCourses}</p>
                  <p className="text-sm text-gray-600">{dashboardStats.totalVideos} total videos</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.averageScore}%</p>
                  <p className="text-sm text-green-600">+3% this month</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.completionRate}%</p>
                  <p className="text-sm text-yellow-600">+2% improvement</p>
                </div>
                <Award className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Performing Courses */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Performing Courses
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/admin/courses">View All</a>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformingCourses.map((course) => (
                    <div key={course.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <course.icon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{course.name}</h3>
                            <p className="text-sm text-gray-600">{course.students} students enrolled</p>
                          </div>
                        </div>
                        <div className={`text-sm ${
                          course.trend === 'up' ? 'text-green-600' :
                          course.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {course.trend === 'up' && '↑'}
                          {course.trend === 'down' && '↓'}
                          {course.trend === 'stable' && '→'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Avg Score</span>
                            <span className="font-medium text-gray-900">{course.avgScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${course.avgScore}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Completion</span>
                            <span className="font-medium text-gray-900">{course.completion}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${course.completion}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{activity.message}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Management Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Content Management
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/admin/content">Manage</a>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-900">Pending Videos</span>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      {contentManagement.pendingVideos}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-900">Pending Questions</span>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      {contentManagement.pendingQuestions}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-900">Draft Courses</span>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {contentManagement.draftCourses}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-900">Scheduled Content</span>
                    </div>
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                      {contentManagement.scheduledContent}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-900">All systems operational</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-900">Video processing normal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-900">High traffic detected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-900">Database backup complete</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;