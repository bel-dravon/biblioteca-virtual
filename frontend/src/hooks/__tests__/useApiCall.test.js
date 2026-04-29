import { renderHook, act } from '@testing-library/react';
import useApiCall from '../useApiCall';

describe('useApiCall', () => {
  test('execute sets loading then returns data on success', async () => {
    const mockData = { id: 1, name: 'test' };
    const apiFunction = jest.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useApiCall());

    expect(result.current.loading).toBe(false);

    let returnedData;
    await act(async () => {
      returnedData = await result.current.execute(apiFunction);
    });

    expect(returnedData).toEqual(mockData);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('execute sets error on failure', async () => {
    const apiFunction = jest.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useApiCall());

    await act(async () => {
      try {
        await result.current.execute(apiFunction);
      } catch (err) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBeNull();
  });

  test('reset clears state to initial values', async () => {
    const mockData = { id: 1 };
    const apiFunction = jest.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useApiCall('initial'));

    await act(async () => {
      await result.current.execute(apiFunction);
    });

    expect(result.current.data).toEqual(mockData);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBe('initial');
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('loading is false after both success and failure', async () => {
    const { result } = renderHook(() => useApiCall());

    // After success
    await act(async () => {
      await result.current.execute(() => Promise.resolve('ok'));
    });
    expect(result.current.loading).toBe(false);

    // After failure
    await act(async () => {
      try {
        await result.current.execute(() => Promise.reject(new Error('fail')));
      } catch (err) {
        // Expected
      }
    });
    expect(result.current.loading).toBe(false);
  });
});
