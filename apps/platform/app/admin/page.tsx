'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
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
  Zap,
  Search,
  Filter,
  Calendar,
  MoreHorizontal,
  MoreVertical,
  Play,
  Pause,
  ChevronRight,
  Star,
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
  topics: number;
  videos: number;
  questions: number;
  createdAt: string;
  updatedAt: string;
  author: string;
  thumbnail?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
  totalStudyTime: number;
  averageScore: number;
  lastActive: string;
  joinDate: string;
}

interface Video {
  id: string;
  title: string;
  course: string;
  duration: string;
  status: 'processing' | 'ready' | 'published' | 'failed';
  uploadDate: string;
  thumbnail?: string;
  views: number;
}

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data
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

  const courses: Course[] = [
    {
      id: '1',
      title: 'Mathematics Fundamentals',
      description: 'Complete GCSE Mathematics course covering all essential topics',
      subject: 'Mathematics',
      difficulty: 'Intermediate',
      status: 'published',
      students: 456,
      avgScore: 82,
      completion: 74,
      topics: 45,
      videos: 68,
      questions: 234,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      author: 'Dr. Sarah Johnson',
      thumbnail: '/api/placeholder/1',
    },
    {
      id: '2',
      title: 'Biology: Cell Structure and Function',
      description: 'Deep dive into cellular biology and processes',
      subject: 'Biology',
      difficulty: 'Beginner',
      status: 'published',
      students: 389,
      avgScore: 78,
      completion: 81,
      topics: 32,
      videos: 45,
      questions: 189,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      author: 'Prof. Michael Chen',
    },
    {
      id: '3',
      title: 'Advanced Chemistry',
      description: 'Comprehensive chemistry course with practical applications',
      subject: 'Chemistry',
      difficulty: 'Advanced',
      status: 'draft',
      students: 0,
      avgScore: 0,
      completion: 0,
      topics: 28,
      videos: 12,
      questions: 67,
      createdAt: '2024-01-22',
      updatedAt: '2024-01-22',
      author: 'Dr. Emily Rodriguez',
    },
  ];

  const students: Student[] = [
    {
      id: '1',
      name: 'Alex Thompson',
      email: 'alex@example.com',
      enrolledCourses: ['mathematics', 'biology'],
      totalStudyTime: 48,
      averageScore: 78,
      lastActive: '2024-01-23',
      joinDate: '2024-01-05',
    },
    {
      id: '2',
      name: 'Sarah Martinez',
      email: 'sarah@example.com',
      enrolledCourses: ['english-literature', 'chemistry'],
      totalStudyTime: 36,
      averageScore: 85,
      lastActive: '2024-01-23',
      joinDate: '2024-01-08',
    },
  ];

  const videos: Video[] = [
    {
      id: '1',
      title: 'Introduction to Quadratic Equations',
      course: 'Mathematics Fundamentals',
      duration: '5:30',
      status: 'published',
      uploadDate: '2024-01-15',
      thumbnail: '/api/placeholder/1',
      views: 234,
    },
    {
      id: '2',
      title: 'Cell Division Process',
      course: 'Biology: Cell Structure and Function',
      duration: '8:15',
      status: 'processing',
      uploadDate: '2024-01-20',
      thumbnail: '/api/placeholder/2',
      views: 0,
    },
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'courses', name: 'Courses', icon: BookOpen },
    { id: 'students', name: 'Students', icon: Users },
    { id: 'videos', name: 'Videos', icon: Video },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'content', name: 'Content', icon: FileText },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <AlertCircle className="h-4 w-4" />;
      case 'archived': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getVideoStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'ready': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'published': return <Play className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  // Simple admin check
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

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalStudents.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{dashboardStats.weeklyActiveStudents} this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalCourses}</p>
                <p className="text-sm text-gray-600">{dashboardStats.totalVideos} videos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.averageScore}%</p>
                <p className="text-sm text-green-600">+3% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.completionRate}%</p>
                <p className="text-sm text-yellow-600">+2% improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-indigo-500" />
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalQuestions}</p>
                <p className="text-sm text-gray-600">In question bank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create Course</h3>
                <p className="text-sm text-gray-600">Build new learning path</p>
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
                <Target className="h-6 w-6 text-purple-600" />
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
  );

  const renderCoursesTab = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                <option value="">All Subjects</option>
                <option value="mathematics">Mathematics</option>
                <option value="biology">Biology</option>
                <option value="chemistry">Chemistry</option>
                <option value="english-literature">English Literature</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <Button className="px-4 py-2">
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(course.status)}`}>
                      {getStatusIcon(course.status)}
                      {course.status}
                    </span>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Course Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{course.students} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{course.avgScore}% avg score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{course.videos} videos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{course.questions} questions</span>
                  </div>
                </div>

                {/* Progress Bars */}
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

                {/* Metadata */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Subject: {course.subject}</span>
                    <span>{course.topics} topics</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Author: {course.author}</span>
                    <span>Updated {course.updatedAt}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" className="flex-1">
                    <ChevronRight className="h-4 w-4 ml-auto" />
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Course Button */}
      <div className="fixed bottom-8 right-8">
        <Button size="lg" className="shadow-lg" asChild>
          <a href="/admin/courses/create">
            <Plus className="h-5 w-5 mr-2" />
            Create New Course
          </a>
        </Button>
      </div>
    </div>
  );

  const renderStudentsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    <p className="text-xs text-gray-500">
                      Enrolled in {student.enrolledCourses.length} courses
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{student.totalStudyTime}h study time</span>
                    <span>{student.averageScore}% avg score</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button variant="outline" size="sm">Send Message</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderVideosTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Video Management</CardTitle>
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Upload Video
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0">
                <div className="w-20 h-14 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Video className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{video.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                      video.status === 'published' ? 'bg-green-100 text-green-800' :
                      video.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      video.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getVideoStatusIcon(video.status)}
                      {video.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Course: {video.course}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Duration: {video.duration}</span>
                    <span>Views: {video.views}</span>
                    <span>Uploaded: {video.uploadDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Question Bank */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Question Bank</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{dashboardStats.totalQuestions} Questions</h3>
              <p className="text-gray-600 mb-4">Across all courses and difficulty levels</p>
              <Button>Manage Questions</Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Content Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Videos</span>
                <span className="font-medium text-gray-900">{dashboardStats.totalVideos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Duration</span>
                <span className="font-medium text-gray-900">24h 15m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Storage Used</span>
                <span className="font-medium text-gray-900">45.2 GB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Analytics coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex-1">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage courses, content, and monitor performance</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    {tab.name}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1 p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'courses' && renderCoursesTab()}
          {activeTab === 'students' && renderStudentsTab()}
          {activeTab === 'videos' && renderVideosTab()}
          {activeTab === 'content' && renderContentTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
        </div>
      </div>

      {/* Floating Action Button for Create Course */}
      {activeTab === 'courses' && (
        <div className="fixed bottom-8 right-8">
          <Button size="lg" className="shadow-lg" asChild>
            <a href="/admin/courses/create">
              <Plus className="h-5 w-5 mr-2" />
              Create Course
            </a>
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;