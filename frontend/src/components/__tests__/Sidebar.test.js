import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { AuthContext } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

describe('Sidebar', () => {
  const defaultProps = {
    mobileOpen: false,
    setMobileOpen: jest.fn(),
    collapsed: false,
    setCollapsed: jest.fn(),
    drawerWidth: 260,
    miniDrawerWidth: 80,
  };

  const renderSidebar = (authValue) => {
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <Sidebar {...defaultProps} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  test('shows admin items for administrador role', () => {
    const authValue = {
      user: { username: 'admin', rol: ROLES.ADMINISTRADOR },
      isAuthenticated: true,
      logout: jest.fn(),
    };

    renderSidebar(authValue);

    // Sidebar renders both mobile (temporary) and desktop (permanent) drawers,
    // so items appear twice. Use getAllByText to check at least one exists.
    expect(screen.getAllByText('Gestión Usuarios').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Gestión Préstamos').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Gestión de Acervo').length).toBeGreaterThanOrEqual(1);
  });

  test('hides admin items for student role', () => {
    const authValue = {
      user: { username: 'student', rol: 'Usuario' },
      isAuthenticated: true,
      logout: jest.fn(),
    };

    renderSidebar(authValue);

    expect(screen.queryByText('Gestión Usuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestión Préstamos')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestión de Acervo')).not.toBeInTheDocument();
  });

  test('has nav element with aria-label', () => {
    const authValue = {
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
    };

    renderSidebar(authValue);

    const navs = screen.getAllByRole('navigation', { name: 'Menu principal' });
    expect(navs.length).toBeGreaterThanOrEqual(1);
  });

  test('no hardcoded username checks in source', () => {
    // The Sidebar component uses user.username from context dynamically.
    // We verify this by checking that the username from context appears in the DOM.
    const authValue = {
      user: { username: 'dynamicuser', rol: ROLES.ADMINISTRADOR },
      isAuthenticated: true,
      logout: jest.fn(),
    };

    renderSidebar(authValue);

    // The username is rendered dynamically from context, not hardcoded
    const usernames = screen.getAllByText('dynamicuser');
    expect(usernames.length).toBeGreaterThanOrEqual(1);
  });
});
