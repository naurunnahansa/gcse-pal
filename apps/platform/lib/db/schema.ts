// Database Schema for GCSE Learning Platform
// This file defines the complete database schema for the application

export interface User {
  id: string;
  clerkId: string; // Clerk authentication ID
  email: string;
  name: string;
  avatar?: string;
  role: 'student' | 'admin' | 'teacher';
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  subject: 'mathematics' | 'english' | 'science' | 'history' | 'geography' | 'other';
  level: 'gcse' | 'igcse' | 'a-level';
  thumbnail?: string;
  instructor: string;
  instructorId?: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  status: 'draft' | 'published' | 'archived';
  enrollmentCount: number;
  rating: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  duration: number; // in minutes
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  content?: string; // Rich text content
  videoUrl?: string;
  videoDuration?: number; // in seconds
  markdownPath?: string; // Path to markdown file
  hasVideo: boolean;
  hasMarkdown: boolean;
  order: number;
  duration: number; // in minutes
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date;
  progress: number; // 0-100 percentage
  status: 'active' | 'completed' | 'paused' | 'dropped';
}

export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  chapterId?: string;
  lessonId?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  timeSpent: number; // in minutes
  score?: number; // quiz/exam score
  lastAccessedAt: Date;
}

export interface Quiz {
  id: string;
  lessonId?: string;
  chapterId?: string;
  courseId?: string;
  title: string;
  description: string;
  questions: Question[];
  timeLimit?: number; // in minutes
  passingScore: number;
  maxAttempts: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  quizId: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation?: string;
  points: number;
  order: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  answers: QuizAnswer[];
  score: number;
  passed: boolean;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number; // in minutes
  attemptNumber: number;
}

export interface QuizAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  points: number;
}

export interface Note {
  id: string;
  userId: string;
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
  title: string;
  content: string; // Rich text content
  tags: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  completedAt?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudySession {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  pagesRead?: number;
  videosWatched?: number;
  notes?: string;
  activities: StudyActivity[];
}

export interface StudyActivity {
  id: string;
  sessionId: string;
  type: 'watch_video' | 'read_markdown' | 'take_quiz' | 'take_notes' | 'practice_exercise';
  resourceId: string; // lessonId, quizId, etc.
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  data?: any; // Additional activity-specific data
}

export interface Bookmark {
  id: string;
  userId: string;
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
  timestamp?: number; // For video bookmarks
  note?: string;
  createdAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    studyReminders: boolean;
    deadlineReminders: boolean;
  };
  studyPreferences: {
    dailyGoal: number; // minutes
    preferredStudyTime: 'morning' | 'afternoon' | 'evening';
    studyDays: number[]; // 0-6 (Sunday-Saturday)
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  id: string;
  userId: string;
  date: Date; // YYYY-MM-DD
  studyTime: number; // total minutes studied
  lessonsCompleted: number;
  quizScores: number[]; // all quiz scores for the day
  subjectsStudied: string[];
  activitiesCompleted: number;
}

// JOIN tables for many-to-many relationships
export interface CourseTag {
  courseId: string;
  tag: string;
}

export interface UserFavorite {
  userId: string;
  courseId: string;
  createdAt: Date;
}

export interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  courseId: string;
  creatorId: string;
  isPrivate: boolean;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyGroupMember {
  groupId: string;
  userId: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: Date;
}

export interface StudyGroupMessage {
  id: string;
  groupId: string;
  userId: string;
  content: string;
  type: 'text' | 'file' | 'link';
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Dashboard analytics types
export interface UserDashboard {
  user: User;
  progress: {
    totalCoursesEnrolled: number;
    coursesCompleted: number;
    totalStudyTime: number;
    averageQuizScore: number;
    currentStreak: number;
    weeklyGoal: {
      target: number;
      current: number;
      percentage: number;
    };
  };
  recentActivity: StudySession[];
  upcomingDeadlines: Task[];
  recommendedCourses: Course[];
  enrolledCourses: (Course & Enrollment)[];
}

// Course analytics for instructors/admins
export interface CourseAnalytics {
  courseId: string;
  totalEnrollments: number;
  activeStudents: number;
  completionRate: number;
  averageTimeToComplete: number;
  averageQuizScore: number;
  chapterProgress: Array<{
    chapterId: string;
    chapterTitle: string;
    completionRate: number;
    averageTimeSpent: number;
  }>;
  enrollmentByMonth: Array<{
    month: string;
    enrollments: number;
  }>;
  studentPerformance: Array<{
    studentId: string;
    studentName: string;
    progress: number;
    quizScores: number[];
    studyTime: number;
  }>;
}