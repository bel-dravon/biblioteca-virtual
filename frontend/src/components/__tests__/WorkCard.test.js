import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorkCard from '../WorkCard';

// Mock themeConfig to avoid import errors
jest.mock('../../theme/themeConfig', () => ({
  colors: {
    background: { paper: '#fff', light: '#f5f5f5' },
    text: { primary: '#000', secondary: '#666', tertiary: '#999' },
    primary: { main: '#1976d2', light: '#42a5f5', lighter: '#e3f2fd', dark: '#1565c0' },
    borders: { light: '#e0e0e0' },
    status: {},
  },
  shadows: { soft: 'none', softHover: 'none' },
  borderRadius: { sm: '4px', md: '8px', lg: '12px' },
}));

const mockTrabajo = {
  id: 1,
  titulo: 'Inteligencia Artificial en la Educacion',
  tipo_material: 'tesis',
  autores: [{ nombre: 'Carlos', apellido: 'Gomez' }],
  anio_publicacion: 2024,
  signatura_topografica: '005.1 G63i',
  thumbnail: null,
  archivo_ruta: '/media/trabajos/ia-educacion.pdf',
};

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('WorkCard', () => {
  test('renders card variant by default', () => {
    renderWithRouter(<WorkCard trabajo={mockTrabajo} />);

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
    expect(screen.getByText('Ver Detalles')).toBeInTheDocument();
  });

  test('renders list variant when variant="list"', () => {
    renderWithRouter(<WorkCard trabajo={mockTrabajo} variant="list" />);

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
    expect(screen.getByText('Ver Detalles')).toBeInTheDocument();
  });

  test('displays trabajo title and authors', () => {
    renderWithRouter(<WorkCard trabajo={mockTrabajo} />);

    expect(screen.getByText('Inteligencia Artificial en la Educacion')).toBeInTheDocument();
    expect(screen.getByText('Carlos Gomez')).toBeInTheDocument();
    expect(screen.getByText('2024 - 005.1 G63i')).toBeInTheDocument();
  });

  test('has accessible aria attributes', () => {
    renderWithRouter(<WorkCard trabajo={mockTrabajo} />);

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label', 'Inteligencia Artificial en la Educacion - Tesis');

    const detailLink = screen.getByRole('link', { name: 'Ver Detalles' });
    expect(detailLink).toBeInTheDocument();
    expect(detailLink).toHaveAttribute('href', '/work/1');
  });

  test('returns null when no trabajo or work prop', () => {
    const { container } = renderWithRouter(<WorkCard />);
    expect(container.firstChild).toBeNull();
  });
});
