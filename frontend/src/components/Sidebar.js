import React from 'react';
import {
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Drawer, IconButton, useMediaQuery, useTheme, Typography, Divider, Tooltip
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import ExploreIcon from '@mui/icons-material/Explore';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FolderIcon from '@mui/icons-material/Folder';
import CampaignIcon from '@mui/icons-material/Campaign';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoIcon from '@mui/icons-material/Info';
import PeopleIcon from '@mui/icons-material/People';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';

export default function Sidebar({
  mobileOpen, setMobileOpen,
  collapsed, setCollapsed,
  drawerWidth, miniDrawerWidth
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleCollapseToggle = () => setCollapsed(!collapsed);

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (isMobile) setMobileOpen(false);
  };

  const userRol = user?.rol || null;
  const esAdministrador = userRol === ROLES.ADMINISTRADOR;

  // Menú base para todos
  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/' },
    { text: 'Explorar', icon: <ExploreIcon />, path: '/explorar' },
    { text: 'Convocatorias', icon: <CampaignIcon />, path: '/convocatorias' },
    { text: 'Información', icon: <InfoIcon />, path: '/acerca' },
  ];

  // Mi Biblioteca (solo autenticados)
  if (isAuthenticated) {
    menuItems.push({ text: 'Mi Biblioteca', icon: <FolderIcon />, path: '/mi-biblioteca' });
  }

  menuItems.push({ text: 'Inventario Libros', icon: <MenuBookIcon />, path: '/inventario-libros' });

  if (esAdministrador) {
    menuItems.push({ divider: true, label: 'Administración' });
    menuItems.push({ text: 'Gestión Usuarios', icon: <PeopleIcon />, path: '/admin/usuarios' });
    menuItems.push({ text: 'Gestión de Acervo', icon: <UploadFileIcon />, path: '/admin/trabajos' });
    menuItems.push({ text: 'Gestión Convocatorias', icon: <AddCircleIcon />, path: '/admin/convocatorias' });
    menuItems.push({ divider: true, label: 'Catálogos' });
    menuItems.push({ text: 'Gestión Palabras Clave', icon: <LocalOfferIcon />, path: '/admin/palabras-clave' });
  }
  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      {/* Header con logo y botón colapsar */}
      <Box sx={{
        mb: 4, mt: 1, px: 1,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: '40px'
      }}>
        {!collapsed ? (
          <Typography variant="h6" fontWeight="bold" color="primary" noWrap>
            BiblioVirtual
          </Typography>
        ) : (
          <Typography variant="h6" fontWeight="bold" color="primary">
            BV
          </Typography>
        )}

        {isMobile ? (
          <IconButton onClick={handleDrawerToggle} size="small" aria-label="Cerrar menu">
            <CloseIcon />
          </IconButton>
        ) : (
          <IconButton onClick={handleCollapseToggle} size="small" sx={{ color: 'text.secondary' }} aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}>
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      {/* Lista de menú */}
      <nav aria-label="Menu principal">
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item, index) => {
          if (item.divider) {
            return (
              <Box key={`div-${index}`}>
                <Divider sx={{ my: 2 }} />
                {!collapsed && item.label && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ px: 2.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    {item.label}
                  </Typography>
                )}
              </Box>
            );
          }

          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5, display: 'block' }}>
              <Tooltip title={collapsed ? item.text : ""} placement="right">
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={() => isMobile && setMobileOpen(false)}
                  sx={{
                    minHeight: 48,
                    borderRadius: '12px',
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: 2.5,
                    bgcolor: isActive ? 'primary.lighter' : 'transparent',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.lighter' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: 0,
                    mr: collapsed ? 'auto' : 2,
                    justifyContent: 'center',
                    color: isActive ? 'primary.main' : 'inherit',
                  }}>
                    {item.icon}
                  </ListItemIcon>

                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ fontWeight: isActive ? 600 : 500, fontSize: '0.9rem' }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      </nav>

      {/* Info del usuario y logout */}
      <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f0f0f0' }}>
        {/* Mostrar rol del usuario cuando no está colapsado */}
        {!collapsed && isAuthenticated && user?.rol && (
          <Box sx={{ px: 2.5, mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {user.username}
            </Typography>
            <Typography variant="caption" color="primary" fontWeight={600}>
              {user.rol}
            </Typography>
          </Box>
        )}

        <Tooltip title={collapsed ? (isAuthenticated ? "Cerrar Sesión" : "Ingresar") : ""} placement="right">
          <ListItemButton
            onClick={isAuthenticated ? handleLogout : () => navigate('/login')}
            sx={{
              minHeight: 48,
              justifyContent: collapsed ? 'center' : 'initial',
              px: 2.5,
              borderRadius: '12px',
              color: isAuthenticated ? 'error.main' : 'primary.main',
              bgcolor: isAuthenticated ? 'transparent' : 'primary.50',
              '&:hover': { bgcolor: isAuthenticated ? '#FEE2E2' : 'primary.100' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 'auto' : 2, justifyContent: 'center', color: 'inherit' }}>
              {isAuthenticated ? <LogoutIcon /> : <LoginIcon />}
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={isAuthenticated ? "Cerrar Sesión" : "Iniciar Sesión"}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{
      width: { md: collapsed ? miniDrawerWidth : drawerWidth },
      flexShrink: { md: 0 },
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }}>
      {/* Botón flotante para móvil */}
      {isMobile && (
        <IconButton
          color="primary"
          onClick={handleDrawerToggle}
          aria-label="Abrir menu"
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1200,
            bgcolor: 'primary.main',
            color: 'white',
            boxShadow: 4,
            width: 50,
            height: 50,
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Drawer temporal para móvil */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer permanente para desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: collapsed ? miniDrawerWidth : drawerWidth,
            border: 'none',
            bgcolor: 'background.paper',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
