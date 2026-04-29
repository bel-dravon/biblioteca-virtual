import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Explorar from '../Explorar';
import { trabajosService } from '../../api';

// Mock themeConfig
jest.mock('../../theme/themeConfig', () => ({
  colors: {
    background: { paper: '#fff', light: '#f5f5f5', default: '#fafafa' },
    text: { primary: '#000', secondary: '#666', tertiary: '#999' },
    primary: { main: '#1976d2', light: '#42a5f5', lighter: '#e3f2fd', dark: '#1565c0' },
    borders: { light: '#e0e0e0' },
    status: { error: '#d32f2f', success: '#2e7d32' },
  },
  shadows: { soft: 'none', softHover: 'none' },
  borderRadius: { sm: '4px', md: '8px', lg: '12px' },
}));

jest.mock('../../api', () => ({
  trabajosService: {
    getAll: jest.fn(),
  },
}));

// Mock FilterBar and WorkCard to isolate the page test
jest.mock('../../components/FilterBar', () => {
  return function MockFilterBar({ onFiltersChange }) {
    return <div data-testid="filter-bar">Filter Bar</div>;
  };
});

jest.mock('../../components/WorkCard', () => {
  return function MockWorkCard({ trabajo }) {
    return <div data-testid="work-card">{trabajo.titulo}</div>;
  };
});

describe('Explorar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders page with search/filter section', async () => {
    trabajosService.getAll.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Explorar />
      </MemoryRouter>
    );

    expect(screen.getByText('Explorar Catálogo')).toBeInTheDocument();
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });

  test('results region has proper aria', async () => {
    trabajosService.getAll.mockResolvedValue([
      { id: 1, titulo: 'Trabajo 1', tipo_material: 'tesis', autores: [] },
    ]);

    render(
      <MemoryRouter>
        <Explorar />
      </MemoryRouter>
    );

    await waitFor(() => {
      const resultsRegion = screen.getByRole('region', { name: 'Resultados de busqueda' });
      expect(resultsRegion).toBeInTheDocument();
    });
  });
});
