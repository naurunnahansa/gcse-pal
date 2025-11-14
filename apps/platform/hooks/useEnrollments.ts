import { useState, useEffect } from 'react';

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

const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://gcse-pal.vercel.app'
  : 'http://localhost:3000';

class EnrollmentsAPI {
  static async getMyEnrollments(): Promise<EnrollmentsData> {
    const response = await fetch(`${API_BASE}/api/enrollments/my/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch enrollments: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch enrollments');
    }

    return data.data;
  }
}

export function useEnrollments() {
  const [data, setData] = useState<EnrollmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const enrollmentsData = await EnrollmentsAPI.getMyEnrollments();
      setData(enrollmentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch enrollments');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const refresh = () => {
    fetchEnrollments();
  };

  return {
    data,
    loading,
    error,
    refresh,
  };
}

export default useEnrollments;