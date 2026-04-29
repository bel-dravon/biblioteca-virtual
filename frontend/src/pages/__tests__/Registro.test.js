import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Registro from '../Registro';
import { AuthContext } from '../../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Registro', () => {
  const renderRegistro = (authValue) => {
    const defaultAuth = {
      user: null,
      isAuthenticated: false,
      register: jest.fn().mockResolvedValue({ success: true }),
      login: jest.fn(),
      logout: jest.fn(),
      ...authValue,
    };

    return render(
      <AuthContext.Provider value={defaultAuth}>
        <MemoryRouter>
          <Registro />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders registration form', () => {
    renderRegistro();

    expect(screen.getByText('Crear Cuenta Nueva')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de Usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });

  test('form has aria-label', () => {
    renderRegistro();

    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('aria-label', 'Formulario de registro');
  });

  test('validates required fields - password mismatch', async () => {
    const mockRegister = jest.fn();
    renderRegistro({ register: mockRegister });

    // MUI labels with `required` include an asterisk, so use getByRole with name regex
    // The labels are "Contraseña *" and "Confirmar Contraseña *"
    const passwordFields = screen.getAllByLabelText(/Contraseña/i);
    // First match is "Contraseña", second is "Confirmar Contraseña"
    const passwordField = passwordFields.find(el => {
      // Get the label text for this element
      const label = el.closest('.MuiFormControl-root')?.querySelector('label');
      return label && /^Contraseña/.test(label.textContent) && !/Confirmar/.test(label.textContent);
    }) || passwordFields[0];

    const confirmField = passwordFields.find(el => {
      const label = el.closest('.MuiFormControl-root')?.querySelector('label');
      return label && /Confirmar/.test(label.textContent);
    }) || passwordFields[1];

    fireEvent.change(passwordField, { target: { value: 'password1' } });
    fireEvent.change(confirmField, { target: { value: 'differentpassword' } });

    // Submit form
    fireEvent.click(screen.getByText('Registrarse'));

    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });

    // Register should NOT have been called
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
