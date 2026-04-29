import React, { useState } from 'react';
import { AppBar, Toolbar, Box, Typography, IconButton, Button, Menu, MenuItem, ListItemIcon, ListItemText, Divider, useMediaQuery, useTheme, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

export default function Header() {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const { user, logout, isAuthenticated } = useAuth();

  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  const handleProfileMenuOpen = (event) => setProfileMenuAnchor(event.currentTarget);
  const handleProfileMenuClose = () => setProfileMenuAnchor(null);

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.default', borderBottom: '1px solid #E2E8F0', color: 'text.primary' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        
        <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit', flexShrink: 0 }} aria-label="Ir al inicio" />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>

          {isAuthenticated ? (
            <>
              <IconButton onClick={handleProfileMenuOpen} color="inherit" aria-label="Menu de usuario">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{ sx: { width: 220, mt: 1 } }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {user?.username || 'Usuario'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email || 'Usuario registrado'}
                  </Typography>
                </Box>
                <Divider />
                {/* Perfil de usuario - redirige a la pagina de perfil */}
                <MenuItem component={Link} to="/perfil" onClick={handleProfileMenuClose}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Mi Perfil</ListItemText>
                </MenuItem>

                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText sx={{ color: 'error.main' }}>Cerrar sesión</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              {isTablet ? (
                <IconButton color="inherit" onClick={handleProfileMenuOpen} aria-label="Menu de cuenta">
                  <PersonIcon />
                </IconButton>
              ) : (
                <>
                  <Button 
                    component={Link} 
                    to="/login" 
                    variant="text" 
                    color="inherit" 
                    startIcon={<LoginIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    Ingresar
                  </Button>
                  <Button 
                    component={Link} 
                    to="/registro" 
                    variant="contained" 
                    color="primary" 
                    sx={{ textTransform: 'none' }}
                  >
                    Registrarse
                  </Button>
                </>
              )}

              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor) && !isAuthenticated}
                onClose={handleProfileMenuClose}
                PaperProps={{ sx: { width: 200, mt: 1 } }}
              >
                <MenuItem component={Link} to="/login" onClick={handleProfileMenuClose}>
                  <ListItemIcon><LoginIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Iniciar sesión</ListItemText>
                </MenuItem>
                <MenuItem component={Link} to="/registro" onClick={handleProfileMenuClose}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Registrarse</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}