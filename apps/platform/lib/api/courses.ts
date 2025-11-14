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

export interface CourseResponse {
  success: boolean;
  data: Course[];
  pagination: Pagination;
}

export class CoursesAPI {
  private static baseUrl = '/api/courses';

  static async getCourses(filters: CourseFilter = {}): Promise<CourseResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch courses');
    }

    return data;
  }

  static async getCourse(id: string): Promise<Course> {
    const response = await fetch(`${this.baseUrl}/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch course: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch course');
    }

    return data.data;
  }

  static async createCourse(courseData: Partial<Course>): Promise<Course> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create course: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create course');
    }

    return data.data;
  }
}