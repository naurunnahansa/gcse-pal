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
  BookOpen,
  Play,
  CheckCircle,
  Circle,
  ChevronRight,
  Video,
  FileText,
  PlayCircle,
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

const CourseLearnPage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
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
        // Auto-expand first chapter if exists
        if (result.data.chapters && result.data.chapters.length > 0) {
          setExpandedChapters(new Set([result.data.chapters[0].id]));
        }
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
    if (!course?.userEnrollment) {
      toast.error('Please enroll in this course first');
      return;
    }
    router.push(`/learning/${courseId}/learn/${lessonId}`);
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

  const isEnrolledFromAPI = !!course.userEnrollment;
  const isEnrolled = isEnrolledFromAPI || isEnrolledFromClient === true;

  return (
    <UnifiedLayout
      userRole="student"
      title={course.title}
      showCourseTabs={true}
      courseId={courseId}
      activeTab="learn"
    >
      <div className="max-w-7xl mx-auto p-6">
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
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Enroll to Access Course Content</h3>
                <p className="text-gray-600 mb-6">Get full access to all lessons, materials, and progress tracking.</p>
                <Button
                  size="lg"
                  onClick={enrollInCourse}
                  disabled={enrolling || course.status !== 'published'}
                >
                  {enrolling ? 'Enrolling...' : course.price > 0 ? `Enroll for $${course.price}` : 'Enroll for Free'}
                </Button>
              </div>
            ) : course.chapters.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Available Yet</h3>
                <p className="text-gray-600 mb-4">This course is currently being developed. Check back soon for chapters and lessons!</p>
                <div className="text-sm text-gray-500">
                  You're enrolled in this course and will be notified when new content is added.
                </div>
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

                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-4 hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                                    {isCompleted ? (
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
                                >
                                  {isCompleted ? (
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
      </div>
    </UnifiedLayout>
  );
};

export default CourseLearnPage;