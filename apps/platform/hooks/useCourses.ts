'use client';

import { useState, useEffect, useCallback } from 'react';
import { CoursesAPI, Course, CourseFilter, CourseListResponse } from '@/lib/api/courses';

interface UseCoursesOptions {
  autoFetch?: boolean;
  initialFilters?: CourseFilter;
}

export const useCourses = (options: UseCoursesOptions = {}) => {
  const { autoFetch = true, initialFilters = {} } = options;

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchCourses = useCallback(async (filters: CourseFilter = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response: CourseListResponse = await CoursesAPI.getCourses(filters);
      setCourses(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = () => {
    if (pagination.hasNext) {
      fetchCourses({
        ...initialFilters,
        page: pagination.page + 1,
      });
    }
  };

  const refresh = () => {
    fetchCourses(initialFilters);
  };

  useEffect(() => {
    if (autoFetch) {
      fetchCourses(initialFilters);
    }
  }, [autoFetch]);

  return {
    courses,
    loading,
    error,
    pagination,
    fetchCourses,
    loadMore,
    refresh,
  };
};