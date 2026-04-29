import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Paper, TextField, Button, Typography, Box,
  Alert, Avatar, CssBaseline
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/');
    } else {
      setError('Credenciales incorrectas o error de conexión');
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', }} >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Iniciar Sesión
        </Typography>

        <Paper sx={{ p: 4, mt: 3, width: '100%', borderRadius: 2 }} elevation={3}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate aria-label="Formulario de inicio de sesion">
            <TextField margin="normal" required fullWidth label="Nombre de Usuario" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
            <TextField margin="normal" required fullWidth label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={loading} >
              {loading ? 'Entrando...' : 'Ingresar'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <RouterLink to="/registro" style={{ textDecoration: 'none', color: '#1976d2' }}>
                ¿No tienes cuenta? Regístrate
              </RouterLink>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}