'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  BookOpen,
  Brain,
  Users,
  TrendingUp,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Eye,
  BarChart3,
  Video,
  Target,
  Clock,
  Award,
  MoreVertical,
  Search,
  Filter,
  Calendar,
  UserCheck,
  User,
  PlayCircle,
  FileText,
  Settings,
  AlertCircle,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'draft' | 'published' | 'archived';
  students: number;
  avgScore: number;
  completion: number;
  author: string;
  createdAt: string;
}

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Simple admin check - allowing all authenticated users for now
  const isAdmin = true;

  if (!isAuthenticated || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Admin access required to view this page.</p>
          <Button asChild>
            <a href="/">Go Home</a>
          </Button>
        </div>
      </div>
    );
  }

  // Mock data
  const courses: Course[] = [
    {
      id: '1',
      title: 'GCSE Mathematics - Algebra Fundamentals',
      description: 'Master algebraic expressions, equations, and graphs',
      subject: 'Mathematics',
      difficulty: 'Intermediate',
      status: 'published',
      students: 245,
      avgScore: 78,
      completion: 82,
      author: 'Dr. Sarah Johnson',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Biology: Cell Structure and Function',
      description: 'Comprehensive guide to cellular biology and organelles',
      subject: 'Biology',
      difficulty: 'Beginner',
      status: 'published',
      students: 189,
      avgScore: 85,
      completion: 76,
      author: 'Prof. Michael Chen',
      createdAt: '2024-01-10'
    },
    {
      id: '3',
      title: 'English Literature - Shakespeare Analysis',
      description: 'In-depth analysis of Macbeth, Romeo and Juliet, and more',
      subject: 'English Literature',
      difficulty: 'Advanced',
      status: 'draft',
      students: 0,
      avgScore: 0,
      completion: 45,
      author: 'Dr. Emily Rodriguez',
      createdAt: '2024-01-20'
    },
    {
      id: '4',
      title: 'Chemistry: Atomic Structure and Bonding',
      description: 'Understanding atoms, molecules, and chemical bonds',
      subject: 'Chemistry',
      difficulty: 'Intermediate',
      status: 'published',
      students: 156,
      avgScore: 72,
      completion: 68,
      author: 'Dr. James Wilson',
      createdAt: '2024-01-08'
    }
  ];

  const students = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', enrolled: 4, progress: 68, lastActive: '2 hours ago' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', enrolled: 3, progress: 45, lastActive: '1 day ago' },
    { id: '3', name: 'Carol White', email: 'carol@example.com', enrolled: 5, progress: 82, lastActive: '30 minutes ago' },
    { id: '4', name: 'David Brown', email: 'david@example.com', enrolled: 2, progress: 23, lastActive: '3 days ago' },
  ];

  const platformStats = [
    { title: "Total Students", value: "1,247", change: "+12%", icon: Users, color: "text-blue-600" },
    { title: "Active Courses", value: "8", change: "+2", icon: BookOpen, color: "text-green-600" },
    { title: "Avg Completion", value: "73%", change: "+5%", icon: Target, color: "text-purple-600" },
    { title: "Satisfaction", value: "4.8", change: "+0.2", icon: Award, color: "text-orange-600" },
  ];

  const getStatusColor = (status: Course['status']) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: Course['difficulty']) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage courses, monitor students, and oversee platform performance
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-fit lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {platformStats.map((stat, index) => (
                <Card key={index} className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-green-600">{stat.change}</p>
                      </div>
                      <div className={`h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New course published</p>
                        <p className="text-xs text-muted-foreground">Chemistry: Atomic Structure</p>
                      </div>
                      <span className="text-xs text-muted-foreground">2h ago</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">15 new enrollments</p>
                        <p className="text-xs text-muted-foreground">Mathematics courses</p>
                      </div>
                      <span className="text-xs text-muted-foreground">5h ago</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Course updated</p>
                        <p className="text-xs text-muted-foreground">Biology content refreshed</p>
                      </div>
                      <span className="text-xs text-muted-foreground">1d ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full justify-start crayon-effect">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Course
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Students
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Platform Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Course Management</h2>
              <Button className="crayon-effect">
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </div>

            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground"
                />
              </div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground"
              >
                <option value="all">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
                <option value="English Literature">English Literature</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>

            <div className="space-y-4">
              {courses.map((course) => (
                <Card key={course.id} className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{course.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(course.status)}`}>
                            {course.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(course.difficulty)}`}>
                            {course.difficulty}
                          </span>
                        </div>
                        <p className="mb-3 text-sm text-muted-foreground">{course.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {course.subject}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {course.students} students
                          </span>
                          <span>by {course.author}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {course.students > 0 && (
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-muted-foreground">Avg Score: </span>
                            <span className="font-semibold">{course.avgScore}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Completion: </span>
                            <span className="font-semibold">{course.completion}%</span>
                          </div>
                        </div>
                        <div className="flex-1 ml-4">
                          <Progress value={course.completion} className="h-2" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Student Management</h2>
              <Button variant="outline">
                <UserCheck className="mr-2 h-4 w-4" />
                Export Students
              </Button>
            </div>

            <Card className="border-border">
              <CardContent className="p-0">
                <div className="space-y-1">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <p className="font-medium">{student.enrolled}</p>
                          <p className="text-muted-foreground">Courses</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{student.progress}%</p>
                          <p className="text-muted-foreground">Progress</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">{student.lastActive}</p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Content Library</h2>
              <Button className="crayon-effect">
                <Plus className="mr-2 h-4 w-4" />
                Upload Content
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Video className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-sm text-muted-foreground">24 videos</span>
                  </div>
                  <h3 className="font-semibold mb-1">Video Lessons</h3>
                  <p className="text-sm text-muted-foreground mb-4">Educational video content</p>
                  <Button variant="outline" size="sm" className="w-full">Manage Videos</Button>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-sm text-muted-foreground">156 files</span>
                  </div>
                  <h3 className="font-semibold mb-1">Documents</h3>
                  <p className="text-sm text-muted-foreground mb-4">PDFs, worksheets, and notes</p>
                  <Button variant="outline" size="sm" className="w-full">Browse Files</Button>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                    <span className="text-sm text-muted-foreground">48 quizzes</span>
                  </div>
                  <h3 className="font-semibold mb-1">Assessments</h3>
                  <p className="text-sm text-muted-foreground mb-4">Tests and quizzes</p>
                  <Button variant="outline" size="sm" className="w-full">View Assessments</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Analytics & Insights</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Last 30 days
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Enrollment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Chart placeholder</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Course Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Chart placeholder</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Platform Settings</h2>
              <Button className="crayon-effect">
                Save Changes
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Send email updates to students</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">Temporarily disable platform</p>
                    </div>
                    <Button variant="outline" size="sm">Disable</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Require 2FA for admin users</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Session Timeout</p>
                      <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                    </div>
                    <Button variant="outline" size="sm">30 min</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;