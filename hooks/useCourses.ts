import { useState, useEffect, useCallback } from 'react';
import { coursesAPI, CourseFilter, CourseResponse } from '@/lib/api/courses';

export interface UseCoursesOptions {
  autoFetch?: boolean;
  initialFilters?: CourseFilter;
}

export interface UseCoursesReturn {
  courses: any[];
  loading: boolean;
  error: string | null;
  pagination: CourseResponse['pagination'] | null;
  fetchCourses: (filters?: CourseFilter) => Promise<void>;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasNextPage: boolean;
}

export function useCourses(options: UseCoursesOptions = {}): UseCoursesReturn {
  const { autoFetch = true, initialFilters = {} } = options;

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CourseResponse['pagination'] | null>(null);
  const [currentFilters, setCurrentFilters] = useState<CourseFilter>(initialFilters);

  const fetchCourses = useCallback(async (filters: CourseFilter = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await coursesAPI.getCourses({
        ...currentFilters,
        ...filters,
        page: filters.page || 1,
      });

      if (response.success && response.data) {
        if (filters.page && filters.page > 1) {
          // Append for pagination
          setCourses(prev => [...prev, ...response.data!]);
        } else {
          // Replace for new search
          setCourses(response.data);
        }
        setPagination(response.pagination || null);
        setCurrentFilters(prev => ({ ...prev, ...filters }));
      } else {
        setError(response.error || 'Failed to fetch courses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  const refetch = useCallback(async () => {
    await fetchCourses(currentFilters);
  }, [fetchCourses, currentFilters]);

  const loadMore = useCallback(async () => {
    if (pagination?.hasNext && !loading) {
      await fetchCourses({
        ...currentFilters,
        page: (pagination.page + 1),
      });
    }
  }, [fetchCourses, currentFilters, pagination, loading]);

  const hasNextPage = Boolean(pagination?.hasNext);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchCourses(initialFilters);
    }
  }, [autoFetch, fetchCourses, initialFilters]);

  return {
    courses,
    loading,
    error,
    pagination,
    fetchCourses,
    refetch,
    loadMore,
    hasNextPage,
  };
}

// Hook for a single course
export interface UseCourseReturn {
  course: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCourse(id: string): UseCourseReturn {
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await coursesAPI.getCourseById(id);

      if (response.success && response.data) {
        setCourse(response.data);
      } else {
        setError(response.error || 'Failed to fetch course');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refetch = useCallback(async () => {
    await fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  return {
    course,
    loading,
    error,
    refetch,
  };
}