'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  BookOpen,
  Target,
  MessageCircle,
  Bookmark,
  Share2,
  Download,
  FileText,
  Video,
  Brain,
  BarChart3,
  Lightbulb,
  AlertCircle,
  Edit3,
  User,
} from "lucide-react";

interface ContentSection {
  id: string;
  type: 'video' | 'text' | 'interactive';
  title: string;
  duration?: string;
  completed: boolean;
  content?: string;
  videoUrl?: string;
  practiceQuestions?: PracticeQuestion[];
}

interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const TopicWalkthrough = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Mock topic data - in real app, this would come from API
  const topicData = {
    'quadratic-equations': {
      subject: 'Mathematics',
      title: 'Quadratic Equations',
      description: 'Master the fundamentals of quadratic equations and learn various solving methods',
      difficulty: 'Intermediate',
      estimatedTime: '45 min',
      icon: BarChart3,
      color: 'bg-blue-500',
      prerequisites: ['Basic Algebra', 'Linear Equations'],
      learningObjectives: [
        'Understand what quadratic equations are',
        'Learn the quadratic formula',
        'Practice factoring quadratic expressions',
        'Solve real-world problems',
      ],
    },
    'cell-structure': {
      subject: 'Biology',
      title: 'Cell Structure and Function',
      description: 'Explore the microscopic world of cells and their vital functions',
      difficulty: 'Foundation',
      estimatedTime: '30 min',
      icon: Brain,
      color: 'bg-green-500',
      prerequisites: ['Basic Biology Concepts'],
      learningObjectives: [
        'Identify cell organelles',
        'Understand cell membrane structure',
        'Learn about cellular processes',
        'Compare plant and animal cells',
      ],
    },
  };

  // Mock content sections
  const contentSections: ContentSection[] = [
    {
      id: 'intro',
      type: 'video',
      title: 'Introduction to Quadratic Equations',
      duration: '5:30',
      completed: false,
      videoUrl: '#', // Would be Cloudflare Video URL
    },
    {
      id: 'concepts',
      type: 'text',
      title: 'Core Concepts and Definitions',
      completed: false,
      content: `
# Understanding Quadratic Equations

A quadratic equation is a polynomial equation of the second degree, meaning it contains a term with x².

## Standard Form
The standard form of a quadratic equation is:
**ax² + bx + c = 0**

Where:
- a, b, and c are coefficients
- a ≠ 0 (otherwise it wouldn't be quadratic)
- x is the variable

## Key Components

### The x² term
This is what makes the equation "quadratic". It creates the parabolic shape when graphed.

### The Linear Term (bx)
This term affects the position and direction of the parabola.

### The Constant Term (c)
This term affects where the parabola crosses the y-axis.

## Examples
- 2x² + 5x + 3 = 0
- x² - 4 = 0
- 3x² = 12x - 5
      `,
    },
    {
      id: 'methods',
      type: 'interactive',
      title: 'Solving Methods Practice',
      completed: false,
      practiceQuestions: [
        {
          id: 'q1',
          question: 'Solve for x: x² + 5x + 6 = 0',
          options: ['x = -2, x = -3', 'x = 2, x = 3', 'x = -1, x = -6', 'x = 1, x = 6'],
          correctAnswer: 0,
          explanation: 'Factor the quadratic: (x + 2)(x + 3) = 0, so x = -2 or x = -3',
        },
        {
          id: 'q2',
          question: 'What is the discriminant of 2x² + 4x + 2 = 0?',
          options: ['16', '8', '0', '4'],
          correctAnswer: 2,
          explanation: 'The discriminant is b² - 4ac = 4² - 4(2)(2) = 16 - 16 = 0',
        },
      ],
    },
    {
      id: 'application',
      type: 'video',
      title: 'Real-World Applications',
      duration: '8:15',
      completed: false,
      videoUrl: '#',
    },
    {
      id: 'practice',
      type: 'interactive',
      title: 'Practice Problems',
      completed: false,
      practiceQuestions: [
        {
          id: 'q3',
          question: 'A ball is thrown upward with an initial velocity of 20 m/s. The height h (in meters) after t seconds is given by h = -5t² + 20t + 2. When does the ball reach its maximum height?',
          options: ['t = 2 seconds', 't = 4 seconds', 't = 10 seconds', 't = 1 second'],
          correctAnswer: 0,
          explanation: 'The maximum height occurs at t = -b/2a = -20/(2 × -5) = 2 seconds',
        },
      ],
    },
  ];

  const currentTopic = topicData['quadratic-equations'];

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access topic content.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const handleSectionComplete = () => {
    if (!completedSections.includes(currentSection)) {
      setCompletedSections(prev => [...prev, currentSection]);
    }
  };

  const handleNext = () => {
    handleSectionComplete();
    if (currentSection < contentSections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const currentSectionData = contentSections[currentSection];
  const progress = ((completedSections.length + (currentSection === contentSections.length - 1 ? 1 : 0)) / contentSections.length) * 100;

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col">
        {/* Topic Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => window.history.back()}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Learning
              </Button>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentTopic.color}`}>
                  <currentTopic.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{currentTopic.title}</h1>
                  <p className="text-sm text-gray-600">{currentTopic.subject} • {currentTopic.estimatedTime}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-black h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-gray-50">
          <div className="flex h-full">
            {/* Sidebar - Navigation & Info */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              {/* Learning Objectives */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Learning Objectives</h3>
                <ul className="space-y-2">
                  {currentTopic.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section Navigation */}
              <div className="flex-1 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Topic Sections</h3>
                <div className="space-y-2">
                  {contentSections.map((section, index) => {
                    const isCompleted = completedSections.includes(index);
                    const isCurrent = index === currentSection;

                    return (
                      <button
                        key={section.id}
                        onClick={() => setCurrentSection(index)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isCurrent
                            ? 'border-black bg-black/5'
                            : isCompleted
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isCompleted
                              ? 'border-green-500 bg-green-500'
                              : isCurrent
                              ? 'border-black bg-black'
                              : 'border-gray-300'
                          }`}>
                            {(isCompleted || isCurrent) && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${
                              isCurrent ? 'text-black' : isCompleted ? 'text-green-700' : 'text-gray-700'
                            }`}>
                              {section.title}
                            </p>
                            {section.duration && (
                              <p className="text-xs text-gray-500">{section.duration}</p>
                            )}
                          </div>
                          {section.type === 'video' && (
                            <Video className="h-4 w-4 text-gray-400" />
                          )}
                          {section.type === 'text' && (
                            <FileText className="h-4 w-4 text-gray-400" />
                          )}
                          {section.type === 'interactive' && (
                            <Target className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 border-t border-gray-200">
                <Button className="w-full" asChild>
                  <a href={`/learning/chat/quadratic-equations`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat with AI Tutor
                  </a>
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8">
              <div className="max-w-4xl mx-auto">
                {/* Video Section */}
                {currentSectionData.type === 'video' && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentSectionData.title}</h2>

                      {/* Video Player */}
                      <div className="relative bg-black rounded-lg aspect-video mb-6">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">Video Player</p>
                            <p className="text-sm opacity-75">Cloudflare Video integration coming soon</p>
                          </div>
                        </div>

                        {/* Video Controls */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <div className="flex items-center gap-4 text-white">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsPlaying(!isPlaying)}
                              className="text-white hover:text-white/80"
                            >
                              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>

                            <div className="flex-1">
                              <div className="bg-white/30 rounded-full h-1">
                                <div
                                  className="bg-white h-1 rounded-full"
                                  style={{ width: `${videoProgress}%` }}
                                />
                              </div>
                            </div>

                            <span className="text-sm font-mono">2:45 / 5:30</span>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsMuted(!isMuted)}
                              className="text-white hover:text-white/80"
                            >
                              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>

                            <Button variant="ghost" size="sm" className="text-white hover:text-white/80">
                              <Maximize className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button variant="outline" onClick={handlePrevious} disabled={currentSection === 0}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button onClick={handleNext}>
                          Mark as Complete
                          <CheckCircle className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Text Section */}
                {currentSectionData.type === 'text' && currentSectionData.content && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentSectionData.title}</h2>

                      <div className="prose prose-sm max-w-none">
                        {currentSectionData.content.split('\n').map((line, index) => {
                          if (line.startsWith('# ')) {
                            return <h1 key={index} className="text-2xl font-bold text-gray-900 mb-4">{line.slice(2)}</h1>;
                          }
                          if (line.startsWith('## ')) {
                            return <h2 key={index} className="text-xl font-semibold text-gray-900 mb-3">{line.slice(3)}</h2>;
                          }
                          if (line.startsWith('### ')) {
                            return <h3 key={index} className="text-lg font-medium text-gray-900 mb-2">{line.slice(4)}</h3>;
                          }
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <p key={index} className="font-semibold text-gray-900 mb-2">{line.slice(2, -2)}</p>;
                          }
                          if (line.startsWith('- ')) {
                            return <li key={index} className="ml-4 text-gray-700">{line.slice(2)}</li>;
                          }
                          if (line.trim()) {
                            return <p key={index} className="text-gray-700 mb-2">{line}</p>;
                          }
                          return <br key={index} />;
                        })}
                      </div>

                      <div className="flex justify-between mt-8">
                        <Button variant="outline" onClick={handlePrevious} disabled={currentSection === 0}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button onClick={handleNext}>
                          Continue
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Interactive Section */}
                {currentSectionData.type === 'interactive' && currentSectionData.practiceQuestions && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentSectionData.title}</h2>

                      <PracticeQuestions
                        questions={currentSectionData.practiceQuestions}
                        onComplete={handleNext}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Practice Questions Component
const PracticeQuestions: React.FC<{
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
  onComplete: () => void;
}> = ({ questions, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const question = questions[currentQuestion];

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    setShowResult(true);
    if (selectedAnswer === question.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Question {currentQuestion + 1} of {questions.length}
        </span>
        <span className="text-sm font-medium text-gray-900">
          Score: {score}/{questions.length}
        </span>
      </div>

      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{question.question}</h3>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctAnswer;
            const showCorrect = showResult && isCorrect;
            const showWrong = showResult && isSelected && !isCorrect;

            return (
              <button
                key={index}
                onClick={() => !showResult && setSelectedAnswer(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  showCorrect
                    ? 'border-green-500 bg-green-50'
                    : showWrong
                    ? 'border-red-500 bg-red-50'
                    : isSelected
                    ? 'border-black bg-black/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected || showCorrect
                      ? 'border-black bg-black'
                      : 'border-gray-300'
                  }`}>
                    {(isSelected || showCorrect) && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showResult && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">
                {selectedAnswer === question.correctAnswer ? 'Correct!' : 'Not quite right'}
              </p>
              <p className="text-sm text-blue-800">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline">
          Skip Question
        </Button>
        {!showResult ? (
          <Button onClick={handleSubmit} disabled={selectedAnswer === null}>
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentQuestion === questions.length - 1 ? 'Complete' : 'Next Question'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TopicWalkthrough;