import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { palabrasClaveService } from '../../api';

const INITIAL_FORM = {
  termino: '',
};

export default function GestionPalabrasClave() {
  const [palabrasClave, setPalabrasClave] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPalabra, setSelectedPalabra] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});

  const fetchPalabrasClave = useCallback(async () => {
    try {
      setLoading(true);
      const response = await palabrasClaveService.getAll();
      setPalabrasClave(Array.isArray(response) ? response : response.results || []);
    } catch (error) {
      console.error('Error cargando palabras clave:', error);
      setMessage({ type: 'error', text: 'No se pudieron cargar las palabras clave.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPalabrasClave();
  }, [fetchPalabrasClave]);

  const handleOpenDialog = (palabra = null) => {
    setSelectedPalabra(palabra);
    setFormData({
      termino: palabra?.termino || '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPalabra(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
  };

  const handleOpenDeleteDialog = (palabra) => {
    setSelectedPalabra(palabra);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedPalabra(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.termino.trim()) errors.termino = 'El termino es requerido';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        termino: formData.termino.trim(),
      };

      if (selectedPalabra) {
        await palabrasClaveService.update(selectedPalabra.id, payload);
        setMessage({ type: 'success', text: 'Palabra clave actualizada correctamente.' });
      } else {
        await palabrasClaveService.create(payload);
        setMessage({ type: 'success', text: 'Palabra clave creada correctamente.' });
      }

      handleCloseDialog();
      fetchPalabrasClave();
    } catch (error) {
      console.error('Error guardando palabra clave:', error);
      setMessage({ type: 'error', text: error.message || 'No se pudo guardar la palabra clave.' });
    }
  };

  const handleDelete = async () => {
    if (!selectedPalabra) return;

    try {
      await palabrasClaveService.delete(selectedPalabra.id);
      setMessage({ type: 'success', text: 'Palabra clave eliminada correctamente.' });
      handleCloseDeleteDialog();
      fetchPalabrasClave();
    } catch (error) {
      console.error('Error eliminando palabra clave:', error);
      setMessage({ type: 'error', text: error.message || 'No se pudo eliminar la palabra clave.' });
    }
  };

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Gestion de Palabras Clave
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddCircleIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, px: 3, py: 1.5, textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
          >
            Nueva Palabra Clave
          </Button>
        </Box>

        {message && <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 3, borderRadius: 2 }}>{message.text}</Alert>}

        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Termino</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={30} /></TableCell>
                      <TableCell><Skeleton width={160} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                    </TableRow>
                  ))
                ) : palabrasClave.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No hay palabras clave registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  palabrasClave.map((palabra) => (
                    <TableRow key={palabra.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ color: '#64748B' }}>{palabra.id}</TableCell>
                      <TableCell>{palabra.termino}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => handleOpenDialog(palabra)} aria-label={`Editar palabra clave ${palabra.termino}`} sx={{ bgcolor: 'rgba(25, 118, 210, 0.08)', mr: 1, '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.15)' } }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => handleOpenDeleteDialog(palabra)} aria-label={`Eliminar palabra clave ${palabra.termino}`} sx={{ bgcolor: 'rgba(211, 47, 47, 0.08)', '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.15)' } }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ pb: 1 }}>{selectedPalabra ? 'Editar Palabra Clave' : 'Nueva Palabra Clave'}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <TextField fullWidth label="Termino" name="termino" value={formData.termino} onChange={handleChange} error={Boolean(formErrors.termino)} helperText={formErrors.termino} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button variant="contained" onClick={handleSubmit}>{selectedPalabra ? 'Guardar Cambios' : 'Crear Palabra Clave'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle>Confirmar eliminacion</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary">{`¿Deseas eliminar la palabra clave ${selectedPalabra?.termino || ''}?`}</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>Eliminar</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
