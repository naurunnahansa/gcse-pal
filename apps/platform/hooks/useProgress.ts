import { useState, useEffect } from 'react';

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

const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://gcse-pal.vercel.app'
  : 'http://localhost:3000';

class ProgressAPI {
  static async getProgressData(): Promise<ProgressData> {
    const response = await fetch(`${API_BASE}/api/progress/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch progress data: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch progress data');
    }

    return data.data;
  }
}

export function useProgress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      const progressData = await ProgressAPI.getProgressData();
      setData(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const refresh = () => {
    fetchProgressData();
  };

  return {
    data,
    loading,
    error,
    refresh,
  };
}

export default useProgress;