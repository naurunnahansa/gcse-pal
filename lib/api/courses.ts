import { Course } from '@/lib/generated/prisma';

export interface CourseFilter {
  subject?: string;
  level?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CourseResponse {
  success: boolean;
  data?: Course[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}

class CoursesAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  /**
   * Fetch all courses with optional filtering
   */
  async getCourses(filters: CourseFilter = {}): Promise<CourseResponse> {
    try {
      const params = new URLSearchParams();

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const url = `${this.baseUrl}/courses${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Include cookies for authentication
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch courses',
      };
    }
  }

  /**
   * Fetch a single course by ID
   */
  async getCourseById(id: string): Promise<CourseResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${id}`, {
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
      console.error('Failed to fetch course:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch course',
      };
    }
  }

  /**
   * Create a new course (admin/teacher only)
   */
  async createCourse(courseData: Partial<Course>): Promise<CourseResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to create course:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create course',
      };
    }
  }

  /**
   * Update an existing course (admin/teacher only)
   */
  async updateCourse(id: string, courseData: Partial<Course>): Promise<CourseResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to update course:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update course',
      };
    }
  }

  /**
   * Delete a course (admin only)
   */
  async deleteCourse(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${id}`, {
        method: 'DELETE',
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
      console.error('Failed to delete course:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete course',
      };
    }
  }
}

// Export singleton instance
export const coursesAPI = new CoursesAPI();