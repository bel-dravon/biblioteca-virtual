import React from 'react';
import { render, screen } from '@testing-library/react';
import RoleGuard from '../RoleGuard';
import { AuthContext } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

describe('RoleGuard', () => {
  const renderWithAuth = (authValue, guardProps) => {
    return render(
      <AuthContext.Provider value={authValue}>
        <RoleGuard {...guardProps} />
      </AuthContext.Provider>
    );
  };

  test('renders children for allowed role', () => {
    const authValue = {
      user: { username: 'admin', rol: ROLES.ADMINISTRADOR },
      isAuthenticated: true,
    };

    renderWithAuth(authValue, {
      allowedRoles: [ROLES.ADMINISTRADOR],
      children: <div>Protected Content</div>,
    });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('renders fallback for disallowed role', () => {
    const authValue = {
      user: { username: 'student', rol: 'Usuario' },
      isAuthenticated: true,
    };

    renderWithAuth(authValue, {
      allowedRoles: [ROLES.ADMINISTRADOR],
      children: <div>Protected Content</div>,
      fallback: <div>Access Denied</div>,
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  test('renders fallback when not authenticated', () => {
    const authValue = {
      user: null,
      isAuthenticated: false,
    };

    renderWithAuth(authValue, {
      allowedRoles: [ROLES.ADMINISTRADOR],
      children: <div>Protected Content</div>,
      fallback: <div>Please Login</div>,
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Please Login')).toBeInTheDocument();
  });
});
