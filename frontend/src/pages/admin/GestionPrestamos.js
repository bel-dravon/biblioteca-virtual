import React, { useState, useEffect } from 'react';
import {
Box, Container, Typography, Paper, Table, TableBody, TableCell,
TableContainer, TableHead, TableRow, Chip, Button, Dialog,
DialogTitle, DialogContent, DialogActions, TextField, Alert,
CircularProgress, Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import { prestamosService } from '../../api/prestamos';
import { useAuth } from '../../context/AuthContext';
export default function GestionPrestamos() {
    const [prestamos, setPrestamos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrestamo, setSelectedPrestamo] = useState(null);
    const [fechaDevolucion, setFechaDevolucion] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState('');
    const [error, setError] = useState(null);
    const { user } = useAuth();
    useEffect(() => { fetchPrestamos(); }, []);

    const fetchPrestamos = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await prestamosService.getAll();
            const data = Array.isArray(response) ? response : response.data?.results || response.data || [];
            setPrestamos(data);
        } catch (err) {
            setError('Error al cargar las solicitudes de préstamo');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (prestamo, action) => {
        setSelectedPrestamo(prestamo);
        setDialogAction(action);
        setDialogOpen(true);
    };

    const confirmAction = async () => {
        setError(null);
        try {
            if (dialogAction === 'aprobar') {
                await prestamosService.aprobar(selectedPrestamo.id);
            }
            setDialogOpen(false);
            setSelectedPrestamo(null);
            fetchPrestamos();
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al procesar la solicitud');
        }
    };

    const handleDevolver = async (prestamoId) => {
        if (!window.confirm('¿Confirmas que el libro ha sido devuelto?')) return;
        try {
            await prestamosService.devolver(prestamoId);
            fetchPrestamos();
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al procesar la devolución');
        }
    };

    const getEstadoColor = (estado) => {
        const colors = {
            pendiente: { bg: '#FEF3C7', color: '#92400E', label: 'Pendiente' },
            aprobada:  { bg: '#ECFDF5', color: '#059669', label: 'Aprobada' },   
            devuelta:  { bg: '#E0F2FE', color: '#0891B2', label: 'Devuelta' },   
        };
        return colors[estado] || colors.pendiente;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
            <Container maxWidth="xl">
                <Typography variant="h4" fontWeight={800} color="#0F172A" gutterBottom>
                    Gestión de Préstamos
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Administra las solicitudes de préstamo de libros físicos
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Libro</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Solicitud</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : prestamos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            No hay solicitudes de préstamo registradas
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    prestamos.map((p) => {
                                        const style = getEstadoColor(p.estado);
                                        return (
                                            <TableRow key={p.id} hover>
                                                <TableCell>#{p.id}</TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {p.usuario?.first_name} {p.usuario?.last_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            @{p.usuario?.username}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {p.libro?.titulo}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Stock: {p.libro?.stock}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={style.label}
                                                        size="small"
                                                        sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, borderRadius: 1 }}
                                                    />
                                                </TableCell>
                                                <TableCell>{formatDate(p.fecha_solicitud)}</TableCell>
                                                <TableCell align="center">
                                                    {p.estado === 'pendiente' && (
                                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                            <Tooltip title="Aprobar préstamo">
                                                                <Button size="small" variant="contained" color="success"
                                                                    startIcon={<CheckCircleIcon />}
                                                                    onClick={() => handleAction(p, 'aprobar')}>
                                                                    Aprobar
                                                                </Button>
                                                            </Tooltip>
                                                        </Box>
                                                    )}
                                                    {p.estado === 'aprobado' && (
                                                        <Tooltip title="Marcar como devuelto">
                                                            <Button size="small" variant="outlined" color="info"
                                                                startIcon={<AssignmentReturnIcon />}
                                                                onClick={() => handleDevolver(p.id)}>
                                                                Devuelto
                                                            </Button>
                                                        </Tooltip>
                                                    )}
                                                    {(p.estado === 'rechazado' || p.estado === 'devuelto') && (
                                                        <Typography variant="caption" color="text.secondary">Finalizado</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>

            <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setError(null); }}
                maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                        {dialogAction === 'aprobar' ? 'Aprobar Préstamo' : 'Rechazar Préstamo'}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {selectedPrestamo && (
                    <Box sx={{ pt: 1 }}>
                        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Libro</Typography>
                        <Typography variant="body1" fontWeight={600} gutterBottom>{selectedPrestamo.libro?.titulo}</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>Solicitante</Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {selectedPrestamo.usuario?.first_name} {selectedPrestamo.usuario?.last_name}
                            <Typography component="span" variant="body2" color="text.secondary">
                            {' '}({selectedPrestamo.usuario?.email})  {/* CAMBIO: username→email */}
                            </Typography>
                        </Typography>
                        </Paper>
                        <Alert severity="info" sx={{ mt: 1 }}>
                            Al aprobar.
                        </Alert>
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button variant="contained" color="success" onClick={confirmAction}>
                        Aprobar Préstamo    
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}