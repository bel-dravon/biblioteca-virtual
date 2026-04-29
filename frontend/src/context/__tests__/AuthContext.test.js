import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import apiClient from '../../api/config';

// Mock apiClient
jest.mock('../../api/config', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
  API_URL: 'http://localhost:8000',
}));

// Helper component to access auth context
function TestConsumer() {
  const { user, token, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="token">{token || 'null'}</span>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <button data-testid="login-btn" onClick={() => login('testuser', 'testpass')}>Login</button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('login stores token as authToken in localStorage', async () => {
    apiClient.post.mockResolvedValue({ token: 'abc123' });
    apiClient.get.mockResolvedValue({ results: [{ usuario: { username: 'testuser', id: 1 }, rol: { nombre: 'Usuario' } }] });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    expect(localStorage.getItem('authToken')).toBe('abc123');
  });

  test('logout removes authToken from localStorage', async () => {
    // Pre-set localStorage
    localStorage.setItem('authToken', 'existingtoken');
    localStorage.setItem('userData', JSON.stringify({ username: 'user' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('logout-btn').click();
    });

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
  });

  test('provides user data to children', async () => {
    apiClient.post.mockResolvedValue({ token: 'abc123' });
    apiClient.get.mockResolvedValue({
      results: [{
        usuario: { username: 'testuser', id: 1, email: 'test@test.com' },
        rol: { nombre: 'Director', id: 1 }
      }]
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    await waitFor(() => {
      const userData = JSON.parse(screen.getByTestId('user').textContent);
      expect(userData.username).toBe('testuser');
      expect(userData.rol).toBe('Director');
    });
  });

  test('initializes from stored token', () => {
    localStorage.setItem('authToken', 'stored-token');
    localStorage.setItem('userData', JSON.stringify({ username: 'stored-user', rol: 'Usuario' }));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('token').textContent).toBe('stored-token');

    const userData = JSON.parse(screen.getByTestId('user').textContent);
    expect(userData.username).toBe('stored-user');
  });
});
