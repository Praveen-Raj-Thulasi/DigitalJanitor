import { useState, useEffect, useCallback } from 'react';
import { aiApi } from '../services/api';

/**
 * Hook to manage Ollama AI status and invoke AI features.
 */
const useAI = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const { data } = await aiApi.getStatus();
      setStatus(data.data);
    } catch {
      setStatus({ available: false, modelAvailable: false });
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const analyzeFiles = async (files) => {
    setAnalyzing(true);
    try {
      const { data } = await aiApi.analyzeFiles(files);
      return data.data || [];
    } catch (err) {
      if (err.response?.data?.fallback) {
        return null; // AI offline, caller handles fallback
      }
      throw err;
    } finally {
      setAnalyzing(false);
    }
  };

  const suggestOrganization = async (files) => {
    setAnalyzing(true);
    try {
      const { data } = await aiApi.suggestOrganization(files);
      return data.data || [];
    } catch (err) {
      if (err.response?.data?.fallback) {
        return null;
      }
      throw err;
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    status,
    isAvailable: status?.available && status?.modelAvailable,
    analyzing,
    checkStatus,
    analyzeFiles,
    suggestOrganization,
  };
};

export default useAI;
