import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Paper, TextField, Button, Typography, Box, 
  Alert, Grid, CssBaseline
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Registro() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '',
    email: '', first_name: '', last_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }

    setLoading(true);
    
    const { confirmPassword, ...dataToSend } = formData;
    
    const result = await register(dataToSend);

    if (result.success) {
      navigate('/login', { state: { message: 'Cuenta creada exitosamente. Inicia sesión.' } });
    } else {
      setError(result.message);
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
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit} noValidate aria-label="Formulario de registro">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Nombre" name="first_name" onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Apellido" name="last_name" onChange={handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField required fullWidth label="Correo Electrónico" name="email" type="email" onChange={handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField required fullWidth label="Nombre de Usuario" name="username" onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Contraseña" name="password" type="password" onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Confirmar Contraseña" name="confirmPassword" type="password" onChange={handleChange} />
              </Grid>
            </Grid>

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={loading}>
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
    </Container>
  );
}