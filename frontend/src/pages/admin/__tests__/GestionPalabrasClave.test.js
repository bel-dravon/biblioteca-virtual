import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GestionPalabrasClave from '../GestionPalabrasClave';
import { palabrasClaveService } from '../../../api';

jest.mock('../../../api', () => ({
  palabrasClaveService: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const palabrasClave = [
  { id: 1, termino: 'biblioteca' },
  { id: 2, termino: 'archivo' },
];

describe('GestionPalabrasClave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    palabrasClaveService.getAll.mockResolvedValue(palabrasClave);
    palabrasClaveService.create.mockResolvedValue({});
    palabrasClaveService.update.mockResolvedValue({});
    palabrasClaveService.delete.mockResolvedValue({});
  });

  test('muestra la tabla de palabras clave cargadas', async () => {
    render(<GestionPalabrasClave />);

    expect(await screen.findByText('biblioteca')).toBeInTheDocument();
    expect(screen.getByText('archivo')).toBeInTheDocument();
  });

  test('crea una nueva palabra clave desde el modal', async () => {
    render(<GestionPalabrasClave />);

    fireEvent.click(await screen.findByRole('button', { name: 'Nueva Palabra Clave' }));
    fireEvent.change(screen.getByLabelText('Termino'), { target: { name: 'termino', value: 'repositorio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear Palabra Clave' }));

    await waitFor(() => {
      expect(palabrasClaveService.create).toHaveBeenCalledWith({ termino: 'repositorio' });
    });
  });

  test('edita una palabra clave existente', async () => {
    render(<GestionPalabrasClave />);

    fireEvent.click(await screen.findByLabelText('Editar palabra clave biblioteca'));
    fireEvent.change(screen.getByLabelText('Termino'), { target: { name: 'termino', value: 'repositorio institucional' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Cambios' }));

    await waitFor(() => {
      expect(palabrasClaveService.update).toHaveBeenCalledWith(1, { termino: 'repositorio institucional' });
    });
  });

  test('elimina una palabra clave existente', async () => {
    render(<GestionPalabrasClave />);

    fireEvent.click(await screen.findByLabelText('Eliminar palabra clave archivo'));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(palabrasClaveService.delete).toHaveBeenCalledWith(2);
    });
  });
});
