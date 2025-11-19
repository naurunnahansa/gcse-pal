import { api } from '../api';

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  enrolledCourses: number;
  completedCourses: number;
  studyTime: number;
  lastActive: string;
  status: 'active' | 'inactive' | 'at-risk';
  progress: number;
  createdAt?: string;
  updatedAt?: string;
  clerkId?: string;
}

interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  atRisk: number;
  avgProgress: number;
}

interface StudentEnrollment {
  id: string;
  course: {
    id: string;
    title: string;
    description: string;
    subject: string;
    level: string;
    status: string;
  };
  status: string;
  progress: number;
  enrolledAt: string;
  lastAccessed: string | null;
}

interface StudentDetail {
  student: Student & {
    stats: StudentStats;
    role?: string;
  };
  enrollments: StudentEnrollment[];
}

interface StudentsListResponse {
  success: boolean;
  data: {
    students: Student[];
    stats: StudentStats;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  } | null;
  error?: string;
}

interface StudentFilter {
  page?: number;
  limit?: number;
  search?: string;
  grade?: string;
  status?: string;
}

export class StudentsAPI {
  private static basePath = '/admin/students';

  static async getStudents(filters: StudentFilter = {}): Promise<StudentsListResponse['data']> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const path = `${this.basePath}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<StudentsListResponse>(path);
    return response.data;
  }

  static async getStudent(id: string): Promise<StudentDetail> {
    const response = await api.get<{ success: boolean; data: StudentDetail }>(`${this.basePath}/${id}`);
    return response.data;
  }

  static async createStudent(studentData: Partial<Student>): Promise<Student> {
    const response = await api.post<{ success: boolean; data: Student }>(this.basePath, studentData);
    return response.data;
  }

  static async updateStudent(id: string, studentData: Partial<Student>): Promise<Student> {
    const response = await api.put<{ success: boolean; data: Student }>(`${this.basePath}/${id}`, studentData);
    return response.data;
  }

  static async deleteStudent(id: string): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }
}

export type { Student, StudentStats, StudentDetail, StudentEnrollment, StudentFilter };