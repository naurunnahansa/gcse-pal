'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useChat } from '@ai-sdk/react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
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
  ChevronDown,
  ChevronRight,
  GlobeIcon,
  Monitor,
  Layers,
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

const models = [
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o',
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1',
  },
];

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
            type: 'hybrid',
            completed: true,
            progress: 100,
            hasVideo: true,
            hasMarkdown: true,
            videoUrl: '/content/math/prime-numbers.mp4',
            markdownUrl: '/content/math/prime-numbers.md'
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
      },
      {
        id: 'chapter-3',
        title: 'Geometry',
        description: 'Shapes, angles, areas, and geometric relationships',
        progress: 45,
        estimatedDuration: '10 hours',
        lessons: [
          {
            id: 'math-3-1',
            title: 'Basic Geometry Concepts',
            description: 'Points, lines, planes, and angles',
            duration: '55 min',
            type: 'video',
            completed: true,
            progress: 100,
            videoUrl: '/content/math/basic-geometry.mp4'
          },
          {
            id: 'math-3-2',
            title: 'Triangles and Circles',
            description: 'Properties of triangles and circles',
            duration: '70 min',
            type: 'video',
            completed: true,
            progress: 100,
            videoUrl: '/content/math/triangles-circles.mp4'
          },
          {
            id: 'math-3-3',
            title: 'Area and Perimeter',
            description: 'Calculating areas and perimeters of 2D shapes',
            duration: '60 min',
            type: 'exercise',
            completed: false,
            progress: 0
          }
        ]
      }
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
    chapters: [
      {
        id: 'chapter-1',
        title: 'Poetry Analysis',
        description: 'Understanding poetic devices, themes, and structure',
        progress: 100,
        estimatedDuration: '6 hours',
        lessons: [
          {
            id: 'eng-1-1',
            title: 'Introduction to Poetry',
            duration: '40 min',
            type: 'video',
            completed: true,
            progress: 100
          },
          {
            id: 'eng-1-2',
            title: 'Poetic Devices',
            duration: '50 min',
            type: 'video',
            completed: true,
            progress: 100
          }
        ]
      },
      {
        id: 'chapter-2',
        title: 'Shakespeare Studies',
        description: 'In-depth analysis of Shakespeare\'s major works',
        progress: 60,
        estimatedDuration: '10 hours',
        lessons: [
          {
            id: 'eng-2-1',
            title: 'Macbeth Overview',
            duration: '45 min',
            type: 'video',
            completed: true,
            progress: 100
          },
          {
            id: 'eng-2-2',
            title: 'Macbeth - Act 1 Analysis',
            duration: '60 min',
            type: 'reading',
            completed: false,
            progress: 75,
            markdownUrl: '/content/eng/macbeth-act1.md'
          }
        ]
      }
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
    chapters: [
      {
        id: 'chapter-1',
        title: 'Cell Biology',
        description: 'Structure and function of cells',
        progress: 100,
        estimatedDuration: '8 hours',
        lessons: []
      },
      {
        id: 'chapter-2',
        title: 'Genetics',
        description: 'Heredity and DNA',
        progress: 90,
        estimatedDuration: '10 hours',
        lessons: []
      }
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
    chapters: [
      {
        id: 'chapter-1',
        title: 'Atomic Structure',
        description: 'Understanding atoms, elements, and the periodic table',
        progress: 80,
        estimatedDuration: '8 hours',
        lessons: [
          {
            id: 'chem-1-1',
            title: 'Introduction to Atomic Structure',
            description: 'Basic concepts of atoms and subatomic particles',
            duration: '45 min',
            type: 'video',
            completed: true,
            progress: 100,
            videoUrl: '/content/chem/atomic-structure-intro.mp4'
          },
          {
            id: 'chem-1-2',
            title: 'The Periodic Table',
            description: 'Understanding periodic trends and element groups',
            duration: '60 min',
            type: 'reading',
            completed: true,
            progress: 100,
            markdownUrl: '/content/chem/periodic-table.md'
          }
        ]
      },
      {
        id: 'chapter-2',
        title: 'Chemical Bonding',
        description: 'Ionic, covalent, and metallic bonds',
        progress: 30,
        estimatedDuration: '10 hours',
        lessons: [
          {
            id: 'chem-2-1',
            title: 'Ionic Bonds',
            description: 'Formation and properties of ionic compounds',
            duration: '55 min',
            type: 'video',
            completed: true,
            progress: 100
          },
          {
            id: 'chem-2-2',
            title: 'Covalent Bonds',
            description: 'Understanding covalent bonding and molecular structure',
            duration: '70 min',
            type: 'video',
            completed: false,
            progress: 45,
            videoUrl: '/content/chem/covalent-bonds.mp4'
          }
        ]
      }
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
    chapters: [
      {
        id: 'chapter-1',
        title: 'Mechanics',
        description: 'Forces, motion, and Newton\'s laws',
        progress: 50,
        estimatedDuration: '12 hours',
        lessons: [
          {
            id: 'phys-1-1',
            title: 'Introduction to Forces',
            description: 'Understanding types of forces and their effects',
            duration: '50 min',
            type: 'video',
            completed: true,
            progress: 100,
            videoUrl: '/content/phys/intro-forces.mp4'
          },
          {
            id: 'phys-1-2',
            title: 'Newton\'s Laws of Motion',
            description: 'The three fundamental laws of classical mechanics',
            duration: '75 min',
            type: 'video',
            completed: false,
            progress: 30,
            videoUrl: '/content/phys/newton-laws.mp4'
          }
        ]
      },
      {
        id: 'chapter-2',
        title: 'Energy and Work',
        description: 'Understanding energy, work, and power',
        progress: 25,
        estimatedDuration: '8 hours',
        lessons: [
          {
            id: 'phys-2-1',
            title: 'Work and Energy',
            description: 'The relationship between work and energy',
            duration: '60 min',
            type: 'reading',
            completed: false,
            progress: 0,
            markdownUrl: '/content/phys/work-energy.md'
          }
        ]
      }
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
    chapters: [
      {
        id: 'chapter-1',
        title: 'Ancient Civilizations',
        description: 'Study the foundations of human civilization',
        progress: 90,
        estimatedDuration: '10 hours',
        lessons: [
          {
            id: 'hist-1-1',
            title: 'Mesopotamian Civilizations',
            description: 'The cradle of civilization and early empires',
            duration: '55 min',
            type: 'video',
            completed: true,
            progress: 100,
            videoUrl: '/content/hist/mesopotamia.mp4'
          },
          {
            id: 'hist-1-2',
            title: 'Ancient Egypt',
            description: 'The civilization of the Nile Valley',
            duration: '65 min',
            type: 'reading',
            completed: true,
            progress: 100,
            markdownUrl: '/content/hist/ancient-egypt.md'
          }
        ]
      },
      {
        id: 'chapter-2',
        title: 'Industrial Revolution',
        description: 'The transformation of society through industrialization',
        progress: 45,
        estimatedDuration: '8 hours',
        lessons: [
          {
            id: 'hist-2-1',
            title: 'Industrial Revolution Impact',
            description: 'Social and economic changes in the 18th-19th centuries',
            duration: '70 min',
            type: 'video',
            completed: false,
            progress: 25,
            videoUrl: '/content/hist/industrial-revolution.mp4'
          }
        ]
      }
    ]
  }
};

const getContentTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return Video;
    case 'reading':
      return FileText;
    case 'quiz':
      return Brain;
    case 'exercise':
      return Target;
    case 'hybrid':
      return Layers;
    default:
      return BookOpen;
  }
};

const SubjectLearningPage = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'learn' | 'test' | 'chat'>('learn');
  const [openChapters, setOpenChapters] = useState<string[]>([]);

  // Chat state
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status } = useChat();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleChapter = (chapterId: string) => {
    setOpenChapters(prev =>
      prev.includes(chapterId)
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleChatSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      },
    );
    setInput('');
  };

  const handleLessonClick = (lesson: Lesson) => {
    // Navigate to lesson content page
    console.log(`📚 Opening lesson: ${lesson.title}`);
    console.log(`🆔 Lesson ID: ${lesson.id}`);
    console.log(`📊 Type: ${lesson.type}`);
    console.log(`⏱️ Duration: ${lesson.duration}`);
    console.log(`✅ Progress: ${lesson.progress}%`);

    // Navigate to the lesson viewer page
    router.push(`/learning/${subject.id}/${lesson.id}`);
  };

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
              <p className="text-gray-600">Track your learning journey through {subject.chapters.length} chapters</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{subject.progress}%</p>
              <p className="text-sm text-gray-500">{subject.completedLessons} of {subject.totalLessons} lessons</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-500">{subject.progress}%</span>
            </div>
            <Progress value={subject.progress} className="h-3" />
          </div>

          {/* Next Lesson */}
          <div className="pt-6 border-t">
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

      {/* Chapters and Lessons Table */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-6">Course Content</h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Chapter</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Duration</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Progress</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {subject.chapters.map((chapter) => (
                  <React.Fragment key={chapter.id}>
                    {/* Chapter Row */}
                    <tr
                      className="border-b cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleChapter(chapter.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 flex items-center justify-center">
                            {openChapters.includes(chapter.id) ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <span className="font-medium text-sm">{chapter.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{chapter.title}</p>
                          <p className="text-sm text-gray-500">{chapter.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {chapter.lessons.length} lessons • {chapter.estimatedDuration}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">Chapter</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{chapter.estimatedDuration}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm font-medium">{chapter.progress}%</span>
                          <Progress value={chapter.progress} className="w-16 h-2" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {chapter.progress === 100 ? (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          ) : chapter.progress > 0 ? (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-blue-500">
                              <Play className="w-3 h-3 text-blue-500" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-300">
                              <Circle className="w-3 h-3 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Lessons Rows (Collapsible) */}
                    {openChapters.includes(chapter.id) && chapter.lessons.map((lesson, lessonIndex) => {
                      const IconComponent = getContentTypeIcon(lesson.type);
                      return (
                        <tr
                          key={lesson.id}
                          className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                            lesson.completed ? 'bg-green-50/30' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLessonClick(lesson);
                          }}
                        >
                          <td className="py-3 px-4 pl-12">
                            <span className="text-sm text-gray-600">Lesson {lessonIndex + 1}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="font-medium text-sm">{lesson.title}</p>
                                <p className="text-xs text-gray-500">{lesson.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              lesson.type === 'video' ? 'bg-blue-100 text-blue-700' :
                              lesson.type === 'reading' ? 'bg-green-100 text-green-700' :
                              lesson.type === 'quiz' ? 'bg-orange-100 text-orange-700' :
                              lesson.type === 'exercise' ? 'bg-purple-100 text-purple-700' :
                              lesson.type === 'hybrid' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {lesson.type === 'hybrid' ? 'Video + Text' : lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">{lesson.duration}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {lesson.completed ? (
                              <span className="text-sm font-medium text-green-600">100%</span>
                            ) : lesson.progress > 0 ? (
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-xs font-medium">{lesson.progress}%</span>
                                <Progress value={lesson.progress} className="w-10 h-1.5" />
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">0%</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {lesson.completed ? (
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-300">
                                <Play className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {subject.chapters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No chapters available in this course yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Statistics */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Course Statistics</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="font-semibold">{subject.timeSpent} hours</p>
              <p className="text-sm text-gray-600">Time Spent</p>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-semibold">{subject.instructor}</p>
              <p className="text-sm text-gray-600">Instructor</p>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="font-semibold">{subject.rating}</p>
              <p className="text-sm text-gray-600">Rating</p>
            </div>
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
    <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="flex-1 relative">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Brain className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {subject.name} AI Tutor
                </h3>
                <p className="text-gray-500 mb-6">
                  Ask questions about {subject.name.toLowerCase()} concepts, get help with homework, or explore new topics
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {subject.topics.slice(0, 4).map((topic, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(`Can you help me understand ${topic.toLowerCase()}?`);
                      }}
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Message key={`${message.id}-${i}`} from={message.role}>
                          <MessageContent>
                            {part.text}
                          </MessageContent>
                        </Message>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="border-t bg-white p-4">
        <PromptInput onSubmit={handleChatSubmit} globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder={`Ask about ${subject.name} concepts...`}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
                title="Enable web search for current information"
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.value} value={model.value}>
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
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
