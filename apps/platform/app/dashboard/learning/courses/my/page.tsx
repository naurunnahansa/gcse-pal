'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/AuthProvider";
import { useEnrollments } from "@/hooks/useEnrollments";
import {
  BookOpen,
  Play,
  Clock,
  Award,
  TrendingUp,
  CheckCircle,
  Circle,
  Calendar,
  BarChart3,
  Target,
  Users,
  Star,
  Filter,
  Search,
  Loader2,
} from "lucide-react";

const MyCourses = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: enrollmentsData, loading, error, refresh } = useEnrollments();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to get course URL from course ID
  const getCourseUrl = (courseId: string) => {
    return `/learning/${courseId}`;
  };

  const statusOptions = ['all', 'pending', 'active', 'completed'];

  // Filter courses based on search and status
  const filteredCourses = useMemo(() => {
    if (!enrollmentsData?.enrollments) return [];

    return enrollmentsData.enrollments.filter(enrollment => {
      const course = enrollment.course;
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || enrollment.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [enrollmentsData, searchTerm, selectedStatus]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (!enrollmentsData?.statistics) {
      return {
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalTimeSpent: 0,
        averageProgress: 0,
        totalAchievements: 0
      };
    }

    const stats = enrollmentsData.statistics;
    return {
      totalCourses: stats.totalEnrollments,
      completedCourses: stats.completedCourses,
      inProgressCourses: stats.inProgressCourses,
      totalTimeSpent: 0, // This would need to be calculated from study sessions if needed
      averageProgress: stats.averageProgress,
      totalAchievements: 0 // Achievements system not implemented yet
    };
  }, [enrollmentsData]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to view your courses.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error Loading Courses</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'active': return <Circle className="h-4 w-4" />;
      case 'pending': return <Circle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'active': return 'In Progress';
      case 'pending': return 'Not Started';
      default: return status;
    }
  };

  return (
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
            <p className="text-gray-600">Track your learning progress and continue your courses</p>
          </div>
        </div>

        <div className="bg-gray-50 flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{overallStats.totalCourses}</p>
                      <p className="text-sm text-gray-600">Total Courses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{overallStats.completedCourses}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{overallStats.averageProgress}%</p>
                      <p className="text-sm text-gray-600">Avg Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{Math.round(overallStats.totalTimeSpent)}</p>
                      <p className="text-sm text-gray-600">Hours Learned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Award className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{overallStats.totalAchievements}</p>
                      <p className="text-sm text-gray-600">Achievements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                </div>

                {statusOptions.map(status => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                    className={selectedStatus === status ? "bg-black" : ""}
                  >
                    {status === 'all' ? 'All Courses' : getStatusText(status)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredCourses.map((enrollment) => (
                <Card key={enrollment.id} className="group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 mb-2">
                          {enrollment.course.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mb-1">Instructor: {enrollment.course.instructor}</p>
                        <p className="text-xs text-gray-500 mb-2">{enrollment.course.subject} • {enrollment.course.level}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(enrollment.status)}`}>
                            {getStatusIcon(enrollment.status)}
                            {getStatusText(enrollment.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{enrollment.course.description}</p>

                    {/* Progress Overview */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm font-medium">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {Math.round((enrollment.progress / 100) * enrollment.course.totalLessons)} of {enrollment.course.totalLessons} lessons
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(enrollment.course.duration / 60)}h total duration
                        </span>
                      </div>
                    </div>

                    {/* Course Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Chapters</p>
                        <p className="font-medium text-gray-900">{enrollment.course.chaptersCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Difficulty</p>
                        <p className="font-medium text-gray-900 capitalize">{enrollment.course.difficulty}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {enrollment.status === 'completed' ? (
                        <Button className="flex-1" variant="outline">
                          <Award className="h-4 w-4 mr-2" />
                          View Certificate
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 bg-black text-white hover:bg-gray-800"
                          onClick={() => router.push(getCourseUrl(enrollment.course.id))}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {enrollment.status === 'active' ? 'Continue Learning' : 'Start Course'}
                        </Button>
                      )}
                    </div>

                    {/* Course Details */}
                    <div className="text-xs text-gray-500 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                        <span>Last accessed: {new Date(enrollment.lastAccessed).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* No Courses Found */}
            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedStatus !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Start by browsing available courses'
                  }
                </p>
                <Button asChild>
                  <a href="/learning/courses/browse">Browse Courses</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default MyCourses;