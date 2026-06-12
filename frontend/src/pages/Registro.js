import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Paper, TextField, Button, Typography, Box, 
  Grid, CssBaseline,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { usersService } from '../api/users';

export default function Registro() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '',
    email: '', first_name: '', last_name: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Estado del Modal
  const [modal, setModal] = useState({
    open: false,
    title: '',
    message: '',
    type: 'error', // 'error' | 'warning' | 'success'
    showLoginButton: false
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Limpiar error de ese campo al escribir
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const closeModal = () => {
    setModal({ ...modal, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    // Validación local
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);
    
    const { confirmPassword, ...dataToSend } = formData;
    
    try {
      await usersService.create(dataToSend);
      
      // ÉXITO
      setModal({
        open: true,
        title: '¡Registro exitoso!',
        message: `La cuenta "${formData.username}" fue creada correctamente.`,
        type: 'success',
        showLoginButton: true
      });
      
    } catch (error) {
      console.log('Error del API:', error);
      
      // Si hay errores por campo (email, username, etc.)
      if (error.fieldErrors) {
        setFieldErrors(error.fieldErrors);
      }

      // Email ya registrado
      if (error.isEmailTaken) {
        setModal({
          open: true,
          title: 'Correo ya registrado',
          message: `El correo "${formData.email}" ya está en uso. ¿Deseas iniciar sesión con esa cuenta?`,
          type: 'warning',
          showLoginButton: true
        });
      }
      // Username ya registrado
      else if (error.isUsernameTaken) {
        setModal({
          open: true,
          title: 'Usuario ya existe',
          message: `El nombre de usuario "${formData.username}" ya está registrado. Prueba con otro.`,
          type: 'warning',
          showLoginButton: false
        });
      }
      // Otro error genérico
      else {
        setModal({
          open: true,
          title: 'Error al registrar',
          message: error.message || 'Ocurrió un error inesperado. Intenta de nuevo.',
          type: 'error',
          showLoginButton: false
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" fontWeight="bold" color="primary">
          Crear Cuenta Nueva
        </Typography>
        <Paper sx={{ p: 4, mt: 3, width: '100%', borderRadius: 2 }} elevation={3}>
          
          <Box component="form" onSubmit={handleSubmit} noValidate aria-label="Formulario de registro">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  required fullWidth 
                  label="Nombre" 
                  name="first_name" 
                  onChange={handleChange}
                  error={!!fieldErrors.first_name}
                  helperText={fieldErrors.first_name || ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  required fullWidth 
                  label="Apellido" 
                  name="last_name" 
                  onChange={handleChange}
                  error={!!fieldErrors.last_name}
                  helperText={fieldErrors.last_name || ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  required fullWidth 
                  label="Correo Electrónico" 
                  name="email" 
                  type="email" 
                  onChange={handleChange}
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email || ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  required fullWidth 
                  label="Nombre" 
                  name="username" 
                  onChange={handleChange}
                  error={!!fieldErrors.username}
                  helperText={fieldErrors.username || ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  required fullWidth 
                  label="Contraseña" 
                  name="password" 
                  type="password" 
                  onChange={handleChange}
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password || ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  required fullWidth 
                  label="Confirmar Contraseña" 
                  name="confirmPassword" 
                  type="password" 
                  onChange={handleChange}
                  error={!!fieldErrors.confirmPassword}
                  helperText={fieldErrors.confirmPassword || ''}
                />
              </Grid>
            </Grid>

            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              sx={{ mt: 3, mb: 2, py: 1.5 }} 
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <RouterLink to="/login" style={{ textDecoration: 'none', color: '#1976d2' }}>
                ¿Ya tienes cuenta? Inicia Sesión
              </RouterLink>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* ===== MODAL MUI ===== */}
      <Dialog 
        open={modal.open} 
        onClose={closeModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          color: modal.type === 'success' ? 'success.main' : 
                  modal.type === 'warning' ? 'warning.main' : 'error.main',
          fontWeight: 'bold'
        }}>
          {modal.title}
        </DialogTitle>
        
        <DialogContent>
          <Typography>{modal.message}</Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 0 }}>
          {modal.showLoginButton && (
            <Button 
              onClick={() => navigate('/login')} 
              variant="contained" 
              color="primary"
            >
              Ir a Iniciar Sesión
            </Button>
          )}
          <Button onClick={closeModal} variant="outlined">
            {modal.showLoginButton ? 'Cerrar' : 'Aceptar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}