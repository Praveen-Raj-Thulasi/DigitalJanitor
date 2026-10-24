import { useState, useEffect, useCallback } from 'react';
import { scansApi } from '../services/api';

/**
 * Hook to fetch and manage scan data for the current user.
 */
const useScans = (options = {}) => {
  const { limit = 20, autoFetch = true } = options;
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchScans = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await scansApi.getAll({ page: p, limit });
      setScans(data.data);
      setTotalPages(data.pagination.pages);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load scans');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await scansApi.getStats();
      setStats(data.data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchScans(1);
      fetchStats();
    }
  }, [autoFetch, fetchScans, fetchStats]);

  const deleteScan = async (id) => {
    await scansApi.delete(id);
    setScans((prev) => prev.filter((s) => s._id !== id));
  };

  return {
    scans,
    stats,
    loading,
    error,
    page,
    totalPages,
    fetchScans,
    fetchStats,
    deleteScan,
    nextPage: () => fetchScans(page + 1),
    prevPage: () => fetchScans(page - 1),
  };
};

export default useScans;
