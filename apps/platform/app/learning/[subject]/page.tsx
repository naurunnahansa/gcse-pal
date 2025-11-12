'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  BookOpen,
  Brain,
  MessageCircle,
  Clock,
  TrendingUp,
  CheckCircle,
  Circle,
  Play,
  ArrowLeft,
  Target,
  Video,
  FileText,
  Users,
  Star,
  Calendar,
  Award,
  BarChart3,
} from "lucide-react";

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
  modules: Array<{
    name: string;
    progress: number;
    lessons: number;
  }>;
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
    modules: [
      { name: 'Number Theory', progress: 100, lessons: 25 },
      { name: 'Algebra', progress: 85, lessons: 40 },
      { name: 'Geometry', progress: 45, lessons: 35 },
      { name: 'Statistics', progress: 30, lessons: 25 },
      { name: 'Probability', progress: 0, lessons: 20 },
      { name: 'Trigonometry', progress: 15, lessons: 20 },
    ]
  },
  'english-literature': {
    id: 'english-literature',
    name: 'English Literature',
    description: 'Explore Shakespeare, poetry analysis, and critical reading skills',
    color: 'bg-green-500',
    progress: 45,
    totalLessons: 98,
    completedLessons: 44,
    timeSpent: 28.3,
    nextLesson: 'Macbeth - Act 2 Analysis',
    instructor: 'Prof. Michael Chen',
    rating: 4.9,
    topics: ['Shakespeare', 'Poetry Analysis', 'Essay Writing', 'Literary Devices', 'Modern Literature', 'Critical Reading'],
    modules: [
      { name: 'Poetry Analysis', progress: 100, lessons: 20 },
      { name: 'Shakespeare Studies', progress: 60, lessons: 35 },
      { name: 'Essay Writing', progress: 25, lessons: 25 },
      { name: 'Modern Literature', progress: 0, lessons: 18 },
    ]
  },
  biology: {
    id: 'biology',
    name: 'Biology',
    description: 'Explore life sciences from cells to ecosystems and human biology',
    color: 'bg-purple-500',
    progress: 82,
    totalLessons: 112,
    completedLessons: 92,
    timeSpent: 52.1,
    nextLesson: 'Genetic Inheritance Patterns',
    instructor: 'Dr. Emily Roberts',
    rating: 4.7,
    topics: ['Cell Biology', 'Genetics', 'Ecology', 'Human Biology', 'Evolution', 'Biochemistry'],
    modules: [
      { name: 'Cell Biology', progress: 100, lessons: 30 },
      { name: 'Genetics', progress: 90, lessons: 28 },
      { name: 'Ecology', progress: 85, lessons: 25 },
      { name: 'Human Biology', progress: 75, lessons: 29 },
    ]
  },
  chemistry: {
    id: 'chemistry',
    name: 'Chemistry',
    description: 'Understand atomic structure, reactions, and practical laboratory skills',
    color: 'bg-orange-500',
    progress: 53,
    totalLessons: 105,
    completedLessons: 56,
    timeSpent: 31.8,
    nextLesson: 'Chemical Bonding - Covalent Bonds',
    instructor: 'Dr. James Wilson',
    rating: 4.6,
    topics: ['Atomic Structure', 'Chemical Reactions', 'Organic Chemistry', 'Laboratory Skills', 'Periodic Table'],
    modules: [
      { name: 'Atomic Structure', progress: 80, lessons: 25 },
      { name: 'Chemical Reactions', progress: 40, lessons: 30 },
      { name: 'Organic Chemistry', progress: 25, lessons: 25 },
      { name: 'Laboratory Skills', progress: 60, lessons: 25 },
    ]
  },
  physics: {
    id: 'physics',
    name: 'Physics',
    description: 'Master forces, motion, energy, electricity, and waves',
    color: 'bg-red-500',
    progress: 37,
    totalLessons: 95,
    completedLessons: 35,
    timeSpent: 22.4,
    nextLesson: 'Newton\'s Laws of Motion',
    instructor: 'Dr. Alan Turing',
    rating: 4.7,
    topics: ['Mechanics', 'Energy', 'Electricity', 'Waves', 'Forces', 'Thermodynamics'],
    modules: [
      { name: 'Mechanics', progress: 50, lessons: 30 },
      { name: 'Energy', progress: 30, lessons: 25 },
      { name: 'Electricity', progress: 25, lessons: 20 },
      { name: 'Waves', progress: 40, lessons: 20 },
    ]
  },
  history: {
    id: 'history',
    name: 'History',
    description: 'Study major world events, civilizations, and historical developments',
    color: 'bg-indigo-500',
    progress: 61,
    totalLessons: 82,
    completedLessons: 50,
    timeSpent: 35.2,
    nextLesson: 'Industrial Revolution Impact',
    instructor: 'Dr. Margaret Brown',
    rating: 4.8,
    topics: ['Ancient Civilizations', 'World Wars', 'Industrial Revolution', 'Modern History', 'Historical Analysis'],
    modules: [
      { name: 'Ancient Civilizations', progress: 90, lessons: 25 },
      { name: 'World Wars', progress: 75, lessons: 20 },
      { name: 'Industrial Revolution', progress: 50, lessons: 18 },
      { name: 'Modern History', progress: 40, lessons: 19 },
    ]
  }
};

const SubjectLearningPage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'learn' | 'test' | 'chat'>('learn');

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
          <p className="text-muted-foreground mb-4">Please sign in to access learning content.</p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const subjectId = params.subject as string;
  const subject = subjectsData[subjectId];

  // If subject not found, redirect to dashboard
  if (!subject) {
    router.push('/dashboard');
    return null;
  }

  const tabs = [
    { id: 'learn', name: 'Learn Mode', icon: BookOpen },
    { id: 'test', name: 'Test Mode', icon: Brain },
    { id: 'chat', name: 'Chat Mode', icon: MessageCircle },
  ];

  const renderLearnMode = () => (
    <div className="space-y-6">
      {/* Course Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Course Progress</h3>
              <p className="text-gray-600">Track your learning journey</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{subject.progress}%</p>
              <p className="text-sm text-gray-500">{subject.completedLessons} of {subject.totalLessons} lessons</p>
            </div>
          </div>

          {/* Module Progress */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Module Progress</h4>
            {subject.modules.map((module, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{module.name}</span>
                  <span className="text-sm text-gray-500">{module.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${subject.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Next Lesson */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-700">Next Lesson</h4>
                <p className="text-sm text-gray-600 mt-1">{subject.nextLesson}</p>
              </div>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Play className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Topics Covered</h3>
            <div className="flex flex-wrap gap-2">
              {subject.topics.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Course Statistics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Time Spent</span>
                <span className="font-medium">{subject.timeSpent} hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Instructor</span>
                <span className="font-medium">{subject.instructor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rating</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="ml-1 font-medium">{subject.rating}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lessons */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Lessons</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((lesson) => (
              <div key={lesson} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Lesson {lesson}: {subject.topics[lesson % subject.topics.length]} Introduction</p>
                  <p className="text-sm text-gray-500">Completed 2 days ago • 45 min</p>
                </div>
                <Button variant="outline" size="sm">Review</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTestMode = () => (
    <div className="space-y-6">
      {/* Test Overview */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Assessment Center</h3>
          <p className="text-gray-600 mb-6">Test your knowledge with interactive quizzes and assessments</p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="font-semibold">Quick Quiz</p>
              <p className="text-sm text-gray-600">5-min assessment</p>
              <Button className="mt-3 bg-black text-white hover:bg-gray-800">Start</Button>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Brain className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="font-semibold">Module Test</p>
              <p className="text-sm text-gray-600">Topic-specific</p>
              <Button variant="outline" className="mt-3">Start</Button>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-semibold">Full Exam</p>
              <p className="text-gray-600">Comprehensive test</p>
              <Button variant="outline" className="mt-3">Start</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Test Results */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Test Results</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="font-medium text-green-900">Algebra Basics Quiz</p>
                <p className="text-sm text-green-700">Score: 85%</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Passed</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p className="font-medium text-yellow-900">Geometry Mid-Term</p>
                <p className="text-sm text-yellow-700">Score: 72%</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Review</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderChatMode = () => (
    <div className="space-y-6">
      {/* Chat Interface */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Topic Discussion</h3>
          <p className="text-gray-600 mb-6">Chat with AI tutors about {subject.name} concepts and get instant help</p>

          {/* Chat Messages */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm">Can you help me understand quadratic equations better?</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 p-3 bg-green-50 rounded-lg">
                <p className="text-sm">Of course! Quadratic equations are mathematical expressions where the highest power of the variable is 2. Let me break down the key concepts...</p>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={`Ask about ${subject.name} concepts...`}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <Button className="bg-black text-white hover:bg-gray-800">
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Popular Topics */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Popular Discussion Topics</h3>
          <div className="flex flex-wrap gap-2">
            {subject.topics.slice(0, 4).map((topic, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  // Handle topic selection
                }}
              >
                {topic}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const modeOptions = [
    { id: 'learn', name: 'Learn Mode', icon: BookOpen },
    { id: 'test', name: 'Test Mode', icon: Brain },
    { id: 'chat', name: 'Chat Mode', icon: MessageCircle },
  ];

  return (
    <UnifiedLayout
      userRole="student"
      title={subject.name}
      subjectName={subject.name}
      modeOptions={modeOptions}
      activeMode={activeTab}
      onModeChange={(mode) => setActiveTab(mode as 'learn' | 'test' | 'chat')}
    >
      <div className="flex-1">
        {/* Subject Header */}

        {/* Content Area */}
        <div className="bg-gray-50 p-6">
          {activeTab === 'learn' && renderLearnMode()}
          {activeTab === 'test' && renderTestMode()}
          {activeTab === 'chat' && renderChatMode()}
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default SubjectLearningPage;
