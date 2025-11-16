'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';
import {
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  ArrowLeft,
  Video,
  FileText,
  Pause,
  RotateCcw,
  Circle,
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

interface LessonData {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  videoDuration?: number;
  markdownPath?: string;
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
  chapter: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
      description: string;
      subject: string;
      instructor: string;
      difficulty: string;
      topics: string[];
      userEnrollment?: {
        id: string;
        enrolledAt: string;
        progress: number;
        status: string;
      };
    };
  };
}

const LessonPage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const lessonId = params?.lessonId as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [completed, setCompleted] = useState(false);
  const [isEnrolledFromClient, setIsEnrolledFromClient] = useState<boolean | null>(null);
  const [courseStructure, setCourseStructure] = useState<Chapter[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    if (courseId && lessonId) {
      fetchLesson();
      fetchCourseStructure();
    }
  }, [courseId, lessonId, isAuthenticated]);

  useEffect(() => {
    if (lesson?.chapter?.course && isEnrolledFromClient === null) {
      const checkEnrollmentFromClient = async () => {
        try {
          const response = await fetch('/api/enrollments/my');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.enrollments) {
              const found = data.data.enrollments.some((e: any) => e.courseId === lesson.chapter.course.id);
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
  }, [lesson?.chapter?.course?.id, isEnrolledFromClient]);

  useEffect(() => {
    if (lesson && courseStructure.length > 0) {
      setExpandedChapters(new Set([lesson.chapter.id]));
    }
  }, [lesson?.id, courseStructure]);

  const fetchCourseStructure = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCourseStructure(result.data.chapters || []);
        }
      }
    } catch (error) {
      console.error('Error fetching course structure:', error);
    }
  };

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lessons/${lessonId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lesson');
      }

      const result = await response.json();
      if (result.success) {
        setLesson(result.data);
        setCompleted(result.data.userProgress?.status === 'completed');
      } else {
        throw new Error(result.error || 'Failed to load lesson');
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load lesson');
      router.push(`/learning/${courseId}/learn`);
    } finally {
      setLoading(false);
    }
  };

  const markLessonCompleted = async () => {
    if (!lesson || !user) {
      toast.error('Please sign in to track progress');
      return;
    }

    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          timeSpent: lesson.duration * 60, // Convert minutes to seconds
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCompleted(true);
        toast.success('Lesson marked as completed!');
        // Refresh lesson data to show updated progress
        fetchLesson();
        fetchCourseStructure();
      } else {
        throw new Error(result.error || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update progress');
    }
  };

  const resetProgress = async () => {
    if (!lesson || !user) {
      toast.error('Please sign in to reset progress');
      return;
    }

    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'in_progress',
          timeSpent: 0,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCompleted(false);
        toast.success('Progress reset successfully!');
        // Refresh lesson data to show updated progress
        fetchLesson();
        fetchCourseStructure();
      } else {
        throw new Error(result.error || 'Failed to reset progress');
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset progress');
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

  const findAdjacentLessons = () => {
    if (!lesson || courseStructure.length === 0) return { next: null, previous: null };

    const allLessons: (Lesson & { chapterId: string; chapterOrder: number })[] = [];

    courseStructure.forEach(chapter => {
      chapter.lessons.forEach(lesson => {
        allLessons.push({
          ...lesson,
          chapterId: chapter.id,
          chapterOrder: chapter.order
        });
      });
    });

    allLessons.sort((a, b) => {
      if (a.chapterOrder !== b.chapterOrder) {
        return a.chapterOrder - b.chapterOrder;
      }
      return a.order - b.order;
    });

    const currentIndex = allLessons.findIndex(l => l.id === lesson.id);

    return {
      next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null,
      previous: currentIndex > 0 ? allLessons[currentIndex - 1] : null
    };
  };

  const navigateToLesson = (lessonId: string) => {
    router.push(`/learning/${courseId}/learn/${lessonId}`);
  };

  const { next: nextLesson, previous: previousLesson } = findAdjacentLessons();

  if (!mounted || !isAuthenticated) {
    return (
      <UnifiedLayout userRole="student" title="Authentication Required">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access lesson content.</p>
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
      <UnifiedLayout userRole="student" title="Loading Lesson">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading lesson...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (!lesson) {
    return (
      <UnifiedLayout userRole="student" title="Lesson Not Found">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Lesson Not Found</h1>
            <p className="text-muted-foreground mb-4">The lesson you're looking for doesn't exist.</p>
            <Button onClick={() => router.push(`/learning/${courseId}/learn`)}>
              Back to Course
            </Button>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  const isEnrolledFromAPI = !!lesson.chapter.course.userEnrollment;
  const isEnrolled = isEnrolledFromAPI || isEnrolledFromClient === true;

  if (!isEnrolled) {
    return (
      <UnifiedLayout
        userRole="student"
        title="Enrollment Required"
        showCourseTabs={true}
        courseId={courseId}
        activeTab="learn"
      >
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Enroll to Access Lesson Content</h3>
              <p className="text-gray-600">You need to enroll in this course to view lesson materials.</p>
            </CardContent>
          </Card>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      userRole="student"
      title={lesson.title}
      showCourseTabs={true}
      courseId={courseId}
      activeTab="learn"
    >
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/learning/${courseId}/learn`)}
            className="mt-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Lessons
          </Button>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
                <p className="text-lg text-gray-600 mb-4">{lesson.description}</p>
                <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {lesson.duration} minutes
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {lesson.chapter.title}
                  </span>
                  {lesson.userProgress?.timeSpent > 0 && (
                    <span className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      {Math.round(lesson.userProgress.timeSpent / 60)}min watched
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={lesson.isPublished ? 'default' : 'secondary'}>
                    {lesson.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  {completed && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                  <span className="text-sm text-gray-500">
                    {lesson.hasVideo && <Video className="inline h-4 w-4 mr-1" />}
                    {lesson.hasMarkdown && <FileText className="inline h-4 w-4 mr-1" />}
                    {lesson.hasVideo && lesson.hasMarkdown ? 'Video & Text' :
                     lesson.hasVideo ? 'Video' :
                     lesson.hasMarkdown ? 'Text' : 'Content'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {completed ? (
                  <Button variant="outline" onClick={resetProgress}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Progress
                  </Button>
                ) : (
                  <Button onClick={markLessonCompleted}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Course Structure Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Content</CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                {courseStructure.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No course content available</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {courseStructure.map((chapter, chapterIndex) => {
                      const isExpanded = expandedChapters.has(chapter.id);
                      const chapterProgress = chapter.lessons.length > 0
                        ? Math.round((chapter.lessons.filter(l => l.userProgress?.status === 'completed').length / chapter.lessons.length) * 100)
                        : 0;

                      return (
                        <div key={chapter.id} className="border-b border-gray-100 last:border-b-0">
                          <div
                            className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleChapter(chapter.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <ChevronRight
                                  className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`}
                                />
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-sm text-gray-900 truncate">
                                    {chapterIndex + 1}. {chapter.title}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {chapter.lessons.length} lessons • {Math.round(chapter.totalDuration / 60)}h
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="text-xs text-gray-600">{chapterProgress}%</div>
                                {chapter.lessons.filter(l => l.userProgress?.status === 'completed').length > 0 && (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                )}
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="bg-gray-50 border-t border-gray-100">
                              {chapter.lessons.map((lessonItem, lessonIndex) => {
                                const isLessonCompleted = lessonItem.userProgress?.status === 'completed';
                                const isCurrentLesson = lessonItem.id === lessonId;

                                return (
                                  <div
                                    key={lessonItem.id}
                                    className={`flex items-center justify-between p-3 hover:bg-gray-100 transition-colors cursor-pointer border-l-2 ${
                                      isCurrentLesson
                                        ? 'bg-blue-50 border-blue-500'
                                        : 'border-transparent'
                                    }`}
                                    onClick={() => navigateToLesson(lessonItem.id)}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <div className="w-4 h-4 rounded-full bg-white border border-gray-300 flex items-center justify-center flex-shrink-0">
                                        {isLessonCompleted ? (
                                          <CheckCircle className="h-3 w-3 text-green-500" />
                                        ) : (
                                          <Circle className="h-3 w-3 text-gray-400" />
                                        )}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-medium truncate ${
                                          isCurrentLesson ? 'text-blue-700' : 'text-gray-900'
                                        }`}>
                                          {lessonIndex + 1}. {lessonItem.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {lessonItem.duration}min
                                          {lessonItem.hasVideo && <Video className="inline h-3 w-3 ml-1" />}
                                          {lessonItem.hasMarkdown && <FileText className="inline h-3 w-3 ml-1" />}
                                        </p>
                                      </div>
                                    </div>
                                    {isCurrentLesson && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                    )}
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

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Content */}
            {lesson.hasVideo && lesson.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Lesson
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={lesson.videoUrl}
                      className="w-full h-full"
                      title={lesson.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Text Content */}
            {(lesson.hasMarkdown || lesson.content) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Lesson Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-lg max-w-none">
                    {lesson.content ? (
                      <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                    ) : lesson.hasMarkdown ? (
                      <div className="text-gray-600 p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p>Markdown content is available but needs to be processed.</p>
                        <p className="text-sm mt-2">Contact your instructor for access to the lesson materials.</p>
                      </div>
                    ) : (
                      <div className="text-gray-600 p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p>No content available for this lesson yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Content Available */}
            {!lesson.hasVideo && !lesson.hasMarkdown && !lesson.content && (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Available Yet</h3>
                  <p className="text-gray-600">This lesson is currently being developed. Check back soon!</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previousLesson && navigateToLesson(previousLesson.id)}
                    disabled={!previousLesson}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => nextLesson && navigateToLesson(nextLesson.id)}
                    disabled={!nextLesson}
                    className="flex-1"
                  >
                    Next
                    <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                  </Button>
                </div>
                {previousLesson && (
                  <p className="text-xs text-gray-500 truncate">
                    Previous: {previousLesson.title}
                  </p>
                )}
                {nextLesson && (
                  <p className="text-xs text-gray-500 truncate">
                    Next: {nextLesson.title}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Course</p>
                  <p className="text-sm text-gray-600">{lesson.chapter.course.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Chapter</p>
                  <p className="text-sm text-gray-600">{lesson.chapter.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Subject</p>
                  <p className="text-sm text-gray-600">{lesson.chapter.course.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Difficulty</p>
                  <p className="text-sm text-gray-600">{lesson.chapter.course.difficulty}</p>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      completed ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {completed ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      ) : (
                        <Play className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <h3 className={`font-medium mb-1 ${
                      completed ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {completed ? 'Lesson Completed' : 'In Progress'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {completed ? 'Great job!' : 'Keep going!'}
                    </p>
                  </div>
                  {lesson.userProgress?.timeSpent > 0 && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Time spent</span>
                        <span className="font-medium">{Math.round(lesson.userProgress.timeSpent / 60)} minutes</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default LessonPage;