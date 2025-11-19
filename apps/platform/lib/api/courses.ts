import { api, APIResponse } from '../api';

export interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  thumbnail?: string;
  instructor: string;
  duration: number;
  difficulty: string;
  topics: string[];
  enrollmentCount: number;
  rating: number;
  price: number;
  chaptersCount: number;
  chapters: Array<{
    id: string;
    title: string;
    duration: number;
  }>;
  createdAt: string;
}

export interface CourseFilter {
  search?: string;
  subject?: string;
  level?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CourseListResponse {
  success: boolean;
  data: Course[];
  pagination: Pagination;
}

export class CoursesAPI {
  private static basePath = '/courses';

  static async getCourses(filters: CourseFilter = {}): Promise<CourseListResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const path = `${this.basePath}${params.toString() ? `?${params.toString()}` : ''}`;
    return api.get<CourseListResponse>(path);
  }

  static async getCourse(id: string): Promise<Course> {
    const response = await api.get<{ success: boolean; data: Course }>(`${this.basePath}/${id}`);
    return response.data;
  }

  static async createCourse(courseData: Partial<Course>): Promise<Course> {
    const response = await api.post<{ success: boolean; data: Course }>(this.basePath, courseData);
    return response.data;
  }

  static async updateCourse(id: string, courseData: Partial<Course>): Promise<Course> {
    const response = await api.put<{ success: boolean; data: Course }>(`${this.basePath}/${id}`, courseData);
    return response.data;
  }

  static async deleteCourse(id: string): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  static async enrollInCourse(courseId: string): Promise<any> {
    const response = await api.post(`${this.basePath}/${courseId}/enroll`);
    return response.data;
  }
}