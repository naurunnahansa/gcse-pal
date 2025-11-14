'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { useAuth } from "@/components/AuthProvider";
import { useCourses } from "@/hooks/useCourses";
import { toast } from 'sonner';
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Users,
  Star,
  Play,
  FileText,
  Headphones,
  Video,
  Award,
  TrendingUp,
  Loader2,
  Loader,
} from "lucide-react";

const BrowseCourses = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  const { courses, loading, error, fetchCourses } = useCourses({
    autoFetch: true, // Enable auto-fetch with initial filters
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch courses when filters change
  useEffect(() => {
    const filters = {
      search: searchTerm || undefined,
      subject: selectedSubject !== 'all' ? selectedSubject : undefined,
      level: selectedLevel !== 'all' ? selectedLevel.toLowerCase() : undefined,
    };
    fetchCourses(filters);
  }, [searchTerm, selectedSubject, selectedLevel]);

  const subjects = ['all', 'mathematics', 'english', 'science', 'history', 'geography', 'other'];
  const levels = ['all', 'gcse', 'igcse', 'a_level'];

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to browse courses.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const getCourseTypeIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics': return <BookOpen className="h-4 w-4" />;
      case 'english': return <FileText className="h-4 w-4" />;
      case 'science': return <Video className="h-4 w-4" />;
      case 'history': return <Headphones className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!user) {
      toast.error('Please sign in to enroll in courses');
      return;
    }

    setEnrollingCourseId(courseId);
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Successfully enrolled in course!');
        // Refresh courses to update enrollment status
        fetchCourses();
      } else {
        throw new Error(result.error || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enroll in course');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  return (
    <UnifiedLayout userRole="student">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Courses</h1>
            <p className="text-gray-600">Discover comprehensive GCSE courses to accelerate your learning</p>
          </div>
        </div>

        <div className="bg-gray-50 flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses, topics, or instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject === 'all' ? 'All Subjects' : subject}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>
                      {level === 'all' ? 'All Levels' : level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mb-6">
              {loading ? (
                <p className="text-gray-600">Loading courses...</p>
              ) : error ? (
                <div className="text-red-500">
                  <p>Failed to load courses: {error}</p>
                  <Button variant="outline" size="sm" onClick={() => fetchCourses()} className="mt-2">
                    Retry
                  </Button>
                </div>
              ) : (
                <p className="text-gray-600">
                  Found <span className="font-semibold">{courses.length}</span> courses
                </p>
              )}
            </div>

            {/* Course Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <Card key={course.id} className="group cursor-pointer transition-all hover:shadow-lg">
                    {/* Course Thumbnail */}
                  <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
                    {getCourseTypeIcon(course.subject)}
                    <span className="ml-2 text-sm text-gray-600">{course.subject}</span>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-black transition-colors">
                        {course.title}
                      </CardTitle>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(course.difficulty)}`}>
                        {course.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {Math.round(course.duration / 60)}h {course.duration % 60}m
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.chaptersCount || 0} chapters
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Topics */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(course.topics || []).slice(0, 3).map((topic, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                        >
                          {topic}
                        </span>
                      ))}
                      {(course.topics || []).length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          +{(course.topics || []).length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Course Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{course.enrollmentCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{course.rating || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Instructor */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500">Instructor: {course.instructor}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                        onClick={() => enrollInCourse(course.id)}
                        disabled={enrollingCourseId === course.id}
                      >
                        {enrollingCourseId === course.id ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Enrolling...
                          </>
                        ) : course.price === 0 ? (
                          'Enroll Free'
                        ) : (
                          `Enroll - £${course.price}`
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/learning/${course.id}`)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
              ) : null}
            </div>

            {/* No Results */}
            {!loading && !error && courses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSubject('all');
                    setSelectedLevel('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default BrowseCourses;