import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GestionConvocatorias from '../GestionConvocatorias';
import { convocatoriasService } from '../../../api';

jest.mock('../../../api', () => ({
  convocatoriasService: {
    getAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const convocatorias = [
  {
    id: 1,
    titulo: 'Beca de investigacion 2026',
    tipo: 'Beca',
    descripcion: 'Convocatoria orientada a proyectos de investigacion para estudiantes destacados.',
    requisitos: 'Ser estudiante regular.',
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-03-15',
    estado: 'activo',
  },
  {
    id: 2,
    titulo: 'Concurso de innovacion',
    tipo: 'Concurso',
    descripcion: 'Convocatoria abierta para propuestas de innovacion academica.',
    requisitos: 'Presentar proyecto.',
    fecha_inicio: '2026-02-10',
    fecha_fin: '2026-04-01',
    estado: 'proximo',
  },
];

const renderPage = () => render(
  <MemoryRouter>
    <GestionConvocatorias />
  </MemoryRouter>
);

describe('GestionConvocatorias', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    convocatoriasService.getAll.mockResolvedValue(convocatorias);
    convocatoriasService.update.mockResolvedValue({});
    convocatoriasService.delete.mockResolvedValue({});
  });

  test('filtra convocatorias con la barra de busqueda', async () => {
    renderPage();

    expect(await screen.findByText('Beca de investigacion 2026')).toBeInTheDocument();
    expect(screen.getByText('Concurso de innovacion')).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText('Buscar por ID, titulo, tipo, estado o fecha de cierre...'),
      { target: { value: 'concurso' } }
    );

    await waitFor(() => {
      expect(screen.queryByText('Beca de investigacion 2026')).not.toBeInTheDocument();
      expect(screen.getByText('Concurso de innovacion')).toBeInTheDocument();
    });
  });

  test('edita una convocatoria existente', async () => {
    renderPage();

    fireEvent.click(await screen.findByLabelText('Editar convocatoria Beca de investigacion 2026'));

    fireEvent.change(await screen.findByLabelText('Titulo'), {
      target: { name: 'titulo', value: 'Beca de investigacion actualizada' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

    await waitFor(() => {
      expect(convocatoriasService.update).toHaveBeenCalledWith(1, expect.objectContaining({
        titulo: 'Beca de investigacion actualizada',
        tipo: 'Beca',
        estado: 'activo',
      }));
    });
  });

  test('elimina una convocatoria desde el dialogo de confirmacion', async () => {
    renderPage();

    fireEvent.click(await screen.findByLabelText('Eliminar convocatoria Concurso de innovacion'));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(convocatoriasService.delete).toHaveBeenCalledWith(2);
    });
  });
});
