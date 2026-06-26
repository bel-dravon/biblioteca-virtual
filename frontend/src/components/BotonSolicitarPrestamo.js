import React, { useState } from 'react';
import {
    Box, Button, Typography, Chip, Snackbar, Alert, Dialog,
    DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { prestamosService } from '../api/prestamos';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
export default function BotonSolicitarPrestamo({ libro }) {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleSolicitarPrestamo = async () => {
        if (!isAuthenticated) { setDialogOpen(true); return; }
        setLoading(true);
        try {
            await prestamosService.create({ libro_id: libro.id });
            setSnackbar({ open: true, message: '¡Solicitud enviada! El administrador la revisará pronto.', severity: 'success' });
        } catch (err) {
            const detail = err.response?.data?.detail;
            setSnackbar({ open: true, message: detail || 'Error al solicitar el préstamo.', severity: 'error' });
        } finally { setLoading(false); }
    };

    const handleCloseSnackbar = () => { setSnackbar(prev => ({ ...prev, open: false })); };
    const handleLoginRedirect = () => { setDialogOpen(false); navigate('/login', { state: { from: `/libros/${libro.id}` } }); };

    const stockDisponible = libro.stock > 0;

    return (
        <>
            <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Chip label={stockDisponible ? `Stock: ${libro.stock} disponible${libro.stock > 1 ? 's' : ''}` : 'Sin stock'}
                        color={stockDisponible ? 'success' : 'error'} variant="outlined" size="small" />
                </Box>
                <Button variant="contained" color="primary" size="large" fullWidth
                    startIcon={<MenuBookIcon />} onClick={handleSolicitarPrestamo}
                    disabled={!stockDisponible || loading}
                    sx={{
                        py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '1rem',
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
                        '&:hover': { boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)' },
                    }}>
                    {loading ? 'Enviando...' : !stockDisponible ? 'Sin stock disponible' : !isAuthenticated ? 'Inicia sesión para solicitar' : 'Solicitar Préstamo'}
                </Button>
                {!isAuthenticated && stockDisponible && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                        Debes iniciar sesión para solicitar un préstamo
                    </Typography>
                )}
            </Box>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
                    <MenuBookIcon sx={{ fontSize: 48, color: '#3B82F6', mb: 1 }} />
                    <Typography variant="h6" fontWeight={700}>Inicia sesión para continuar</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        Para solicitar el préstamo de <strong>"{libro.titulo}"</strong> necesitas iniciar sesión.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 1 }}>
                    <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
                    <Button variant="contained" onClick={handleLoginRedirect} startIcon={<CheckCircleIcon />}>
                        Iniciar Sesión
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}