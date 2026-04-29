import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../HomePage';
import { trabajosService } from '../../api';

jest.mock('../../api', () => ({
  trabajosService: {
    getAll: jest.fn(),
  },
}));

// Mock WorkCard to isolate
jest.mock('../../components/WorkCard', () => {
  return function MockWorkCard({ work, trabajo }) {
    const item = trabajo || work;
    return <div data-testid="work-card">{item?.titulo}</div>;
  };
});

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders page title', () => {
    trabajosService.getAll.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Bienvenido a la Biblioteca Virtual')).toBeInTheDocument();
  });

  test('renders recent works section', async () => {
    trabajosService.getAll.mockResolvedValue([
      { id: 1, titulo: 'Trabajo Reciente', tipo_material: 'tesis', autores: [] },
    ]);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Agregados Recientemente')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Trabajo Reciente')).toBeInTheDocument();
    });
  });
});
