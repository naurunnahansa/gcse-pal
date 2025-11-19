import { api } from '../api';

export interface ProgressData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  overallStats: {
    totalStudyTime: number; // hours
    weeklyGoal: number; // minutes per day
    weeklyProgress: number; // minutes
    totalQuestions: number;
    accuracyRate: number; // percentage
    streak: number; // days
    subjectsStudied: number;
  };
  subjectProgress: Array<{
    id: string;
    name: string;
    progress: number; // percentage
    totalTopics: number;
    completedTopics: number;
    studyTime: number; // hours
    questionsAnswered: number;
    accuracy: number; // percentage
    color: string;
    icon: string;
  }>;
  weeklyActivity: Array<{
    day: string;
    hours: number;
    topics: number;
    questions: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    earned: boolean;
    earnedDate?: string;
    progress?: number;
    total?: number;
  }>;
  recentMilestones: Array<{
    type: string;
    title: string;
    subject: string;
    date: string;
    icon: string;
  }>;
}

export class ProgressAPI {
  private static basePath = '/progress';

  static async getProgressData(): Promise<ProgressData> {
    const response = await api.get<{ success: boolean; data: ProgressData }>(`${this.basePath}/`);
    return response.data;
  }
}