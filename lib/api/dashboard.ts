export interface DashboardStats {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  progress: {
    totalCoursesEnrolled: number;
    coursesCompleted: number;
    totalStudyTime: number; // in minutes
    averageQuizScore: number;
    currentStreak: number;
    weeklyGoal: {
      target: number; // minutes
      current: number; // minutes
      percentage: number;
    };
  };
  recentActivity: Array<{
    id: string;
    type: 'lesson' | 'course';
    course: {
      id: string;
      title: string;
      subject: string;
    };
    lesson?: {
      id: string;
      title: string;
    };
    startTime: string;
    duration: number;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
    };
    priority: string;
    dueDate: string;
  }>;
  subjectDistribution: Record<string, number>;
  enrolledCourses: Array<{
    id: string;
    title: string;
    subject: string;
    level: string;
    thumbnail?: string;
    difficulty: string;
    duration: number;
    enrollment: {
      id: string;
      progress: number;
      status: string;
      enrolledAt: string;
    };
  }>;
}

export interface DashboardResponse {
  success: boolean;
  data?: DashboardStats;
  error?: string;
}

class DashboardAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  /**
   * Fetch user dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
      };
    }
  }
}

// Export singleton instance
export const dashboardAPI = new DashboardAPI();