import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Skeleton,
  Chip,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { usersService, rolesService, perfilesService } from '../../api';
import { ROLES } from '../../constants/roles';

const ROLES_DEFAULT = [
  { id: 1, nombre: ROLES.ADMINISTRADOR },
  { id: 2, nombre: ROLES.ESTUDIANTE },
  { id: 3, nombre: ROLES.USUARIO },
];

const getRolColor = (rolNombre) => {
  const colors = {
    [ROLES.ADMINISTRADOR]: { bg: '#FCE7F3', color: '#BE185D' },
    [ROLES.ESTUDIANTE]: { bg: '#F3E5F5', color: '#7B1FA2' },
    [ROLES.USUARIO]: { bg: '#ECEFF1', color: '#546E7A' },
  };
  return colors[rolNombre] || { bg: '#ECEFF1', color: '#546E7A' };
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(ROLES_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    rol_id: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        usersService.getAll(),
        rolesService.getAll().catch(() => ROLES_DEFAULT),
      ]);

      const usersList = Array.isArray(usersRes) ? usersRes : usersRes.results || [];
      const rolesList = Array.isArray(rolesRes) ? rolesRes : rolesRes.results || ROLES_DEFAULT;

      // Obtener perfiles para asociar roles a usuarios
      let perfilesMap = {};
      try {
        const perfilesRes = await perfilesService.getAll();
        const perfilesList = Array.isArray(perfilesRes) ? perfilesRes : perfilesRes.results || [];
        perfilesList.forEach(p => {
          perfilesMap[p.usuario?.id] = p.rol;
        });
      } catch (err) {
        console.warn('No se pudieron cargar perfiles:', err);
      }

      // Enriquecer usuarios con su rol
      const enrichedUsers = usersList.map(user => ({
        ...user,
        rol: perfilesMap[user.id] || null,
      }));

      setUsers(enrichedUsers);
      setRoles(rolesList.length > 0 ? rolesList : ROLES_DEFAULT);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMessage({ type: 'error', text: 'Error al cargar los usuarios' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (user = null) => {
    setSelectedUser(user);
    setFormErrors({});
    setShowPassword(false);
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        rol_id: user.rol?.id || '',
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        rol_id: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setFormData({ username: '', email: '', password: '', rol_id: '' });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      errors.username = 'Mínimo 3 caracteres';
    }
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    if (!selectedUser && !formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'Mínimo 8 caracteres';
    }
    if (selectedUser && !formData.rol_id) {
      errors.rol_id = 'Selecciona un rol';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (selectedUser) {
        // Actualizar usuario existente
        const updateData = {
          username: formData.username,
        };
        if (formData.email !== (selectedUser.email || '')) {
          updateData.email = formData.email;
        }
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersService.update(selectedUser.id, updateData);

        // Actualizar rol en perfil
        if (formData.rol_id && formData.rol_id !== selectedUser.rol?.id) {
          try {
            await perfilesService.update(selectedUser.id, { rol_id: formData.rol_id });
          } catch (err) {
            console.warn('No se pudo actualizar el rol:', err);
          }
        }
        setMessage({ type: 'success', text: 'Usuario actualizado correctamente' });
      } else {
        // Crear nuevo usuario
        await usersService.create({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        setMessage({ type: 'success', text: 'Usuario creado correctamente' });
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error guardando usuario:', error);
      const errorMsg = error.errors?.username?.[0] ||
                       error.errors?.email?.[0] ||
                       error.message ||
                       'Error al guardar el usuario';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await usersService.delete(selectedUser.id);
      setMessage({ type: 'success', text: 'Usuario eliminado correctamente' });
      handleCloseDeleteDialog();
      fetchData();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      const errorMsg = error.errors?.message || error.message || 'Error al eliminar el usuario';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Gestión de Usuarios
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<PersonAddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            }}
          >
            Nuevo Usuario
          </Button>
        </Box>

        {/* Alertas */}
        {message && (
          <Alert
            severity={message.type}
            onClose={() => setMessage(null)}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {message.text}
          </Alert>
        )}

        {/* Tabla de Usuarios */}
        <Paper
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell component="th" scope="col" sx={{ fontWeight: 700, color: '#475569' }}>ID</TableCell>
                  <TableCell component="th" scope="col" sx={{ fontWeight: 700, color: '#475569' }}>Usuario</TableCell>
                  <TableCell component="th" scope="col" sx={{ fontWeight: 700, color: '#475569' }}>Email</TableCell>
                  <TableCell component="th" scope="col" sx={{ fontWeight: 700, color: '#475569' }}>Rol Actual</TableCell>
                  <TableCell component="th" scope="col" sx={{ fontWeight: 700, color: '#475569' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={30} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={180} /></TableCell>
                      <TableCell><Skeleton width={100} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const rolColor = getRolColor(user.rol?.nombre);
                    return (
                      <TableRow
                        key={user.id}
                        hover
                        sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}
                      >
                        <TableCell sx={{ color: '#64748B' }}>{user.id}</TableCell>
                        <TableCell>
                          <Typography fontWeight={600} color="text.primary">
                            {user.username}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#64748B' }}>{user.email || '-'}</TableCell>
                        <TableCell>
                          {user.rol ? (
                            <Chip
                              label={user.rol.nombre}
                              size="small"
                              sx={{
                                bgcolor: rolColor.bg,
                                color: rolColor.color,
                                fontWeight: 600,
                                borderRadius: 1.5,
                              }}
                            />
                          ) : (
                            <Chip
                              label="Sin rol"
                              size="small"
                              sx={{
                                bgcolor: '#FEE2E2',
                                color: '#DC2626',
                                fontWeight: 500,
                                borderRadius: 1.5,
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDialog(user)}
                              aria-label={`Editar usuario ${user.username}`}
                              sx={{
                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                                mr: 1,
                                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.15)' }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDeleteDialog(user)}
                              aria-label={`Eliminar usuario ${user.username}`}
                              sx={{
                                bgcolor: 'rgba(211, 47, 47, 0.08)',
                                '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.15)' }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Dialog para Crear/Editar Usuario */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          aria-labelledby="user-dialog-title"
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle id="user-dialog-title" sx={{ pb: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <TextField
                fullWidth
                label="Nombre"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={!!formErrors.username}
                helperText={formErrors.username}
                placeholder="ej: juan_perez"
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />
              <TextField
                fullWidth
                label="Correo electrónico"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                placeholder="ej: juan@universidad.edu"
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              />
              <TextField
                fullWidth
                label={selectedUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password || (selectedUser ? 'Dejar vacío para mantener la actual' : 'Mínimo 8 caracteres')}
                InputProps={{
                  sx: { borderRadius: 2 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                fullWidth
                label="Rol"
                name="rol_id"
                value={formData.rol_id}
                onChange={handleChange}
                error={!!formErrors.rol_id}
                helperText={formErrors.rol_id || (selectedUser ? '' : 'Los usuarios nuevos reciben el rol Estudiante automaticamente.')}
                InputProps={{
                  sx: { borderRadius: 2 }
                }}
              >
                <MenuItem value="" disabled>
                  Selecciona un rol
                </MenuItem>
                {roles.map((rol) => (
                  <MenuItem key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={handleCloseDialog}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
              }}
            >
              {selectedUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de Confirmación de Eliminación */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          maxWidth="xs"
          fullWidth
          aria-labelledby="delete-dialog-title"
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle id="delete-dialog-title">
            <Typography variant="h6" fontWeight="bold">
              Confirmar eliminación
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography color="text.secondary">
              ¿Estás seguro de que deseas eliminar al usuario{' '}
              <strong>{selectedUser?.username}</strong>? Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={handleCloseDeleteDialog}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(211,47,47,0.3)',
              }}
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
