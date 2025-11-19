import { api } from '../api';

export interface CourseData {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  thumbnail?: string;
  instructor: string;
  duration: number;
  difficulty: string;
  chaptersCount: number;
  totalLessons: number;
}

export interface Enrollment {
  id: string;
  course: CourseData;
  enrolledAt: string;
  completedAt?: string;
  status: string;
  progress: number;
  lastAccessed: string;
}

export interface EnrollmentsData {
  enrollments: Enrollment[];
  statistics: {
    totalEnrollments: number;
    completedCourses: number;
    inProgressCourses: number;
    averageProgress: number;
  };
}

export class EnrollmentsAPI {
  private static basePath = '/enrollments';

  static async getMyEnrollments(): Promise<EnrollmentsData> {
    const response = await api.get<{ success: boolean; data: EnrollmentsData }>(`${this.basePath}/my/`);
    return response.data;
  }

  static async getEnrollment(id: string): Promise<Enrollment> {
    const response = await api.get<{ success: boolean; data: Enrollment }>(`${this.basePath}/${id}`);
    return response.data;
  }

  static async createEnrollment(courseId: string): Promise<Enrollment> {
    const response = await api.post<{ success: boolean; data: Enrollment }>(this.basePath, { courseId });
    return response.data;
  }

  static async updateProgress(id: string, progress: number): Promise<Enrollment> {
    const response = await api.patch<{ success: boolean; data: Enrollment }>(`${this.basePath}/${id}/progress`, { progress });
    return response.data;
  }
}