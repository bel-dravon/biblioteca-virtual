import React, { useState, useEffect, useRef } from 'react';
import {
    IconButton, Badge, Menu, MenuItem, Typography, Box, Divider,
    ListItemText, ListItemIcon, Button, Tooltip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CampaignIcon from '@mui/icons-material/Campaign';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { notificacionesService } from '../api/notificaciones';
export default function NotificacionesNavbar() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const navigate = useNavigate();
    const intervalRef = useRef(null);
    const open = Boolean(anchorEl);

    useEffect(() => {
        fetchNoLeidas();
        intervalRef.current = setInterval(fetchNoLeidas, 30000);
        return () => clearInterval(intervalRef.current);
    }, []);

    const fetchNoLeidas = async () => {
        try {
            const response = await notificacionesService.getNoLeidasCount();
            setNoLeidas(response.data?.count || 0);
        } catch (err) { console.error('Error:', err); }
    };

    const fetchNotificaciones = async () => {
        try {
            const response = await notificacionesService.getMisNotificaciones();
            const data = Array.isArray(response) ? response : response.data || [];
            setNotificaciones(data.slice(0, 5));
        } catch (err) { console.error('Error:', err); }
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        fetchNotificaciones();
    };

    const handleClose = () => { setAnchorEl(null); };

    const handleMarcarLeida = async (id, event) => {
        event.stopPropagation();
        try {
            await notificacionesService.marcarLeida(id);
            setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
            setNoLeidas(prev => Math.max(0, prev - 1));
        } catch (err) { console.error('Error:', err); }
    };

    const handleVerTodas = () => { handleClose(); navigate('/notificaciones'); };

    const getOrigenIcon = (origen) => {
        switch (origen) {
            case 'prestamo': return <MenuBookIcon fontSize="small" sx={{ color: '#059669' }} />;
            case 'convocatoria': return <CampaignIcon fontSize="small" sx={{ color: '#92400E' }} />;
            case 'aporte': return <SystemUpdateIcon fontSize="small" sx={{ color: '#0891B2' }} />;
            default: return <SystemUpdateIcon fontSize="small" sx={{ color: '#475569' }} />;
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMins = Math.floor((now - date) / 60000);
        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Hace ${diffHours} h`;
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <>
            <Tooltip title="Notificaciones">
                <IconButton onClick={handleClick} size="large"
                    aria-label={`${noLeidas} notificaciones sin leer`} sx={{ color: 'inherit' }}>
                    <Badge badgeContent={noLeidas} color="error" max={99} invisible={noLeidas === 0}>
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}
                PaperProps={{
                    elevation: 3,
                    sx: { width: 380, maxHeight: 450, borderRadius: 2, mt: 1.5 }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={700}>Notificaciones</Typography>
                    {noLeidas > 0 && <Typography variant="caption" color="primary" fontWeight={600}>{noLeidas} sin leer</Typography>}
                </Box>
                <Divider />
                {notificaciones.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">No hay notificaciones</Typography>
                    </Box>
                ) : (
                    <>
                        {notificaciones.map((notif) => (
                            <MenuItem key={notif.id}
                                onClick={() => { if (!notif.leida) handleMarcarLeida(notif.id, { stopPropagation: () => { } }); handleClose(); }}
                                sx={{
                                    py: 1.5, px: 2,
                                    bgcolor: notif.leida ? 'transparent' : '#F0F9FF',
                                    borderLeft: notif.leida ? 'none' : '3px solid #3B82F6',
                                    '&:hover': { bgcolor: notif.leida ? '#F8FAFC' : '#E0F2FE' }
                                }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>{getOrigenIcon(notif.origen_tipo)}</ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography variant="body2"
                                            sx={{ fontWeight: notif.leida ? 400 : 600, color: notif.leida ? 'text.secondary' : 'text.primary', lineHeight: 1.4 }}>
                                            {notif.mensaje}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                            {formatTime(notif.created_at)}
                                        </Typography>
                                    }
                                />
                                {!notif.leida && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3B82F6', ml: 1, flexShrink: 0 }} />}
                            </MenuItem>
                        ))}
                        <Divider />
                        <Box sx={{ p: 1 }}>
                            <Button fullWidth size="small" endIcon={<ArrowForwardIcon />} onClick={handleVerTodas}
                                sx={{ justifyContent: 'center', textTransform: 'none' }}>
                                Ver todas las notificaciones
                            </Button>
                        </Box>
                    </>
                )}
            </Menu>
        </>
    );
}