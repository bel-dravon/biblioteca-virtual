import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { aportesService } from '../api/aportes';

const MOTIVOS_RECHAZO = [
    { value: 'duplicado', label: 'Documento duplicado' },
    { value: 'formato_incorrecto', label: 'Formato incorrecto' },
    { value: 'contenido_no_academico', label: 'Contenido no academico' },
];

const ESTADO_LABELS = {
    pendiente: 'Pendiente',
    aceptado: 'Aceptado',
    rechazado: 'Rechazado',
};

export default function AdminAportes() {
    const [aportes, setAportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tokenModal, setTokenModal] = useState({ open: false, tokens: [] });
    const [rechazoModal, setRechazoModal] = useState({
        open: false,
        aporteId: null,
        motivo_rechazo: '',
        comentario_rechazo: '',
    });

    useEffect(() => {
        cargarAportes();
    }, []);

    const cargarAportes = async () => {
        try {
            setLoading(true);
            const data = await aportesService.getAll();
            setAportes(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            setError('No tienes permiso para ver aportes o hubo un error al cargar.');
        } finally {
            setLoading(false);
        }
    };

    const handleAprobar = async (id) => {
        try {
            await aportesService.aprobar(id);
            setSuccess('Aporte aceptado correctamente. Se generaron 2 creditos.');
            cargarAportes();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Error al aceptar: ' + (err.message || 'Error desconocido'));
        }
    };

    const handleRechazar = async () => {
        if (!rechazoModal.aporteId) return;
        try {
            await aportesService.rechazar(
                rechazoModal.aporteId,
                rechazoModal.motivo_rechazo,
                rechazoModal.comentario_rechazo
            );
            setSuccess('Aporte rechazado correctamente.');
            setRechazoModal({ open: false, aporteId: null, motivo_rechazo: '', comentario_rechazo: '' });
            cargarAportes();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Error al rechazar: ' + (err.message || 'Error desconocido'));
        }
    };

    const getEstadoSx = (estado) => ({
        fontWeight: 600,
        textTransform: 'capitalize',
        borderRadius: '8px',
        px: 1,
        ...(estado === 'aceptado' && { bgcolor: '#dcfce7', color: '#166534' }),
        ...(estado === 'rechazado' && { bgcolor: '#fee2e2', color: '#991b1b' }),
        ...(estado === 'pendiente' && { bgcolor: '#fef3c7', color: '#92400e' }),
    });

    if (loading) {
        return (
            <Container sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, px: 2 }}>
                <Typography
                    variant="h3"
                    fontWeight="bold"
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    Gestion de Aportes
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, mx: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2, mx: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            <Paper
                elevation={0}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    mx: 2,
                }}
            >
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{
                                bgcolor: '#f8fafc',
                                '& th': {
                                    fontWeight: 700,
                                    color: '#475569',
                                    fontSize: '0.875rem',
                                    py: 2.5,
                                    borderBottom: '2px solid #e2e8f0',
                                },
                            }}>
                                <TableCell>ID</TableCell>
                                <TableCell>Titulo</TableCell>
                                <TableCell>Aportante</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Origen</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Motivo rechazo</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Documento</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {aportes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                                        No hay aportes registrados.
                                    </TableCell>
                                </TableRow>
                            )}

                            {aportes.map((aporte) => (
                                <TableRow
                                    key={aporte.id}
                                    sx={{
                                        '&:hover': { bgcolor: '#f8fafc' },
                                        '& td': { py: 2, borderBottom: '1px solid #f1f5f9' },
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{aporte.id}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{aporte.titulo}</TableCell>
                                    <TableCell sx={{ color: '#475569' }}>{aporte.nombre_completo}</TableCell>
                                    <TableCell sx={{ color: '#475569' }}>{aporte.email}</TableCell>
                                    <TableCell sx={{ color: '#475569' }}>{aporte.organizacion_origen || 'No especificado'}</TableCell>
                                    <TableCell>
                                        <Chip label={ESTADO_LABELS[aporte.estado] || aporte.estado} size="small" sx={getEstadoSx(aporte.estado)} />
                                    </TableCell>
                                    <TableCell sx={{ color: '#475569', fontSize: '0.8rem' }}>
                                        {aporte.motivo_rechazo ? (
                                            <Box>
                                                <Typography variant="caption" fontWeight={600} color="error">
                                                    {MOTIVOS_RECHAZO.find(m => m.value === aporte.motivo_rechazo)?.label || aporte.motivo_rechazo}
                                                </Typography>
                                                {aporte.comentario_rechazo && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {aporte.comentario_rechazo}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                                        {aporte.created_at ? new Date(aporte.created_at).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {aporte.archivo_url ? (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                href={aporte.archivo_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                            >
                                                Ver archivo
                                            </Button>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">Sin archivo</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {aporte.estado === 'pendiente' && (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleAprobar(aporte.id)}
                                                    sx={{
                                                        bgcolor: '#dcfce7',
                                                        color: '#166534',
                                                        '&:hover': { bgcolor: '#bbf7d0' },
                                                        width: 36,
                                                        height: 36,
                                                    }}
                                                    title="Aceptar"
                                                >
                                                    <CheckCircleIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setRechazoModal({
                                                        open: true,
                                                        aporteId: aporte.id,
                                                        motivo_rechazo: '',
                                                        comentario_rechazo: '',
                                                    })}
                                                    sx={{
                                                        bgcolor: '#fee2e2',
                                                        color: '#991b1b',
                                                        '&:hover': { bgcolor: '#fecaca' },
                                                        width: 36,
                                                        height: 36,
                                                    }}
                                                    title="Rechazar"
                                                >
                                                    <CancelIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        )}

                                        {aporte.estado === 'aceptado' && (
                                            <Box>
                                                <Chip
                                                    label={`Creditos: ${aporte.creditos_disponibles || 0}`}
                                                    size="small"
                                                    sx={{ bgcolor: '#FCE7F3', color: '#BE185D', fontWeight: 600, borderRadius: 1.5, mr: 1 }}
                                                />
                                                {aporte.tokens && aporte.tokens.length > 0 && (
                                                    <Button size="small" variant="text" onClick={() => setTokenModal({ open: true, tokens: aporte.tokens })}>
                                                        Ver codigos
                                                    </Button>
                                                )}
                                            </Box>
                                        )}

                                        {aporte.estado === 'rechazado' && (
                                            <Typography variant="caption" color="error.main" fontWeight={600}>
                                                Rechazado
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog
                open={rechazoModal.open}
                onClose={() => setRechazoModal({ ...rechazoModal, open: false })}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: '#1e293b' }}>Rechazar aporte</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Motivo de rechazo</InputLabel>
                            <Select
                                value={rechazoModal.motivo_rechazo}
                                label="Motivo de rechazo"
                                onChange={(e) => setRechazoModal({ ...rechazoModal, motivo_rechazo: e.target.value })}
                            >
                                {MOTIVOS_RECHAZO.map((motivo) => (
                                    <MenuItem key={motivo.value} value={motivo.value}>
                                        {motivo.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Comentario adicional (opcional)"
                            value={rechazoModal.comentario_rechazo}
                            onChange={(e) => setRechazoModal({ ...rechazoModal, comentario_rechazo: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setRechazoModal({ ...rechazoModal, open: false })} sx={{ textTransform: 'none', borderRadius: 1 }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleRechazar}
                        variant="contained"
                        color="error"
                        disabled={!rechazoModal.motivo_rechazo}
                        sx={{ textTransform: 'none', borderRadius: 1 }}
                    >
                        Rechazar
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={tokenModal.open} onClose={() => setTokenModal({ open: false, tokens: [] })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, color: '#1e293b' }}>Codigos de descarga</DialogTitle>
                <DialogContent>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Codigo</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Usado en</TableCell>
                                    <TableCell>Fecha</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tokenModal.tokens?.map((t, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Typography fontFamily="monospace" fontWeight="bold">{t.token}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={t.usado ? 'Usado' : 'Disponible'} size="small" color={t.usado ? 'error' : 'success'} />
                                        </TableCell>
                                        <TableCell>{t.usado_para || '-'}</TableCell>
                                        <TableCell>{t.usado_en ? new Date(t.usado_en).toLocaleDateString() : '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTokenModal({ open: false, tokens: [] })}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
