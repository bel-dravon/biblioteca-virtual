import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores.
 * Retrasa la actualizacion del valor hasta que el usuario deje de cambiar por `delay` ms.
 * 
 * @param {*} value - Valor a debounce
 * @param {number} delay - Delay en milisegundos (default 300)
 * @returns {*} Valor debounced
 */
export default function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}
