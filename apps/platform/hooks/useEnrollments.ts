import { useState, useEffect } from 'react';
import { EnrollmentsAPI, EnrollmentsData, Enrollment, CourseData } from '../lib/api/enrollments';

// Re-export interfaces for backward compatibility
export type { CourseData, Enrollment, EnrollmentsData };

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