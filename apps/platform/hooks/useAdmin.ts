import { useState, useEffect } from 'react';
import { AdminAPI, AdminStats } from '../lib/api/admin';

export function useAdmin() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const adminData = await AdminAPI.getStats();
      setData(adminData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const refresh = () => {
    fetchAdminData();
  };

  return {
    data,
    loading,
    error,
    refresh,
  };
}

export default useAdmin;