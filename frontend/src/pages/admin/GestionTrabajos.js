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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Link as RouterLink } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import { trabajosService } from '../../api';

const ITEMS_PER_PAGE = 8;

export default function GestionTrabajos() {
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedTrabajo, setSelectedTrabajo] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchTrabajos = useCallback(async () => {
    try {
      setLoading(true);
      const trabajosResponse = await trabajosService.getAll();
      const trabajosList = Array.isArray(trabajosResponse) ? trabajosResponse : trabajosResponse.results || [];
      setTrabajos(trabajosList);
    } catch (error) {
      console.error('Error cargando trabajos:', error);
      setMessage({ type: 'error', text: 'No se pudieron cargar los trabajos.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrabajos();
  }, [fetchTrabajos]);

  const handleOpenDeleteDialog = (trabajo) => {
    setSelectedTrabajo(trabajo);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedTrabajo(null);
    setDeleteDialogOpen(false);
  };


  const handleDelete = async () => {
    if (!selectedTrabajo) return;

    try {
      setDeleting(true);
      await trabajosService.delete(selectedTrabajo.id);
      setMessage({ type: 'success', text: 'Trabajo eliminado correctamente.' });
      handleCloseDeleteDialog();
      fetchTrabajos();
    } catch (error) {
      console.error('Error eliminando trabajo:', error);
      const errorMsg = error.message || 'No se pudo eliminar el trabajo.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setDeleting(false);
    }
  };

  const filteredTrabajos = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return trabajos;

    return trabajos.filter((trabajo) => {
      const authorNames = trabajo.autores_texto || '';

      return [
        String(trabajo.id || ''),
        trabajo.titulo || '',
        trabajo.tipo_material || '',
        String(trabajo.anio_publicacion || ''),
        trabajo.signatura_topografica || '',
        authorNames,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [search, trabajos]);

  const totalPages = Math.max(1, Math.ceil(filteredTrabajos.length / ITEMS_PER_PAGE));

  const paginatedTrabajos = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredTrabajos.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTrabajos, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Gestion de Acervo
          </Typography>
          <Button
            component={RouterLink}
            to="/admin/subir"
            variant="contained"
            size="large"
            startIcon={<UploadFileIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            }}
          >
            Subir Nuevo Trabajo
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
            placeholder="Buscar por ID, titulo, tipo, anio, signatura o autor..."
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Paper>

        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Titulo</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Tipo de Material</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Año de Publicacion</TableCell>
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
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                    </TableRow>
                  ))
                ) : filteredTrabajos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No se encontraron trabajos con ese criterio
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTrabajos.map((trabajo) => (
                    <TableRow key={trabajo.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ color: '#64748B' }}>{trabajo.id}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600} color="text.primary">
                          {trabajo.titulo}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#64748B', textTransform: 'capitalize' }}>
                        {trabajo.tipo_material}
                      </TableCell>
                      <TableCell sx={{ color: '#64748B' }}>{trabajo.anio_publicacion || '-'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            component={RouterLink}
                            to={`/admin/editar-trabajo/${trabajo.id}`}
                            color="primary"
                            aria-label={`Editar trabajo ${trabajo.titulo}`}
                            sx={{ bgcolor: 'rgba(25, 118, 210, 0.08)', mr: 1, '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.15)' } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            color="error"
                            onClick={() => handleOpenDeleteDialog(trabajo)}
                            aria-label={`Eliminar trabajo ${trabajo.titulo}`}
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

        {!loading && filteredTrabajos.length > ITEMS_PER_PAGE && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color="primary" />
          </Box>
        )}

        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontSize: '1.25rem', fontWeight: 700 }}>Eliminar Trabajo</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary">
              {selectedTrabajo ? `¿Seguro que deseas eliminar "${selectedTrabajo.titulo}"?` : '¿Seguro que deseas eliminar este trabajo?'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDeleteDialog} color="inherit">Cancelar</Button>
            <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
