import { useState, useEffect } from 'react';
import { ProgressAPI, ProgressData } from '../lib/api/progress';

export function useProgress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      const progressData = await ProgressAPI.getProgressData();
      setData(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const refresh = () => {
    fetchProgressData();
  };

  return {
    data,
    loading,
    error,
    refresh,
  };
}

export default useProgress;