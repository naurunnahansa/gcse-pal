'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/AuthProvider';
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';
import {
  BookOpen,
  Play,
  Clock,
  Users,
  Star,
  CheckCircle,
  Circle,
  ArrowLeft,
  Video,
  FileText,
  Award,
  TrendingUp,
  BarChart3,
  PlayCircle,
  Lock,
  ChevronRight,
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

const CourseViewPage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      const result = await response.json();
      if (result.success) {
        setCourse(result.data);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
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
      console.log('Attempting to enroll in course:', courseId);
      console.log('User authenticated:', !!user);

      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Enrollment response status:', response.status);

      const result = await response.json();
      console.log('Enrollment response:', result);

      if (result.success) {
        toast.success('Successfully enrolled in course!');
        // Refresh course data to show enrollment
        fetchCourse();
      } else {
        throw new Error(result.error || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const startLesson = (lessonId: string) => {
    router.push(`/learning/lessons/${lessonId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (chapter: Chapter) => {
    if (!chapter.lessons.length) return 0;
    const completedLessons = chapter.lessons.filter(lesson =>
      lesson.userProgress?.status === 'completed'
    ).length;
    return Math.round((completedLessons / chapter.lessons.length) * 100);
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading course...</p>
          </div>
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

  const isEnrolled = !!course.userEnrollment;
  const overallProgress = getOverallProgress();

  return (
    <UnifiedLayout userRole="student" title={course.title}>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-lg text-gray-600 mb-4">{course.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
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
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <Badge className={`px-3 py-1 ${getDifficultyColor(course.difficulty)}`}>
                  {course.difficulty}
                </Badge>
                {course.price > 0 ? (
                  <div className="text-2xl font-bold">${course.price}</div>
                ) : (
                  <Badge variant="secondary">Free</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Stats & Progress */}
        {isEnrolled && (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{overallProgress}%</div>
                  <div className="text-sm text-gray-600">Overall Progress</div>
                  <Progress value={overallProgress} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {course.chapters.reduce((sum, ch) =>
                      sum + ch.lessons.filter(l => l.userProgress?.status === 'completed').length, 0
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Completed Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
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
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {new Date(course.userEnrollment?.enrolledAt || '').toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">Enrolled Date</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Content
            </CardTitle>
            <p className="text-gray-600">
              {course.chapters.length} chapters • {course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)} lessons • {Math.round(course.duration / 60)}h total duration
            </p>
          </CardHeader>
          <CardContent>
            {!isEnrolled ? (
              <div className="text-center py-12">
                <Lock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Enroll to Access Course Content</h3>
                <p className="text-gray-600 mb-6">Get full access to all lessons, materials, and progress tracking.</p>
                <Button
                  size="lg"
                  onClick={enrollInCourse}
                  disabled={enrolling || course.status !== 'published'}
                >
                  {enrolling ? 'Enrolling...' : course.price > 0 ? `Enroll for $${course.price}` : 'Enroll for Free'}
                </Button>
                {course.status !== 'published' && (
                  <p className="text-sm text-gray-500 mt-2">This course is not yet available for enrollment.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {course.chapters.map((chapter, chapterIndex) => {
                  const progress = getProgressPercentage(chapter);
                  const isExpanded = expandedChapters.has(chapter.id);

                  return (
                    <div key={chapter.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleChapter(chapter.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ChevronRight
                              className={`h-5 w-5 text-gray-400 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                                {chapterIndex + 1}
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                                <p className="text-sm text-gray-600">{chapter.lessons.length} lessons • {Math.round(chapter.totalDuration / 60)}h</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{progress}%</div>
                              <Progress value={progress} className="w-16 h-2" />
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {chapter.lessons.filter(l => l.userProgress?.status === 'completed').length}/{chapter.lessons.length}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          {chapter.lessons.map((lesson, lessonIndex) => {
                            const isCompleted = lesson.userProgress?.status === 'completed';
                            const isLocked = !lesson.isPublished;

                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-4 hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                                    {isLocked ? (
                                      <Lock className="h-4 w-4 text-gray-400" />
                                    ) : isCompleted ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                      {lesson.title}
                                      {lesson.hasVideo && <Video className="h-4 w-4 text-gray-400" />}
                                      {lesson.hasMarkdown && <FileText className="h-4 w-4 text-gray-400" />}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {lesson.duration} minutes
                                      {lesson.userProgress?.timeSpent > 0 && ` • ${Math.round(lesson.userProgress.timeSpent / 60)}min watched`}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant={isCompleted ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => startLesson(lesson.id)}
                                  disabled={isLocked}
                                >
                                  {isLocked ? (
                                    "Locked"
                                  ) : isCompleted ? (
                                    "Review"
                                  ) : (
                                    <>
                                      <PlayCircle className="h-4 w-4 mr-1" />
                                      Start
                                    </>
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Instructor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">{course.instructor}</h3>
                <p className="text-sm text-gray-600">Course Instructor</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Topics Covered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {course.topics.map((topic, index) => (
                  <Badge key={index} variant="secondary">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default CourseViewPage;