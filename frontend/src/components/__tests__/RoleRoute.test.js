import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoleRoute from '../RoleRoute';
import { AuthContext } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

// Mock DashboardLayout to avoid rendering full layout with Sidebar/Header/Footer
jest.mock('../../layouts/DashboardLayout', () => {
  return function MockDashboardLayout({ children }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

describe('RoleRoute', () => {
  const renderWithAuth = (authValue, routeProps) => {
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <RoleRoute {...routeProps} />
        </MemoryRouter>
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
      children: <div>Admin Panel</div>,
    });

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  test('redirects for disallowed role', () => {
    const authValue = {
      user: { username: 'student', rol: 'Usuario' },
      isAuthenticated: true,
    };

    renderWithAuth(authValue, {
      allowedRoles: [ROLES.ADMINISTRADOR],
      children: <div>Admin Panel</div>,
    });

    // Should not render children since role is not allowed (Navigate to "/")
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    const authValue = {
      user: null,
      isAuthenticated: false,
    };

    renderWithAuth(authValue, {
      allowedRoles: [ROLES.ADMINISTRADOR],
      children: <div>Admin Panel</div>,
    });

    // Should not render children (Navigate to "/login")
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });
});
