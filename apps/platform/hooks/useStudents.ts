import { useState, useEffect } from 'react';
import {
  StudentsAPI,
  Student,
  StudentStats,
  StudentDetail,
  StudentEnrollment,
  StudentFilter
} from '../lib/api/students';

// Re-export types for backward compatibility
export type {
  Student,
  StudentStats,
  StudentDetail,
  StudentEnrollment,
  StudentFilter
};

interface UseStudentsOptions extends StudentFilter {
  autoFetch?: boolean;
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
      const params: StudentFilter = {
        page: fetchOptions?.page || page,
        limit: fetchOptions?.limit || limit,
        search: fetchOptions?.search || search,
        grade: fetchOptions?.grade || grade,
        status: fetchOptions?.status || status,
      };

      const result = await StudentsAPI.getStudents(params);

      if (result) {
        setStudents(result.students);
        setStats(result.stats);
        setPagination({
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
          pages: result.pagination.pages,
        });
      } else {
        throw new Error('No data returned');
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
      const result = await StudentsAPI.getStudent(studentId);
      setStudent(result);
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