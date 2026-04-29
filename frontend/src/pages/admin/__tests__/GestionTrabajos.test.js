import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GestionTrabajos from '../GestionTrabajos';
import { palabrasClaveService, trabajosService } from '../../../api';

jest.mock('../../../api', () => ({
  trabajosService: {
    getAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  palabrasClaveService: {
    getAll: jest.fn(),
  },
}));

const palabrasClave = [
  { id: 1, termino: 'Bibliotecas' },
  { id: 2, termino: 'Catalogacion' },
];

const trabajos = [
  {
    id: 1,
    titulo: 'Gestion documental universitaria',
    resumen: 'Resumen suficientemente largo para validar la edicion del trabajo en la interfaz.',
    tipo_material: 'tesis',
    anio_publicacion: 2024,
    signatura_topografica: '001 A1',
    fuente_fisica: 'Estante A',
    autores_texto: 'Ana Lopez',
    palabras_clave: [palabrasClave[0]],
    asesor_texto: 'Luis Perez',
  },
  {
    id: 2,
    titulo: 'Archivo historico digital',
    resumen: 'Otro resumen suficientemente largo para mostrar una segunda fila dentro de la tabla.',
    tipo_material: 'monografia',
    anio_publicacion: 2023,
    signatura_topografica: '002 B2',
    fuente_fisica: 'Estante B',
    autores_texto: 'Luis Perez',
    palabras_clave: [palabrasClave[1]],
    asesor_texto: '',
  },
];

const renderPage = () => render(
  <MemoryRouter>
    <GestionTrabajos />
  </MemoryRouter>
);

describe('GestionTrabajos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    trabajosService.getAll.mockResolvedValue(trabajos);
    trabajosService.update.mockResolvedValue({});
    trabajosService.delete.mockResolvedValue({});
    palabrasClaveService.getAll.mockResolvedValue(palabrasClave);
  });

  test('filtra trabajos desde la barra de busqueda', async () => {
    renderPage();

    expect(await screen.findByText('Gestion documental universitaria')).toBeInTheDocument();
    expect(screen.getByText('Archivo historico digital')).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText('Buscar por ID, titulo, tipo, anio, signatura o autor...'),
      { target: { value: 'historico' } }
    );

    await waitFor(() => {
      expect(screen.queryByText('Gestion documental universitaria')).not.toBeInTheDocument();
      expect(screen.getByText('Archivo historico digital')).toBeInTheDocument();
    });
  });

  test('redirige a la pagina de edicion del trabajo', async () => {
    renderPage();

    const editButton = await screen.findByLabelText('Editar trabajo Gestion documental universitaria');
    expect(editButton.closest('a')).toHaveAttribute('href', '/admin/editar-trabajo/1');
  });

  test('elimina un trabajo desde el dialogo de confirmacion', async () => {
    renderPage();

    const deleteButton = await screen.findByLabelText('Eliminar trabajo Archivo historico digital');
    fireEvent.click(deleteButton);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(trabajosService.delete).toHaveBeenCalledWith(2);
    });
  });
});
