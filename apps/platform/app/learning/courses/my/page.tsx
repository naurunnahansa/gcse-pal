'use client';

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { useAuth } from "@/components/AuthProvider";
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
} from "lucide-react";

const MyCourses = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Sample enrolled courses data
  const myCourses = [
    {
      id: 1,
      title: "GCSE Mathematics Complete Course",
      subject: "Mathematics",
      instructor: "Dr. Sarah Johnson",
      description: "Master all topics required for GCSE Mathematics including algebra, geometry, statistics, and more.",
      thumbnail: "/api/placeholder/300/200",
      totalLessons: 145,
      completedLessons: 98,
      progress: 68,
      status: "in_progress",
      enrolledDate: "2024-01-15",
      lastAccessed: "2024-01-28",
      timeSpent: 45.5, // hours
      nextLesson: "Quadratic Equations - Part 3",
      estimatedCompletion: "2024-03-20",
      currentModule: "Algebra",
      modules: [
        { name: "Number Theory", progress: 100, lessons: 25 },
        { name: "Algebra", progress: 85, lessons: 40 },
        { name: "Geometry", progress: 45, lessons: 35 },
        { name: "Statistics", progress: 30, lessons: 25 },
        { name: "Probability", progress: 0, lessons: 20 },
      ],
      achievements: ["Fast Learner", "Problem Solver"],
      rating: 4.8
    },
    {
      id: 2,
      title: "English Literature: Shakespeare & Poetry",
      subject: "English Literature",
      instructor: "Prof. Michael Chen",
      description: "Explore Shakespeare's major works and develop skills in poetry analysis and essay writing.",
      thumbnail: "/api/placeholder/300/200",
      totalLessons: 98,
      completedLessons: 45,
      progress: 46,
      status: "in_progress",
      enrolledDate: "2024-01-20",
      lastAccessed: "2024-01-27",
      timeSpent: 28.3,
      nextLesson: "Macbeth - Act 2 Analysis",
      estimatedCompletion: "2024-04-15",
      currentModule: "Shakespeare Studies",
      modules: [
        { name: "Poetry Analysis", progress: 100, lessons: 20 },
        { name: "Shakespeare Studies", progress: 60, lessons: 35 },
        { name: "Essay Writing", progress: 25, lessons: 25 },
        { name: "Modern Literature", progress: 0, lessons: 18 },
      ],
      achievements: ["Critical Thinker"],
      rating: 4.9
    },
    {
      id: 3,
      title: "GCSE Biology: Life Sciences",
      subject: "Biology",
      instructor: "Dr. Emily Roberts",
      description: "Complete coverage of GCSE Biology including cell biology, genetics, ecology, and human biology.",
      thumbnail: "/api/placeholder/300/200",
      totalLessons: 112,
      completedLessons: 112,
      progress: 100,
      status: "completed",
      enrolledDate: "2023-09-10",
      lastAccessed: "2024-01-25",
      timeSpent: 78.2,
      nextLesson: null,
      estimatedCompletion: "2024-01-15",
      currentModule: "Completed",
      modules: [
        { name: "Cell Biology", progress: 100, lessons: 30 },
        { name: "Genetics", progress: 100, lessons: 28 },
        { name: "Ecology", progress: 100, lessons: 25 },
        { name: "Human Biology", progress: 100, lessons: 29 },
      ],
      achievements: ["Biology Master", "Perfect Score", "Consistent Learner"],
      rating: 4.7
    },
    {
      id: 4,
      title: "Chemistry Fundamentals",
      subject: "Chemistry",
      instructor: "Dr. James Wilson",
      description: "Learn atomic structure, chemical reactions, organic chemistry, and practical laboratory skills.",
      thumbnail: "/api/placeholder/300/200",
      totalLessons: 105,
      completedLessons: 12,
      progress: 11,
      status: "not_started",
      enrolledDate: "2024-01-25",
      lastAccessed: "2024-01-25",
      timeSpent: 2.1,
      nextLesson: "Introduction to Atomic Structure",
      estimatedCompletion: "2024-06-30",
      currentModule: "Introduction",
      modules: [
        { name: "Atomic Structure", progress: 20, lessons: 25 },
        { name: "Chemical Reactions", progress: 0, lessons: 30 },
        { name: "Organic Chemistry", progress: 0, lessons: 25 },
        { name: "Laboratory Skills", progress: 0, lessons: 25 },
      ],
      achievements: [],
      rating: 4.6
    }
  ];

  const statusOptions = ['all', 'not_started', 'in_progress', 'completed'];

  // Filter courses based on search and status
  const filteredCourses = useMemo(() => {
    return myCourses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || course.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [myCourses, searchTerm, selectedStatus]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalCourses = myCourses.length;
    const completedCourses = myCourses.filter(course => course.status === 'completed').length;
    const inProgressCourses = myCourses.filter(course => course.status === 'in_progress').length;
    const totalTimeSpent = myCourses.reduce((sum, course) => sum + course.timeSpent, 0);
    const averageProgress = myCourses.reduce((sum, course) => sum + course.progress, 0) / totalCourses;
    const totalAchievements = myCourses.reduce((sum, course) => sum + course.achievements.length, 0);

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalTimeSpent,
      averageProgress: Math.round(averageProgress),
      totalAchievements
    };
  }, [myCourses]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'not_started': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Circle className="h-4 w-4" />;
      case 'not_started': return <Circle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      default: return status;
    }
  };

  return (
    <UnifiedLayout userRole="student">
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
              {filteredCourses.map((course) => (
                <Card key={course.id} className="group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 mb-2">
                          {course.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mb-1">Instructor: {course.instructor}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(course.status)}`}>
                            {getStatusIcon(course.status)}
                            {getStatusText(course.status)}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{course.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Overview */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                        <span className="text-sm font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {course.completedLessons} of {course.totalLessons} lessons
                        </span>
                        <span className="text-xs text-gray-500">
                          {course.timeSpent.toFixed(1)} hours spent
                        </span>
                      </div>
                    </div>

                    {/* Modules Progress */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Module Progress</h4>
                      <div className="space-y-2">
                        {course.modules.slice(0, 3).map((module, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{module.name}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={module.progress} className="h-1 w-20" />
                              <span className="text-xs text-gray-500">{module.progress}%</span>
                            </div>
                          </div>
                        ))}
                        {course.modules.length > 3 && (
                          <p className="text-xs text-gray-500">+{course.modules.length - 3} more modules</p>
                        )}
                      </div>
                    </div>

                    {/* Next Lesson / Current Module */}
                    {course.status === 'in_progress' && course.nextLesson && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Next Lesson</h4>
                        <p className="text-xs text-blue-700">{course.nextLesson}</p>
                      </div>
                    )}

                    {/* Achievements */}
                    {course.achievements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Achievements</h4>
                        <div className="flex flex-wrap gap-1">
                          {course.achievements.slice(0, 3).map((achievement, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded flex items-center gap-1"
                            >
                              <Award className="h-3 w-3" />
                              {achievement}
                            </span>
                          ))}
                          {course.achievements.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              +{course.achievements.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {course.status === 'completed' ? (
                        <Button className="flex-1" variant="outline">
                          <Award className="h-4 w-4 mr-2" />
                          View Certificate
                        </Button>
                      ) : course.status === 'in_progress' ? (
                        <Button className="flex-1 bg-black text-white hover:bg-gray-800">
                          <Play className="h-4 w-4 mr-2" />
                          Continue Learning
                        </Button>
                      ) : (
                        <Button className="flex-1 bg-black text-white hover:bg-gray-800">
                          <Play className="h-4 w-4 mr-2" />
                          Start Course
                        </Button>
                      )}
                    </div>

                    {/* Course Details */}
                    <div className="text-xs text-gray-500 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span>Enrolled: {new Date(course.enrolledDate).toLocaleDateString()}</span>
                        <span>Last accessed: {new Date(course.lastAccessed).toLocaleDateString()}</span>
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
    </UnifiedLayout>
  );
};

export default MyCourses;