'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';
import {
  Brain,
  Award,
  FileQuestion,
  Lightbulb,
  Target,
  BookOpen,
  Clock,
  CheckCircle,
  BarChart3,
  TrendingUp,
  Users,
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

const CourseEvaluatePage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [isEnrolledFromClient, setIsEnrolledFromClient] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    if (courseId) {
      fetchCourse();
      fetchEvaluationData();
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

  const [evaluationData, setEvaluationData] = useState<any>(null);

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

  const fetchEvaluationData = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/evaluations`);
      if (!response.ok) {
        throw new Error('Failed to fetch evaluation data');
      }

      const result = await response.json();
      if (result.success) {
        setEvaluationData(result.data);
      } else {
        throw new Error(result.error || 'Failed to load evaluation data');
      }
    } catch (error) {
      console.error('Error fetching evaluation data:', error);
      // Don't show error toast for evaluation data as it's not critical
    }
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

  if (!isEnrolled) {
    return (
      <UnifiedLayout
        userRole="student"
        title={course.title}
        showCourseTabs={true}
        courseId={courseId}
        activeTab="evaluate"
      >
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Enroll to Access Evaluations</h3>
              <p className="text-gray-600">You need to enroll in this course to access quizzes and assessments.</p>
            </CardContent>
          </Card>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout
      userRole="student"
      title={`${course.title} - Evaluations`}
      showCourseTabs={true}
      courseId={courseId}
      activeTab="evaluate"
    >
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Evaluations</h1>
          <p className="text-lg text-gray-600">Test your knowledge and track your progress</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {evaluationData?.overallStats?.totalQuestions || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {evaluationData?.overallStats?.correctAnswers || 0}
                  </p>
                  <p className="text-sm text-gray-600">Correct</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(evaluationData?.overallStats?.averageScore || 0)}%
                  </p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {evaluationData?.overallStats?.totalQuizAttempts || 0}
                  </p>
                  <p className="text-sm text-gray-600">Attempts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evaluation Modes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Flash Cards */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl">Flash Cards</h3>
                  <p className="text-sm text-gray-600 font-normal">Quick review with interactive cards</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Review key concepts and terminology with our interactive flash card system.
                  Perfect for quick study sessions and memorization.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <FileQuestion className="h-4 w-4" />
                    50+ cards
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    5-10 min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Spaced repetition
                  </span>
                </div>
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => router.push(`/learning/${courseId}/evaluate/flashcards`)}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Start Flash Cards
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Practice Questions */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileQuestion className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl">Practice Questions</h3>
                  <p className="text-sm text-gray-600 font-normal">Test your understanding</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Challenge yourself with a variety of question types including multiple choice,
                  true/false, and short answer questions.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <FileQuestion className="h-4 w-4" />
                    30+ questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    15-20 min
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Instant feedback
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => router.push(`/learning/${courseId}/evaluate/questions`)}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Start Practice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chapter-specific Evaluations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Chapter Evaluations
            </CardTitle>
            <p className="text-gray-600">
              Test your knowledge of specific chapters and topics
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluationData?.chapterStats?.map((chapter: any, index: number) => {
                const completionPercentage = chapter.totalQuestions > 0
                  ? Math.round((chapter.correctAnswers / chapter.totalQuestions) * 100)
                  : 0;

                return (
                  <div key={chapter.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Chapter {index + 1}: {chapter.title}</h4>
                        <p className="text-sm text-gray-600">
                          {chapter.lessonsCount || 0} lessons • {chapter.quizzesCount || 0} quizzes • {chapter.totalFlashCards || 0} flash cards
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{completionPercentage}%</div>
                        <div className="text-xs text-gray-500">Complete</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{chapter.correctAnswers}/{chapter.totalQuestions} correct</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>
                      {chapter.averageScore > 0 && (
                        <div className="text-xs text-gray-500">
                          Average Score: {Math.round(chapter.averageScore)}%
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/learning/${courseId}/evaluate/flashcards?chapter=${chapter.id}`)}
                        className="flex-1"
                        disabled={chapter.totalFlashCards === 0}
                      >
                        <Lightbulb className="h-4 w-4 mr-1" />
                        Flash Cards ({chapter.totalFlashCards})
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/learning/${courseId}/evaluate/questions?chapter=${chapter.id}`)}
                        className="flex-1"
                        disabled={chapter.totalQuestions === 0}
                      >
                        <FileQuestion className="h-4 w-4 mr-1" />
                        Questions ({chapter.totalQuestions})
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
};

export default CourseEvaluatePage;