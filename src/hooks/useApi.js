import { useState, useCallback } from 'react';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    const { onSuccess, onError, showLoading = true } = options;
    
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const result = await apiCall();
      
      if (onSuccess) {
        onSuccess(result.data);
      }
      
      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError
  };
};

export const useApiState = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    const { onSuccess, onError, showLoading = true } = options;
    
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const result = await apiCall();
      setData(result.data);
      
      if (onSuccess) {
        onSuccess(result.data);
      }
      
      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearData = useCallback(() => {
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    clearError,
    clearData
  };
}; 