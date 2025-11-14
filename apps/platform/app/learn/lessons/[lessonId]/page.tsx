'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  Clock,
  BookOpen,
  Video,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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
  chapter: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
    };
  };
  userProgress?: {
    id: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    timeSpent: number;
    score?: number;
  };
}

const LessonPage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const lessonId = params?.lessonId as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lesson');
      }

      const result = await response.json();
      if (result.success) {
        setLesson(result.data);
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast.error('Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async () => {
    if (!lesson) return;

    setCompleting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          timeSpent: Math.round(duration / 60),
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Lesson marked as complete!');
        fetchLesson(); // Refresh lesson data
      } else {
        throw new Error(result.error || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update progress');
    } finally {
      setCompleting(false);
    }
  };

  const updateProgress = async () => {
    if (!lesson) return;

    try {
      await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'in_progress',
          timeSpent: Math.round(currentTime / 60),
        }),
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const goToNextLesson = () => {
    // This would need to be implemented to fetch the next lesson
    // For now, go back to the course page
    if (lesson?.chapter.course.id) {
      router.push(`/learning/${lesson.chapter.course.id}`);
    }
  };

  const goToPreviousLesson = () => {
    // This would need to be implemented to fetch the previous lesson
    // For now, go back to the course page
    if (lesson?.chapter.course.id) {
      router.push(`/learning/${lesson.chapter.course.id}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  const isCompleted = lesson.userProgress?.status === 'completed';

  return (
    <UnifiedLayout userRole="student" title={lesson.title}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Course
          </Button>

          <div className="text-sm text-gray-500">
            {lesson.chapter.course.title} • {lesson.chapter.title}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lesson Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video or Content Area */}
            <Card>
              <CardContent className="p-0">
                {lesson.hasVideo && lesson.videoUrl ? (
                  <div className="aspect-video bg-black rounded-t-lg">
                    <video
                      className="w-full h-full"
                      controls
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    >
                      <source src={lesson.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="p-8">
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Text Content</h3>
                      <p className="text-gray-600 mb-4">This lesson contains text content.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lesson Content */}
            {lesson.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Lesson Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    {lesson.hasMarkdown ? (
                      <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                    ) : (
                      <div className="whitespace-pre-wrap">{lesson.content}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lesson Info */}
            <Card>
              <CardHeader>
                <CardTitle>Lesson Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{lesson.title}</h3>
                  <p className="text-sm text-gray-600">{lesson.description}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {lesson.duration} minutes
                </div>

                {lesson.userProgress && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm">
                        {lesson.userProgress.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <Progress
                      value={lesson.userProgress.status === 'completed' ? 100 : 50}
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="space-y-3">
                {!isCompleted ? (
                  <Button
                    className="w-full"
                    onClick={markAsComplete}
                    disabled={completing}
                  >
                    {completing ? (
                      'Marking Complete...'
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="text-center py-2">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Lesson Completed</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={goToPreviousLesson}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={goToNextLesson}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
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