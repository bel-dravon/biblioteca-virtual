import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthContext } from '../../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login', () => {
  const renderLogin = (authValue) => {
    const defaultAuth = {
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      ...authValue,
    };

    return render(
      <AuthContext.Provider value={defaultAuth}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders login form with username and password fields', () => {
    renderLogin();

    expect(screen.getByLabelText(/Nombre de Usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByText('Ingresar')).toBeInTheDocument();
  });

  test('form has aria-label', () => {
    renderLogin();

    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('aria-label', 'Formulario de inicio de sesion');
  });

  test('shows error on failed login', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: false });

    renderLogin({ login: mockLogin });

    fireEvent.change(screen.getByLabelText(/Nombre de Usuario/i), {
      target: { value: 'baduser' },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: 'badpass' },
    });

    fireEvent.click(screen.getByText('Ingresar'));

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas o error de conexión')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
