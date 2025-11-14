'use client';

import { useState, useEffect } from 'react';
import { DashboardAPI, DashboardStats } from '@/lib/api/dashboard';

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DashboardAPI.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchDashboardStats();
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch,
  };
};