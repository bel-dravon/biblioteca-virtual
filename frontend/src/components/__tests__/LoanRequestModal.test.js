import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoanRequestModal from '../LoanRequestModal';
import { solicitudesService } from '../../api';

// Mock themeConfig
jest.mock('../../theme/themeConfig', () => ({
  colors: {
    background: { paper: '#fff', light: '#f5f5f5' },
    text: { primary: '#000', secondary: '#666', tertiary: '#999' },
    primary: { main: '#1976d2', light: '#42a5f5', lighter: '#e3f2fd', dark: '#1565c0' },
    borders: { light: '#e0e0e0' },
    status: { success: '#2e7d32', error: '#d32f2f' },
  },
  shadows: { soft: 'none', softHover: 'none' },
  borderRadius: { sm: '4px', md: '8px', lg: '12px' },
}));

jest.mock('../../api', () => ({
  solicitudesService: {
    create: jest.fn(),
  },
}));

const mockBook = {
  id: 1,
  titulo: 'Test Book Title',
  autores: [{ nombre: 'Juan', apellido: 'Perez' }],
};

describe('LoanRequestModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dialog when open', () => {
    render(
      <LoanRequestModal
        open={true}
        onClose={jest.fn()}
        book={mockBook}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.getByText('Solicitar Préstamo')).toBeInTheDocument();
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
  });

  test('calls API on submit', async () => {
    solicitudesService.create.mockResolvedValue({ id: 1 });

    render(
      <LoanRequestModal
        open={true}
        onClose={jest.fn()}
        book={mockBook}
        onSubmit={jest.fn()}
      />
    );

    // Step 0: click Siguiente to go to confirmation
    const nextButton = screen.getByText('Siguiente');
    fireEvent.click(nextButton);

    // Step 1: click "Enviar Solicitud" to submit
    const submitButton = screen.getByText('Enviar Solicitud');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(solicitudesService.create).toHaveBeenCalledWith({
        trabajo: 1,
        tipo_solicitud: 'fisico',
        duracion_dias: 15,
        proposito: undefined,
      });
    });
  });

  test('shows error on API failure', async () => {
    solicitudesService.create.mockRejectedValue(new Error('Server error'));

    render(
      <LoanRequestModal
        open={true}
        onClose={jest.fn()}
        book={mockBook}
        onSubmit={jest.fn()}
      />
    );

    // Step 0 -> Step 1
    fireEvent.click(screen.getByText('Siguiente'));

    // Step 1 -> Submit (this triggers the API call and fails)
    fireEvent.click(screen.getByText('Enviar Solicitud'));

    // On failure, activeStep is set to steps.length (3), which shows the "Cerrar" button
    // The component moves past the result step content to the close state
    await waitFor(() => {
      expect(solicitudesService.create).toHaveBeenCalled();
      // After failure, "Cerrar" button appears (activeStep >= steps.length - 1)
      expect(screen.getByText('Cerrar')).toBeInTheDocument();
    });
  });

  test('has aria-labelledby on dialog', () => {
    render(
      <LoanRequestModal
        open={true}
        onClose={jest.fn()}
        book={mockBook}
        onSubmit={jest.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'loan-modal-title');
  });
});
