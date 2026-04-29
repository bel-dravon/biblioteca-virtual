import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  MenuItem,
  Pagination,
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
import SearchIcon from '@mui/icons-material/Search';
import ImageIcon from '@mui/icons-material/Image';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink } from 'react-router-dom';
import { convocatoriasService } from '../../api';

const ITEMS_PER_PAGE = 8;

const INITIAL_FORM = {
  titulo: '',
  tipo: 'Beca',
  descripcion: '',
  requisitos: '',
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'activo',
};

export default function GestionConvocatorias() {
  const [convocatorias, setConvocatorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [imagenAdjunta, setImagenAdjunta] = useState(null);
  const [documentoAdjunto, setDocumentoAdjunto] = useState(null);

  const fetchConvocatorias = useCallback(async () => {
    try {
      setLoading(true);
      const response = await convocatoriasService.getAll();
      const convocatoriasList = Array.isArray(response) ? response : response.results || [];
      setConvocatorias(convocatoriasList);
    } catch (error) {
      console.error('Error cargando convocatorias:', error);
      setMessage({ type: 'error', text: 'No se pudieron cargar las convocatorias.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConvocatorias();
  }, [fetchConvocatorias]);

  const handleOpenEditDialog = (convocatoria) => {
    setSelectedConvocatoria(convocatoria);
    setFormData({
      titulo: convocatoria.titulo || '',
      tipo: convocatoria.tipo || 'Beca',
      descripcion: convocatoria.descripcion || '',
      requisitos: convocatoria.requisitos || '',
      fecha_inicio: convocatoria.fecha_inicio || '',
      fecha_fin: convocatoria.fecha_fin || '',
      estado: convocatoria.estado || 'activo',
    });
    setImagenAdjunta(null);
    setDocumentoAdjunto(null);
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setSelectedConvocatoria(null);
    setFormData(INITIAL_FORM);
    setImagenAdjunta(null);
    setDocumentoAdjunto(null);
    setFormErrors({});
    setEditDialogOpen(false);
  };

  const handleOpenDeleteDialog = (convocatoria) => {
    setSelectedConvocatoria(convocatoria);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedConvocatoria(null);
    setDeleteDialogOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    const selectedFile = files && files[0] ? files[0] : null;
    if (name === 'imagen_adjunta') setImagenAdjunta(selectedFile);
    if (name === 'documento_adjunto') setDocumentoAdjunto(selectedFile);
  };

  const clearSelectedFile = (fieldName) => {
    if (fieldName === 'imagen_adjunta') setImagenAdjunta(null);
    if (fieldName === 'documento_adjunto') setDocumentoAdjunto(null);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.titulo.trim()) nextErrors.titulo = 'El titulo es obligatorio.';
    if (!formData.descripcion.trim()) nextErrors.descripcion = 'La descripcion es obligatoria.';
    if (!formData.fecha_inicio) nextErrors.fecha_inicio = 'La fecha de inicio es obligatoria.';
    if (!formData.fecha_fin) nextErrors.fecha_fin = 'La fecha de cierre es obligatoria.';
    if (formData.fecha_inicio && formData.fecha_fin && formData.fecha_inicio > formData.fecha_fin) {
      nextErrors.fecha_fin = 'La fecha de cierre debe ser posterior a la fecha de inicio.';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!selectedConvocatoria || !validateForm()) return;

    try {
      setSaving(true);
      const payload = new FormData();
      payload.append('titulo', formData.titulo.trim());
      payload.append('tipo', formData.tipo);
      payload.append('descripcion', formData.descripcion.trim());
      payload.append('requisitos', formData.requisitos.trim());
      payload.append('fecha_inicio', formData.fecha_inicio);
      payload.append('fecha_fin', formData.fecha_fin);
      payload.append('estado', formData.estado);
      if (imagenAdjunta) payload.append('imagen_adjunta', imagenAdjunta);
      if (documentoAdjunto) payload.append('documento_adjunto', documentoAdjunto);

      await convocatoriasService.update(selectedConvocatoria.id, payload);
      setMessage({ type: 'success', text: 'Convocatoria actualizada correctamente.' });
      handleCloseEditDialog();
      fetchConvocatorias();
    } catch (error) {
      console.error('Error actualizando convocatoria:', error);
      setMessage({ type: 'error', text: error.message || 'No se pudo actualizar la convocatoria.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedConvocatoria) return;

    try {
      setDeleting(true);
      await convocatoriasService.delete(selectedConvocatoria.id);
      setMessage({ type: 'success', text: 'Convocatoria eliminada correctamente.' });
      handleCloseDeleteDialog();
      fetchConvocatorias();
    } catch (error) {
      console.error('Error eliminando convocatoria:', error);
      setMessage({ type: 'error', text: error.message || 'No se pudo eliminar la convocatoria.' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredConvocatorias = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return convocatorias;

    return convocatorias.filter((convocatoria) => [
      String(convocatoria.id || ''),
      convocatoria.titulo || '',
      convocatoria.tipo || '',
      convocatoria.estado || '',
      convocatoria.fecha_fin || '',
    ].some((value) => value.toLowerCase().includes(normalizedSearch)));
  }, [convocatorias, search]);

  const totalPages = Math.max(1, Math.ceil(filteredConvocatorias.length / ITEMS_PER_PAGE));

  const paginatedConvocatorias = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredConvocatorias.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredConvocatorias, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Gestion Convocatorias
          </Typography>
          <Button
            component={RouterLink}
            to="/admin/nueva-convocatoria"
            variant="contained"
            size="large"
            startIcon={<AddCircleIcon />}
            sx={{ borderRadius: 2, px: 3, py: 1.5, textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
          >
            Crear Convocatoria
          </Button>
        </Box>

        {message && (
          <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 3, borderRadius: 2 }}>
            {message.text}
          </Alert>
        )}

        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <TextField
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por ID, titulo, tipo, estado o fecha de cierre..."
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
        </Paper>

        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Titulo</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Fecha Cierre</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton width={30} /></TableCell>
                      <TableCell><Skeleton width={220} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={100} /></TableCell>
                      <TableCell><Skeleton width={100} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                    </TableRow>
                  ))
                ) : filteredConvocatorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No se encontraron convocatorias con ese criterio
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedConvocatorias.map((convocatoria) => (
                    <TableRow key={convocatoria.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ color: '#64748B' }}>{convocatoria.id}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600} color="text.primary">
                          {convocatoria.titulo}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#64748B' }}>{convocatoria.tipo}</TableCell>
                      <TableCell sx={{ color: '#64748B', textTransform: 'capitalize' }}>{convocatoria.estado}</TableCell>
                      <TableCell sx={{ color: '#64748B' }}>{convocatoria.fecha_fin || '-'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenEditDialog(convocatoria)}
                            aria-label={`Editar convocatoria ${convocatoria.titulo}`}
                            sx={{ bgcolor: 'rgba(25, 118, 210, 0.08)', mr: 1, '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.15)' } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            color="error"
                            onClick={() => handleOpenDeleteDialog(convocatoria)}
                            aria-label={`Eliminar convocatoria ${convocatoria.titulo}`}
                            sx={{ bgcolor: 'rgba(211, 47, 47, 0.08)', '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.15)' } }}
                          >
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

        {!loading && filteredConvocatorias.length > ITEMS_PER_PAGE && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color="primary" />
          </Box>
        )}

        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 700 }}>Editar Convocatoria</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <TextField label="Titulo" name="titulo" value={formData.titulo} onChange={handleChange} error={Boolean(formErrors.titulo)} helperText={formErrors.titulo} fullWidth />
              <TextField select label="Tipo" name="tipo" value={formData.tipo} onChange={handleChange} fullWidth>
                <MenuItem value="Beca">Beca</MenuItem>
                <MenuItem value="Evento">Evento</MenuItem>
                <MenuItem value="Concurso">Concurso</MenuItem>
                <MenuItem value="Convocatoria">Convocatoria</MenuItem>
              </TextField>
              <TextField select label="Estado" name="estado" value={formData.estado} onChange={handleChange} fullWidth>
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="proximo">Proximo</MenuItem>
                <MenuItem value="cerrado">Cerrado</MenuItem>
              </TextField>
              <TextField label="Fecha de Inicio" name="fecha_inicio" type="date" value={formData.fecha_inicio} onChange={handleChange} error={Boolean(formErrors.fecha_inicio)} helperText={formErrors.fecha_inicio} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Fecha de Cierre" name="fecha_fin" type="date" value={formData.fecha_fin} onChange={handleChange} error={Boolean(formErrors.fecha_fin)} helperText={formErrors.fecha_fin} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} error={Boolean(formErrors.descripcion)} helperText={formErrors.descripcion} multiline minRows={3} fullWidth />
              <TextField label="Requisitos" name="requisitos" value={formData.requisitos} onChange={handleChange} multiline minRows={3} fullWidth />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
                    <input id="editar-imagen-convocatoria" name="imagen_adjunta" type="file" accept="image/*" hidden onChange={handleFileChange} />
                    <label htmlFor="editar-imagen-convocatoria" style={{ flex: 1 }}>
                      <Button component="span" fullWidth variant="outlined" startIcon={<ImageIcon />} sx={{ py: 1.4 }}>
                        {imagenAdjunta ? `Imagen: ${imagenAdjunta.name}` : 'Actualizar Imagen'}
                      </Button>
                    </label>
                    {imagenAdjunta && (
                      <Button variant="text" color="inherit" startIcon={<CloseIcon />} onClick={() => clearSelectedFile('imagen_adjunta')} sx={{ minWidth: 'auto', px: 1.5 }}>
                        Quitar
                      </Button>
                    )}
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
                    <input id="editar-documento-convocatoria" name="documento_adjunto" type="file" hidden onChange={handleFileChange} />
                    <label htmlFor="editar-documento-convocatoria" style={{ flex: 1 }}>
                      <Button component="span" fullWidth variant="outlined" startIcon={<AttachFileIcon />} sx={{ py: 1.4 }}>
                        {documentoAdjunto ? `Documento: ${documentoAdjunto.name}` : 'Actualizar Documento'}
                      </Button>
                    </label>
                    {documentoAdjunto && (
                      <Button variant="text" color="inherit" startIcon={<CloseIcon />} onClick={() => clearSelectedFile('documento_adjunto')} sx={{ minWidth: 'auto', px: 1.5 }}>
                        Quitar
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseEditDialog} color="inherit">Cancelar</Button>
            <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontSize: '1.25rem', fontWeight: 700 }}>Eliminar Convocatoria</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary">
              {selectedConvocatoria ? `¿Seguro que deseas eliminar "${selectedConvocatoria.titulo}"?` : '¿Seguro que deseas eliminar esta convocatoria?'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDeleteDialog} color="inherit">Cancelar</Button>
            <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>{deleting ? 'Eliminando...' : 'Eliminar'}</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
