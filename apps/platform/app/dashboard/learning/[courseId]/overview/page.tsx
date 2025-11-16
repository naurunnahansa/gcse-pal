'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';
import {
  CourseOverviewSkeleton,
} from '@/components/ui/loading-skeletons';
import {
  BookOpen,
  Clock,
  Users,
  Star,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Target,
  TrendingUp,
  BarChart3,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  isPublished: boolean;
  hasVideo: boolean;
  hasMarkdown: boolean;
  userProgress?: {
    status: string;
    completedAt?: string;
    timeSpent: number;
    score?: number;
  };
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  isPublished: boolean;
  lessons: Lesson[];
  lessonsCount: number;
  totalDuration: number;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  thumbnail?: string;
  instructor: string;
  duration: number;
  difficulty: string;
  topics: string[];
  price: number;
  status: string;
  rating: number;
  enrollmentCount: number;
  chapters: Chapter[];
  userEnrollment?: {
    id: string;
    enrolledAt: string;
    progress: number;
    status: string;
    completedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const CourseOverviewPage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolledFromClient, setIsEnrolledFromClient] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    if (courseId) {
      fetchCourse();
    }
  }, [courseId, isAuthenticated]);

  useEffect(() => {
    if (course && isEnrolledFromClient === null) {
      const checkEnrollmentFromClient = async () => {
        try {
          const response = await fetch('/api/enrollments/my');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.enrollments) {
              const found = data.data.enrollments.some((e: any) => e.courseId === course.id);
              setIsEnrolledFromClient(found);
            }
          }
        } catch (error) {
          console.error('Failed to check enrollment from client:', error);
          setIsEnrolledFromClient(false);
        }
      };
      checkEnrollmentFromClient();
    }
  }, [course?.id, isEnrolledFromClient]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      const result = await response.json();
      if (result.success) {
        setCourse(result.data);
      } else {
        throw new Error(result.error || 'Failed to load course');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load course');
      router.push('/learning/courses/browse');
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async () => {
    if (!course || !user) {
      console.error('Cannot enroll: course or user missing', { course: !!course, user: !!user });
      toast.error('Please sign in to enroll in courses');
      return;
    }

    setEnrolling(true);
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
        fetchCourse();
      } else {
        if (result.error && result.error.includes('already enrolled')) {
          toast.info('You are already enrolled in this course!');
          fetchCourse();
        } else {
          throw new Error(result.error || 'Failed to enroll');
        }
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallProgress = () => {
    if (!course?.chapters.length) return 0;
    const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
    if (totalLessons === 0) return 0;

    const completedLessons = course.chapters.reduce((sum, ch) =>
      sum + ch.lessons.filter(lesson => lesson.userProgress?.status === 'completed').length, 0
    );
    return Math.round((completedLessons / totalLessons) * 100);
  };

  const getProgressPercentage = (chapter: Chapter) => {
    if (!chapter.lessons.length) return 0;
    const completedLessons = chapter.lessons.filter(lesson =>
      lesson.userProgress?.status === 'completed'
    ).length;
    return Math.round((completedLessons / chapter.lessons.length) * 100);
  };

  if (!mounted || !isAuthenticated) {
    return (
      <UnifiedLayout userRole="student" title="Authentication Required">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access course content.</p>
            <Button asChild>
              <a href="/auth/signin">Sign In</a>
            </Button>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (loading) {
    return (
      <UnifiedLayout userRole="student" title="Loading Course">
        <div className="p-6">
          <CourseOverviewSkeleton />
        </div>
      </UnifiedLayout>
    );
  }

  if (!course) {
    return (
      <UnifiedLayout userRole="student" title="Course Not Found">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
            <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/learning/courses/browse')}>
              Browse Courses
            </Button>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  const isEnrolledFromAPI = !!course.userEnrollment;
  const isEnrolled = isEnrolledFromAPI || isEnrolledFromClient === true;
  const overallProgress = getOverallProgress();

  return (
    <UnifiedLayout
      userRole="student"
      title={course.title}
      showCourseTabs={true}
      courseId={courseId}
      activeTab="overview"
    >
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-start gap-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="mt-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{course.title}</h1>
                <p className="text-lg text-gray-600 mb-4 leading-relaxed">{course.description}</p>
                <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.subject}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.enrollmentCount} students
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.round(course.duration / 60)}h total
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {course.rating || 'New'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created {new Date(course.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`px-3 py-1 ${getDifficultyColor(course.difficulty)}`}>
                    {course.difficulty}
                  </Badge>
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {course.chapters.length} chapters • {course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)} lessons
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                {course.price > 0 ? (
                  <div className="text-3xl font-bold">${course.price}</div>
                ) : (
                  <Badge variant="secondary" className="text-lg px-3 py-1">Free</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress & Stats */}
        {isEnrolled && (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{overallProgress}%</div>
                  <div className="text-sm text-gray-600">Overall Progress</div>
                  <Progress value={overallProgress} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {course.chapters.reduce((sum, ch) =>
                      sum + ch.lessons.filter(l => l.userProgress?.status === 'completed').length, 0
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Completed Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {Math.round(
                      course.chapters.reduce((sum, ch) =>
                        sum + ch.lessons.reduce((lessonSum, l) =>
                          lessonSum + (l.userProgress?.timeSpent || 0), 0
                        ), 0
                      ) / 60
                    )}h
                  </div>
                  <div className="text-sm text-gray-600">Study Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {new Date(course.userEnrollment?.enrolledAt || '').toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">Enrolled Date</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">{course.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What You'll Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.topics.map((topic, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">{topic}</span>
                    </div>
                  ))}
                  {course.topics.length === 0 && (
                    <p className="text-gray-500">No topics specified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chapter Progress - from progress page */}
            {isEnrolled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Chapter Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.chapters.map((chapter, index) => {
                      const progress = getProgressPercentage(chapter);
                      return (
                        <div key={chapter.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{chapter.title}</span>
                            <span className="text-gray-600">{progress}%</span>
                          </div>
                          <Progress value={progress} />
                          <p className="text-xs text-gray-500">
                            {chapter.lessons.filter(l => l.userProgress?.status === 'completed').length} of {chapter.lessons.length} lessons completed
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements - from progress page */}
            {isEnrolled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        overallProgress >= 25 ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Target className={`h-6 w-6 ${overallProgress >= 25 ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">Course Starter</h3>
                        <p className="text-sm text-gray-600">Complete 25% of the course</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        overallProgress >= 50 ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <BarChart3 className={`h-6 w-6 ${overallProgress >= 50 ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">Halfway There</h3>
                        <p className="text-sm text-gray-600">Complete 50% of the course</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        overallProgress >= 100 ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Award className={`h-6 w-6 ${overallProgress >= 100 ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium">Course Master</h3>
                        <p className="text-sm text-gray-600">Complete 100% of the course</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Instructor</span>
                  <span className="font-medium">{course.instructor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Level</span>
                  <span className="font-medium">{course.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{Math.round(course.duration / 60)} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chapters</span>
                  <span className="font-medium">{course.chapters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lessons</span>
                  <span className="font-medium">{course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)}</span>
                </div>
              </CardContent>
            </Card>

            {!isEnrolled && (
              <Card>
                <CardContent className="p-6">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={enrollInCourse}
                    disabled={enrolling || course.status !== 'published'}
                  >
                    {enrolling ? 'Enrolling...' : course.price > 0 ? `Enroll for $${course.price}` : 'Enroll for Free'}
                  </Button>
                  {course.status !== 'published' && (
                    <p className="text-sm text-gray-500 mt-2 text-center">This course is not yet available for enrollment.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default CourseOverviewPage;