import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FilterBar from '../FilterBar';

// Mock themeConfig
jest.mock('../../theme/themeConfig', () => ({
  colors: {
    background: { paper: '#fff', light: '#f5f5f5', default: '#fafafa' },
    text: { primary: '#000', secondary: '#666', tertiary: '#999' },
    primary: { main: '#1976d2', light: '#42a5f5', lighter: '#e3f2fd', dark: '#1565c0' },
    borders: { light: '#e0e0e0' },
    status: { error: '#d32f2f' },
  },
  shadows: { soft: 'none' },
  borderRadius: { sm: '4px', md: '8px', lg: '12px' },
}));

// Mock useDebounce to use real implementation with fake timers
jest.mock('../../hooks', () => {
  const { useState, useEffect } = require('react');
  return {
    useDebounce: (value, delay = 300) => {
      const [debouncedValue, setDebouncedValue] = useState(value);
      useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
      }, [value, delay]);
      return debouncedValue;
    },
  };
});

describe('FilterBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders search input', () => {
    render(<FilterBar onFiltersChange={jest.fn()} />);

    const searchInput = screen.getByPlaceholderText('Buscar por título...');
    expect(searchInput).toBeInTheDocument();
  });

  test('debounces text input', () => {
    const onFiltersChange = jest.fn();
    render(<FilterBar onFiltersChange={onFiltersChange} />);

    const searchInput = screen.getByPlaceholderText('Buscar por título...');

    // Use native input value setter to work with MUI's controlled input
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(searchInput, 'test query');
    fireEvent.input(searchInput, { target: { value: 'test query' } });

    // Record calls before debounce
    const callsBeforeDebounce = onFiltersChange.mock.calls.length;

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // After debounce fires, onFiltersChange should be called with search value
    const callsAfterDebounce = onFiltersChange.mock.calls.length;
    expect(callsAfterDebounce).toBeGreaterThan(callsBeforeDebounce);

    // The last call should include the debounced search value
    const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0];
    expect(lastCall.search).toBe('test query');
  });

  test('select filters apply immediately via button expansion', () => {
    const onFiltersChange = jest.fn();
    render(<FilterBar onFiltersChange={onFiltersChange} />);

    // The desktop type filter uses aria-label "Tipo de material"
    // MUI Select renders a div with role="combobox"
    const typeSelect = screen.getByLabelText('Tipo de material');
    fireEvent.mouseDown(typeSelect.querySelector('[role="combobox"]') || typeSelect);

    // Click on "Tesis" option from the dropdown
    const option = screen.getByText('Tesis');
    fireEvent.click(option);

    // Should be called immediately
    const lastCall = onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0];
    expect(lastCall.type).toBe('tesis');
  });

  test('all inputs have labels or aria-labels', () => {
    render(<FilterBar onFiltersChange={jest.fn()} />);

    // Search input has aria-label on the wrapper, and a placeholder
    expect(screen.getByPlaceholderText('Buscar por título...')).toBeInTheDocument();

    // Desktop selects have aria-labels
    expect(screen.getByLabelText('Tipo de material')).toBeInTheDocument();
    expect(screen.getByLabelText('Año de publicacion')).toBeInTheDocument();
  });
});
