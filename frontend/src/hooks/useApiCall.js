import { useState, useCallback } from 'react';

/**
 * Hook reutilizable para llamadas a la API.
 * Centraliza el patron loading/error/data que se repite en todas las paginas.
 * 
 * @returns {Object} { data, loading, error, execute, reset }
 */
export default function useApiCall(initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Error inesperado');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return { data, loading, error, execute, reset };
}
