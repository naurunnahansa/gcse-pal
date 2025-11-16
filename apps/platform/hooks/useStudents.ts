import { useState, useEffect } from 'react';

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

interface StudentsResponse {
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

interface UseStudentsOptions {
  autoFetch?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  grade?: string;
  status?: string;
}

export const useStudents = (options: UseStudentsOptions = {}) => {
  const {
    autoFetch = true,
    page = 1,
    limit = 50,
    search = '',
    grade = '',
    status = '',
  } = options;

  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    total: 0,
    active: 0,
    inactive: 0,
    atRisk: 0,
    avgProgress: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const fetchStudents = async (fetchOptions?: Partial<UseStudentsOptions>) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(fetchOptions?.page || page),
        limit: String(fetchOptions?.limit || limit),
      });

      if (fetchOptions?.search || search) {
        params.append('search', fetchOptions?.search || search);
      }

      if (fetchOptions?.grade || grade) {
        params.append('grade', fetchOptions?.grade || grade);
      }

      if (fetchOptions?.status || status) {
        params.append('status', fetchOptions?.status || status);
      }

      const response = await fetch(`/api/admin/students?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: StudentsResponse = await response.json();

      if (result.success && result.data) {
        setStudents(result.data.students);
        setStats(result.data.stats);
        setPagination(result.data.pagination);
      } else {
        throw new Error(result.error || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
      // Set empty state on error
      setStudents([]);
      setStats({
        total: 0,
        active: 0,
        inactive: 0,
        atRisk: 0,
        avgProgress: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchStudents();
    }
  }, [autoFetch, page, limit]);

  return {
    students,
    stats,
    loading,
    error,
    pagination,
    fetchStudents,
    refetch: () => fetchStudents(),
  };
};

interface StudentDetail {
  student: Student & {
    stats: StudentStats;
    role?: string;
  };
  enrollments: Array<{
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
  }>;
}

interface UseStudentOptions {
  autoFetch?: boolean;
}

export const useStudent = (studentId: string, options: UseStudentOptions = {}) => {
  const { autoFetch = true } = options;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudent = async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/students/${studentId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setStudent(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch student');
      }
    } catch (err) {
      console.error('Error fetching student:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch student');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && studentId) {
      fetchStudent();
    }
  }, [autoFetch, studentId]);

  return {
    student,
    loading,
    error,
    refetch: fetchStudent,
  };
};