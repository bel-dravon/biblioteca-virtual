import React, { useState, useEffect } from 'react';
import {
Box, Container, Typography, Paper, List, ListItem, ListItemText,
ListItemButton, Divider, Chip, Button, CircularProgress, Alert
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { notificacionesService } from '../api/notificaciones';
export default function NotificacionesPage() {
    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => { fetchNotificaciones(); }, []);

const fetchNotificaciones = async () => {
    setLoading(true);
    try {
        const response = await notificacionesService.getMisNotificaciones();
        const data = Array.isArray(response) ? response : response.data || [];
        setNotificaciones(data);
    } catch (err) {
        setError('Error al cargar las notificaciones');
    } finally {
        setLoading(false);
    }
};

const handleMarcarLeida = async (id) => {
    try {
        await notificacionesService.marcarLeida(id);
        setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch (err) {
        console.error('Error:', err);
    }
};

const handleMarcarTodasLeidas = async () => {
    try {
        await notificacionesService.marcarTodasLeidas();
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (err) {
        console.error('Error:', err);
    }
};

const getOrigenColor = (origen) => {
    const colors = {
        prestamo: { bg: '#ECFDF5', color: '#059669', label: 'Préstamo' },
        convocatoria: { bg: '#FEF3C7', color: '#92400E', label: 'Convocatoria' },
        aporte: { bg: '#E0F2FE', color: '#0891B2', label: 'Aporte' },
        sistema: { bg: '#F1F5F9', color: '#475569', label: 'Sistema' },
    };
    return colors[origen] || colors.sistema;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const noLeidasCount = notificaciones.filter(n => !n.leida).length;

return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="md">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <NotificationsIcon sx={{ fontSize: 32, color: '#0F172A' }} />
                    <Typography variant="h4" fontWeight={800} color="#0F172A">Notificaciones</Typography>
                </Box>
                {noLeidasCount > 0 && (
                    <Button variant="outlined" size="small" startIcon={<MarkEmailReadIcon />} onClick={handleMarcarTodasLeidas}>
                        Marcar todas como leídas
                    </Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                {loading ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
                ) : notificaciones.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">No tienes notificaciones</Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notificaciones.map((notif, index) => {
                            const origenStyle = getOrigenColor(notif.origen_tipo);
                            return (
                                <React.Fragment key={notif.id}>
                                    <ListItem sx={{ bgcolor: notif.leida ? 'transparent' : '#F0F9FF', px: 3, py: 2 }}>
                                        <ListItemButton onClick={() => !notif.leida && handleMarcarLeida(notif.id)}
                                            sx={{ borderRadius: 2, px: 2 }} disabled={notif.leida}>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Chip label={origenStyle.label} size="small"
                                                            sx={{ bgcolor: origenStyle.bg, color: origenStyle.color, fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                                                        {!notif.leida && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3B82F6' }} />}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="body2"
                                                            sx={{ color: notif.leida ? 'text.secondary' : 'text.primary', fontWeight: notif.leida ? 400 : 500, mt: 0.5 }}>
                                                            {notif.mensaje}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                                                            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                                            <Typography variant="caption" color="text.disabled">{formatDate(notif.created_at)}</Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                    {index < notificaciones.length - 1 && <Divider />}
                                </React.Fragment>
                            );
                        })}
                    </List>
                )}
            </Paper>
        </Container>
    </Box>
);
}