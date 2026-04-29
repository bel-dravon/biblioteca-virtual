import React, { useState } from 'react';
import {
  Box, Container, Paper, Typography, Avatar, Grid, Chip, Divider, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../context/AuthContext';
import { perfilesService } from '../api';

export default function UserProfile() {
  const { user, refreshUser } = useAuth(); 
  const userRole = user?.rol || 'Estudiante';
  const joinDate = user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : null;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });

  const handleEditProfile = () => {
    setEditForm({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async () => {
    if (!user?.id) return;
    try {
      setEditLoading(true);
      await perfilesService.update(user.id, editForm);
      await refreshUser();
      setEditDialogOpen(false);
      setSnackbar({ open: true, severity: 'success', message: 'Perfil actualizado correctamente' });
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setSnackbar({ open: true, severity: 'error', message: err.message || 'Error al actualizar perfil' });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', py: 4 }}>
      <Container maxWidth="md">
        <Paper sx={{ 
          p: 4, 
          borderRadius: 4, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: 4
        }}>
          
          <Box sx={{ textAlign: 'center', minWidth: 200 }}>
            <Avatar 
              sx={{ 
                width: 120, 
                height: 120, 
                mb: 2, 
                mx: 'auto',
                bgcolor: 'primary.main',
                fontSize: '3rem'
              }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Chip 
              label={userRole} 
              color="primary" 
              sx={{ fontWeight: 'bold', px: 2 }}
            />
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          <Box sx={{ flexGrow: 1, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">Informacion Personal</Typography>
              <Button startIcon={<EditIcon />} size="small" onClick={handleEditProfile}>Editar</Button>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">NOMBRE DE USUARIO</Typography>
                <Typography variant="body1" fontWeight="500">{user?.username}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">CORREO ELECTRONICO</Typography>
                <Typography variant="body1" fontWeight="500">{user?.email || 'No registrado'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">ESTADO</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label="Activo" size="small" color="success" variant="outlined" />
                    {user?.username === 'estudiante_externo' && (
                        <Chip label="Externo" size="small" color="warning" variant="outlined" />
                    )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">FECHA DE REGISTRO</Typography>
                <Typography variant="body1" fontWeight="500">{joinDate || 'No disponible'}</Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>

      {/* Dialog para editar perfil */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Perfil</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Nombre"
            name="first_name"
            value={editForm.first_name}
            onChange={handleEditChange}
            fullWidth
            sx={{ mt: 1 }}
          />
          <TextField
            label="Apellido"
            name="last_name"
            value={editForm.last_name}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            label="Correo electronico"
            name="email"
            type="email"
            value={editForm.email}
            onChange={handleEditChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={editLoading}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={editLoading}>
            {editLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}