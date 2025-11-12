'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Circle,
  Clock,
  BookOpen,
  Video,
  FileText,
  Brain,
  Target,
  Play,
  Pause,
  Volume2,
  Maximize2,
  SkipBack,
  SkipForward,
  RotateCcw,
  Layers,
  Monitor,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz' | 'exercise' | 'hybrid';
  completed: boolean;
  progress: number;
  contentUrl?: string;
  videoUrl?: string;
  markdownUrl?: string;
  hasVideo?: boolean;
  hasMarkdown?: boolean;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  progress: number;
  estimatedDuration: string;
}

interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  timeSpent: number;
  nextLesson: string;
  instructor: string;
  rating: number;
  topics: string[];
  chapters: Chapter[];
}

const subjectsData: Record<string, Subject> = {
  mathematics: {
    id: 'mathematics',
    name: 'Mathematics',
    description: 'Master algebra, geometry, statistics, and problem-solving techniques',
    color: 'bg-blue-500',
    progress: 68,
    totalLessons: 145,
    completedLessons: 98,
    timeSpent: 45.5,
    nextLesson: 'Quadratic Equations - Part 3',
    instructor: 'Dr. Sarah Johnson',
    rating: 4.8,
    topics: ['Algebra', 'Geometry', 'Statistics', 'Probability', 'Number Theory', 'Trigonometry'],
    chapters: [
      {
        id: 'chapter-1',
        title: 'Number Theory & Fundamentals',
        description: 'Introduction to numbers, factors, multiples, and basic operations',
        progress: 100,
        estimatedDuration: '8 hours',
        lessons: [
          {
            id: 'math-1-1',
            title: 'Introduction to Number Theory',
            description: 'Understanding integers, rational numbers, and basic number properties',
            duration: '45 min',
            type: 'hybrid',
            completed: true,
            progress: 100,
            hasVideo: true,
            hasMarkdown: true,
            videoUrl: '/content/math/intro-number-theory.mp4',
            markdownUrl: '/content/math/intro-number-theory.md'
          },
          {
            id: 'math-1-2',
            title: 'Prime Numbers and Factors',
            description: 'Learn to identify prime numbers and find factors and multiples',
            duration: '60 min',
            type: 'exercise',
            completed: true,
            progress: 100
          },
          {
            id: 'math-1-3',
            title: 'Number Theory Practice',
            description: 'Practice problems and real-world applications',
            duration: '30 min',
            type: 'quiz',
            completed: true,
            progress: 100
          }
        ]
      },
      {
        id: 'chapter-2',
        title: 'Algebra Fundamentals',
        description: 'Variables, expressions, equations, and inequalities',
        progress: 85,
        estimatedDuration: '12 hours',
        lessons: [
          {
            id: 'math-2-1',
            title: 'Variables and Expressions',
            description: 'Understanding algebraic expressions and simplification',
            duration: '50 min',
            type: 'video',
            completed: true,
            progress: 100,
            videoUrl: '/content/math/variables-expressions.mp4'
          },
          {
            id: 'math-2-2',
            title: 'Linear Equations',
            description: 'Solving linear equations using various methods',
            duration: '75 min',
            type: 'video',
            completed: true,
            progress: 100,
            videoUrl: '/content/math/linear-equations.mp4'
          },
          {
            id: 'math-2-3',
            title: 'Quadratic Equations - Part 1',
            description: 'Introduction to quadratic equations and factoring',
            duration: '80 min',
            type: 'video',
            completed: true,
            progress: 100,
            videoUrl: '/content/math/quadratic-equations-1.mp4'
          },
          {
            id: 'math-2-4',
            title: 'Quadratic Equations - Part 2',
            description: 'Quadratic formula and discriminant',
            duration: '85 min',
            type: 'video',
            completed: true,
            progress: 100,
            videoUrl: '/content/math/quadratic-equations-2.mp4'
          },
          {
            id: 'math-2-5',
            title: 'Quadratic Equations - Part 3',
            description: 'Advanced techniques and applications',
            duration: '90 min',
            type: 'video',
            completed: false,
            progress: 65,
            videoUrl: '/content/math/quadratic-equations-3.mp4'
          }
        ]
      }
    ]
  }
};

const LessonViewer = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [contentMode, setContentMode] = useState<'video' | 'markdown'>('video');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access lesson content.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const subjectId = params.subject as string;
  const lessonId = params.lessonId as string;
  const subject = subjectsData[subjectId];

  // If subject not found, redirect to dashboard
  if (!subject) {
    router.push('/dashboard');
    return null;
  }

  // Find the lesson across all chapters
  let currentLesson: Lesson | null = null;
  let currentChapter: Chapter | null = null;
  let lessonIndex = -1;
  let chapterIndex = -1;

  for (let i = 0; i < subject.chapters.length; i++) {
    const chapter = subject.chapters[i];
    const foundLessonIndex = chapter.lessons.findIndex(lesson => lesson.id === lessonId);
    if (foundLessonIndex !== -1) {
      currentChapter = chapter;
      currentLesson = chapter.lessons[foundLessonIndex];
      lessonIndex = foundLessonIndex;
      chapterIndex = i;
      break;
    }
  }

  // If lesson not found, redirect to subject page
  if (!currentLesson || !currentChapter) {
    router.push(`/learning/${subjectId}`);
    return null;
  }

  // Get next and previous lessons
  const getPreviousLesson = () => {
    if (lessonIndex > 0) {
      return currentChapter!.lessons[lessonIndex - 1];
    }
    // Check previous chapter
    for (let i = chapterIndex - 1; i >= 0; i--) {
      if (subject.chapters[i].lessons.length > 0) {
        return subject.chapters[i].lessons[subject.chapters[i].lessons.length - 1];
      }
    }
    return null;
  };

  const getNextLesson = () => {
    if (lessonIndex < currentChapter!.lessons.length - 1) {
      return currentChapter!.lessons[lessonIndex + 1];
    }
    // Check next chapter
    for (let i = chapterIndex + 1; i < subject.chapters.length; i++) {
      if (subject.chapters[i].lessons.length > 0) {
        return subject.chapters[i].lessons[0];
      }
    }
    return null;
  };

  const previousLesson = getPreviousLesson();
  const nextLesson = getNextLesson();

  const handleCompleteLesson = () => {
    // In a real app, this would update the backend
    setLessonProgress(100);
    setIsPlaying(false);
  };

  const navigateToLesson = (lessonId: string) => {
    router.push(`/learning/${subjectId}/${lessonId}`);
  };

  const renderVideoPlayer = () => (
    <div className="bg-black rounded-lg overflow-hidden">
      <div className="aspect-video flex items-center justify-center">
        {/* Video Player Placeholder */}
        <div className="text-white text-center">
          <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Video Player</p>
          <p className="text-sm opacity-75">{currentLesson.title}</p>
          {currentLesson.videoUrl && (
            <p className="text-xs opacity-50 mt-2">URL: {currentLesson.videoUrl}</p>
          )}
        </div>
      </div>

      {/* Video Controls */}
      <div className="bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:text-white"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-white">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-white">
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-white">
              <Volume2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:text-white">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white text-sm">12:34 / 45:00</span>
            <Button variant="ghost" size="sm" className="text-white hover:text-white">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-1 mb-2">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${lessonProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white text-xs opacity-75">Playback Speed</span>
          <div className="flex gap-1">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
              <Button
                key={speed}
                variant={playbackSpeed === speed ? "default" : "ghost"}
                size="sm"
                onClick={() => setPlaybackSpeed(speed)}
                className="text-xs text-white hover:text-white"
              >
                {speed}x
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMarkdownContent = () => (
    <div className="bg-white border rounded-lg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{currentLesson.title}</h1>
        <p className="text-gray-600 mb-8">{currentLesson.description}</p>

        {/* Markdown Content Placeholder */}
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
          <p className="mb-4">
            This is where the markdown content would be rendered. In a real implementation,
            you would use a markdown renderer like react-markdown or MDX to display the actual
            content from the markdownUrl.
          </p>

          <h2 className="text-2xl font-semibold mb-3">Key Concepts</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Important concept 1 with detailed explanation</li>
            <li>Important concept 2 with examples</li>
            <li>Important concept 3 with practical applications</li>
          </ul>

          <h2 className="text-2xl font-semibold mb-3">Examples</h2>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <pre><code>// Example code or mathematical expression
              Example content goes here</code></pre>
          </div>

          {currentLesson.markdownUrl && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Source:</strong> {currentLesson.markdownUrl}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderQuizInterface = () => (
    <div className="bg-white border rounded-lg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{currentLesson.title}</h1>
        <p className="text-gray-600 mb-8">{currentLesson.description}</p>

        {/* Quiz Interface Placeholder */}
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Question 1 of 5</h3>
            <p className="mb-4">What is the derivative of x²?</p>
            <div className="space-y-2">
              {['2x', 'x', '2x²', 'x²/2'].map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  {String.fromCharCode(65 + index)}. {option}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline">Previous Question</Button>
            <span className="text-sm text-gray-500">Progress: 1/5</span>
            <Button>Next Question</Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExerciseInterface = () => (
    <div className="bg-white border rounded-lg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{currentLesson.title}</h1>
        <p className="text-gray-600 mb-8">{currentLesson.description}</p>

        {/* Exercise Interface Placeholder */}
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Exercise 1</h3>
            <p className="mb-4">Solve for x: 2x + 5 = 15</p>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Enter your answer"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <Button>Check Answer</Button>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Exercise 2</h3>
            <p className="mb-4">Simplify: (x + 3)²</p>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Enter your answer"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <Button>Check Answer</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHybridContent = () => (
    <div className="space-y-6">
      {/* Content Mode Selector */}
      <div className="flex items-center justify-center bg-white border rounded-lg p-2">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {currentLesson.hasVideo && (
            <button
              onClick={() => setContentMode('video')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                contentMode === 'video'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video</span>
            </button>
          )}
          {currentLesson.hasMarkdown && (
            <button
              onClick={() => setContentMode('markdown')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                contentMode === 'markdown'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Reading</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Based on Mode */}
      {contentMode === 'video' && renderVideoPlayer()}
      {contentMode === 'markdown' && renderMarkdownContent()}
    </div>
  );

  const renderContent = () => {
    switch (currentLesson.type) {
      case 'video':
        return renderVideoPlayer();
      case 'reading':
        return renderMarkdownContent();
      case 'quiz':
        return renderQuizInterface();
      case 'exercise':
        return renderExerciseInterface();
      case 'hybrid':
        return renderHybridContent();
      default:
        return <div>Content type not supported</div>;
    }
  };

  return (
    <UnifiedLayout
      userRole="student"
      title={currentLesson.title}
      subjectName={subject.name}
    >
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/learning/${subjectId}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {subject.name}
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h2 className="text-lg font-semibold">{currentChapter.title}</h2>
                <p className="text-sm text-gray-600">Lesson {lessonIndex + 1} of {currentChapter.lessons.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Lesson Progress</p>
                <div className="flex items-center gap-2">
                  <Progress value={lessonProgress} className="w-20 h-2" />
                  <span className="text-sm font-medium">{lessonProgress}%</span>
                </div>
              </div>
              <Button
                onClick={handleCompleteLesson}
                disabled={lessonProgress === 100}
                className={lessonProgress === 100 ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {lessonProgress === 100 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-50 flex-1">
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white border-t px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => previousLesson && navigateToLesson(previousLesson.id)}
              disabled={!previousLesson}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {previousLesson ? previousLesson.title : 'Previous Lesson'}
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {currentLesson.duration}
              </div>
              <div className="flex items-center gap-2">
                {currentLesson.type === 'video' && <Video className="w-4 h-4" />}
                {currentLesson.type === 'reading' && <FileText className="w-4 h-4" />}
                {currentLesson.type === 'quiz' && <Brain className="w-4 h-4" />}
                {currentLesson.type === 'exercise' && <Target className="w-4 h-4" />}
                <span className="text-sm text-gray-600 capitalize">{currentLesson.type}</span>
              </div>
            </div>

            <Button
              onClick={() => nextLesson && navigateToLesson(nextLesson.id)}
              disabled={!nextLesson}
            >
              {nextLesson ? nextLesson.title : 'Next Lesson'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default LessonViewer;