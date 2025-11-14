export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Progress {
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
}

export interface Activity {
  id: string;
  type: string;
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
}

export interface Deadline {
  id: string;
  title: string;
  course: {
    id: string;
    title: string;
  };
  priority: string;
  dueDate: string;
}

export interface Enrollment {
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
}

export interface DashboardStats {
  user: User;
  progress: Progress;
  recentActivity: Activity[];
  upcomingDeadlines: Deadline[];
  subjectDistribution: Record<string, number>;
  enrolledCourses: Enrollment[];
}

export class DashboardAPI {
  private static baseUrl = '/api/dashboard/stats';

  static async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(this.baseUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch dashboard stats');
    }

    return data.data;
  }
}