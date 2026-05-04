import React, { Suspense } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext'; 

import theme from './theme/theme';
import DashboardLayout from './layouts/DashboardLayout';
import RoleRoute from './components/RoleRoute';
import { ADMIN_ONLY_ROLES } from './constants/roles';

// Lazy-loaded pages
const Login = React.lazy(() => import('./pages/Login'));
const Registro = React.lazy(() => import('./pages/Registro'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const Explorar = React.lazy(() => import('./pages/Explorar'));
const MiBiblioteca = React.lazy(() => import('./pages/MiBiblio'));
const Convocatorias = React.lazy(() => import('./pages/Convocatorias'));
const TrabajoDetalle = React.lazy(() => import('./pages/trabajo/TrabajoDetalle'));
const SubirTrabajo = React.lazy(() => import('./pages/SubirTrabajo'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const CrearConvocatoria = React.lazy(() => import('./pages/CrearConvocatoria'));
const About = React.lazy(() => import('./pages/About'));
const LibrosList = React.lazy(() => import('./pages/LibrosList'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const GestionTrabajos = React.lazy(() => import('./pages/admin/GestionTrabajos'));
const GestionConvocatorias = React.lazy(() => import('./pages/admin/GestionConvocatorias'));
const GestionPalabrasClave = React.lazy(() => import('./pages/admin/GestionPalabrasClave'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
    }}>
      <CircularProgress />
    </Box>
  );
}

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const PublicLayoutRoute = ({ children }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

function AppContent() {
  return (
    <ThemeProvider theme={theme}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          <Route path="/" element={<PublicLayoutRoute><HomePage /></PublicLayoutRoute>} />
          <Route path="/explorar" element={<PublicLayoutRoute><Explorar /></PublicLayoutRoute>} />
          <Route path="/inventario-libros" element={<PublicLayoutRoute><LibrosList /></PublicLayoutRoute>} />
          <Route path="/work/:id" element={<PublicLayoutRoute><TrabajoDetalle /></PublicLayoutRoute>} />
          <Route path="/convocatorias" element={<PublicLayoutRoute><Convocatorias /></PublicLayoutRoute>} />
          <Route path="/mi-biblioteca" element={<ProtectedRoute><MiBiblioteca /></ProtectedRoute>} />        
          <Route
            path="/admin/trabajos"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY_ROLES}>
                <GestionTrabajos />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/subir"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY_ROLES}>
                <SubirTrabajo />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/editar-trabajo/:id"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY_ROLES}>
                <SubirTrabajo />
              </RoleRoute>
            }
          />

          <Route path="/perfil" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route
            path="/admin/nueva-convocatoria"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY_ROLES}>
                <CrearConvocatoria />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/convocatorias"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY_ROLES}>
                <GestionConvocatorias />
              </RoleRoute>
            }
          />
          <Route path="/acerca" element={<PublicLayoutRoute><About /></PublicLayoutRoute>} />
          <Route
            path="/admin/usuarios"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY_ROLES}>
                <UserManagement />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/palabras-clave"
            element={
              <RoleRoute allowedRoles={ADMIN_ONLY_ROLES}>
                <GestionPalabrasClave />
              </RoleRoute>
            }
          />
          <Route path="*" element={<PublicLayoutRoute><NotFound /></PublicLayoutRoute>} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
