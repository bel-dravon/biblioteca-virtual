import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Chip,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    Skeleton,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    People as PeopleIcon,
    MenuBook as MenuBookIcon,
    CloudUpload as CloudUploadIcon,
    Campaign as CampaignIcon,
    TrendingUp as TrendingUpIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Pending as PendingIcon,
    ArrowForward as ArrowForwardIcon,
    Visibility as VisibilityIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { trabajosService, convocatoriasService, aportesService } from '../../api';
import { API_URL } from '../../api/config';

const ACCENT = '#4F46E5';

const StatCard = ({ title, value, icon: Icon, color, onClick, trend }) => (
    <Paper
        elevation={0}
        sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid #E2E8F0',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.2s',
            '&:hover': onClick ? { borderColor: color, boxShadow: `0 4px 20px ${color}20` } : {},
            height: '100%'
        }}
        onClick={onClick}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box
                sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Icon sx={{ color, fontSize: 24 }} />
            </Box>
            {trend !== undefined && (
                <Chip
                    size="small"
                    label={`${trend >= 0 ? '+' : ''}${trend}%`}
                    sx={{
                        bgcolor: trend >= 0 ? '#ECFDF5' : '#FEF2F2',
                        color: trend >= 0 ? '#059669' : '#DC2626',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                    }}
                />
            )}
        </Box>
        <Typography variant="h3" fontWeight={800} color="#0F172A" sx={{ lineHeight: 1.2, mb: 0.5 }}>
            {value}
        </Typography>
        <Typography variant="body2" color="#64748B" fontWeight={600}>
            {title}
        </Typography>
    </Paper>
);

const SectionHeader = ({ title, actionText, onAction }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
            sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: 1,
                color: ACCENT,
                textTransform: 'uppercase'
            }}
        >
            {title}
        </Typography>
        {actionText && (
            <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={onAction}
                sx={{ textTransform: 'none', fontWeight: 600, color: ACCENT }}
            >
                {actionText}
            </Button>
        )}
    </Box>
);

const StatusChip = ({ estado }) => {
    const configs = {
        vigente:   { color: '#059669', bg: '#ECFDF5', icon: CheckCircleIcon }, 
        en_gracia: { color: '#D97706', bg: '#FEF3C7', icon: PendingIcon },    
        oculta:    { color: '#64748B', bg: '#F1F5F9', icon: CancelIcon },       
    };
    const config = configs[estado] || configs.pendiente;
    const Icon = config.icon;

    return (
        <Chip
            size="small"
            icon={<Icon sx={{ fontSize: 14, color: config.color }} />}
            label={estado}
            sx={{
                bgcolor: config.bg,
                color: config.color,
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'capitalize',
                '& .MuiChip-icon': { color: config.color }
            }}
        />
    );
};

export default function DashboardAdmin() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTrabajos: 0,
        totalConvocatorias: 0,
        totalAportes: 0,
        aportesPendientes: 0,
        aportesAprobados: 0,
        aportesRechazados: 0,
        convocatoriasActivas: 0,
    });
    const [recentAportes, setRecentAportes] = useState([]);
    const [recentConvocatorias, setRecentConvocatorias] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch en paralelo
            const [trabajos, convocatorias, aportes] = await Promise.all([
                trabajosService.getAll().catch(() => ({ results: [] })),
                convocatoriasService.getAll().catch(() => []),
                aportesService.getAll ? aportesService.getAll().catch(() => []) : Promise.resolve([]),
            ]);

            const trabajosList = trabajos.results || trabajos || [];
            const convList = Array.isArray(convocatorias) ? convocatorias : convocatorias.results || [];
            const aportesList = Array.isArray(aportes) ? aportes : aportes.results || [];

            const aportesPendientes = aportesList.filter(a => a.estado === 'pendiente');
            const aportesAprobados = aportesList.filter(a => a.estado === 'aprobado');
            const aportesRechazados = aportesList.filter(a => a.estado === 'rechazado');
            const convActivas = convList.filter(c => c.estado === 'vigente');

            setStats({
                totalTrabajos: trabajosList.length,
                totalConvocatorias: convList.length,
                totalAportes: aportesList.length,
                aportesPendientes: aportesPendientes.length,
                aportesAprobados: aportesAprobados.length,
                aportesRechazados: aportesRechazados.length,
                convocatoriasActivas: convActivas.length,
            });

            setRecentAportes(aportesList.slice(0, 5));
            setRecentConvocatorias(convList.slice(0, 5));
        } catch (err) {
            console.error('Error cargando dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
                <Container maxWidth="xl">
                    <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                        {[...Array(6)].map((_, i) => (
                            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
                                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
            <Container maxWidth="xl">
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={800} color="#0F172A" gutterBottom>
                        Panel de Administración
                    </Typography>
                    <Typography variant="body1" color="#64748B">
                        Bienvenido, <strong>{user?.first_name || user?.email }</strong>. Aquí tienes un resumen de la actividad del sistema.
                    </Typography>
                </Box>

                {/* Stats principales */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <StatCard
                            title="Trabajos"
                            value={stats.totalTrabajos}
                            icon={MenuBookIcon}
                            color={ACCENT}
                            onClick={() => navigate('/admin/trabajos')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <StatCard
                            title="Convocatorias"
                            value={stats.totalConvocatorias}
                            icon={CampaignIcon}
                            color="#0891B2"
                            onClick={() => navigate('/admin/convocatorias')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <StatCard
                            title="Aportes Totales"
                            value={stats.totalAportes}
                            icon={CloudUploadIcon}
                            color="#7C3AED"
                            onClick={() => navigate('/admin/aportes')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <StatCard
                            title="Pendientes"
                            value={stats.aportesPendientes}
                            icon={PendingIcon}
                            color="#D97706"
                            onClick={() => navigate('/admin/aportes')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <StatCard
                            title="Aprobados"
                            value={stats.aportesAprobados}
                            icon={CheckCircleIcon}
                            color="#059669"
                            onClick={() => navigate('/admin/aportes')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <StatCard
                            title="Activas"
                            value={stats.convocatoriasActivas}
                            icon={TrendingUpIcon}
                            color="#DC2626"
                            onClick={() => navigate('/admin/convocatorias')}
                        />
                    </Grid>
                </Grid>

                {/* Contenido en dos columnas */}
                <Grid container spacing={3}>
                    {/* Columna izquierda: Aportes recientes */}
                    <Grid item xs={12} lg={6}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: '1px solid #E2E8F0',
                                bgcolor: '#fff',
                                height: '100%'
                            }}
                        >
                            <SectionHeader
                                title="Aportes Recientes"
                                actionText="Ver todos"
                                onAction={() => navigate('/admin/aportes')}
                            />

                            {recentAportes.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <CloudUploadIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
                                    <Typography color="#94A3B8">No hay aportes registrados</Typography>
                                </Box>
                            ) : (
                                <List sx={{ p: 0 }}>
                                    {recentAportes.map((aporte, index) => (
                                        <React.Fragment key={aporte.id}>
                                            <ListItem
                                                sx={{
                                                    px: 0,
                                                    py: 1.5,
                                                    '&:hover': { bgcolor: '#F8FAFC', borderRadius: 2 },
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => navigate('/admin/aportes')}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: `${ACCENT}15`, color: ACCENT, fontSize: '0.875rem', fontWeight: 700 }}>
                                                        {aporte.nombre_completo?.charAt(0).toUpperCase() || 'A'}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                            <Typography variant="body2" fontWeight={700} color="#0F172A">
                                                                {aporte.titulo}
                                                            </Typography>
                                                            <StatusChip estado={aporte.estado} />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="#64748B">
                                                            {aporte.nombre_completo} • {aporte.email} • {new Date(aporte.created_at).toLocaleDateString()}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                            {index < recentAportes.length - 1 && (
                                                <Divider sx={{ borderColor: '#F1F5F9' }} />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>

                    {/* Columna derecha: Convocatorias recientes */}
                    <Grid item xs={12} lg={6}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: '1px solid #E2E8F0',
                                bgcolor: '#fff',
                                height: '100%'
                            }}
                        >
                            <SectionHeader
                                title="Convocatorias Recientes"
                                actionText="Ver todas"
                                onAction={() => navigate('/admin/convocatorias')}
                            />

                            {recentConvocatorias.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <CampaignIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 2 }} />
                                    <Typography color="#94A3B8">No hay convocatorias registradas</Typography>
                                </Box>
                            ) : (
                                <List sx={{ p: 0 }}>
                                    {recentConvocatorias.map((conv, index) => (
                                        <React.Fragment key={conv.id}>
                                            <ListItem
                                                sx={{
                                                    px: 0,
                                                    py: 1.5,
                                                    '&:hover': { bgcolor: '#F8FAFC', borderRadius: 2 },
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => navigate('/admin/convocatorias')}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: '#0891B215', color: '#0891B2' }}>
                                                        <CampaignIcon sx={{ fontSize: 20 }} />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                            <Typography variant="body2" fontWeight={700} color="#0F172A">
                                                                {conv.titulo}
                                                            </Typography>
                                                            <StatusChip estado={conv.estado} />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="#64748B">
                                                            Cierra: {new Date(conv.fecha_fin).toLocaleDateString()}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                            {index < recentConvocatorias.length - 1 && (
                                                <Divider sx={{ borderColor: '#F1F5F9' }} />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                {/* Acciones rápidas */}
                <Box sx={{ mt: 4 }}>
                    <Typography
                        sx={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: 1,
                            color: ACCENT,
                            textTransform: 'uppercase',
                            mb: 2
                        }}
                    >
                        Acciones Rápidas
                    </Typography>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Subir Trabajo', path: '/admin/trabajos', icon: MenuBookIcon, color: ACCENT },
                            { label: 'Crear Convocatoria', path: '/admin/convocatorias', icon: CampaignIcon, color: '#0891B2' },
                            { label: 'Validar Aportes', path: '/admin/aportes', icon: CloudUploadIcon, color: '#7C3AED' },
                            { label: 'Gestionar Usuarios', path: '/admin/usuarios', icon: PeopleIcon, color: '#059669' },
                        ].map((action) => (
                            <Grid item xs={12} sm={6} md={3} key={action.label}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<action.icon />}
                                    onClick={() => navigate(action.path)}
                                    sx={{
                                        py: 2,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        color: action.color,
                                        borderColor: `${action.color}30`,
                                        bgcolor: `${action.color}08`,
                                        '&:hover': {
                                            borderColor: action.color,
                                            bgcolor: `${action.color}15`
                                        }
                                    }}
                                >
                                    {action.label}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
}