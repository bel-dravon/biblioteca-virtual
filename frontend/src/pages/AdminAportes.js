import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAuth } from '../context/AuthContext';
import { aportesService } from '../api/aportes';
import { borderRadius, colors } from '../theme/themeConfig';

export default function AdminAportes() {
    const { user } = useAuth();
    const [aportes, setAportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tokenModal, setTokenModal] = useState({ open: false, tokens: [] });
    const [rechazoModal, setRechazoModal] = useState({ open: false, aporteId: null, motivo: '' });

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
            setSuccess('Aporte aprobado correctamente. Se generaron 3 créditos.');
            cargarAportes();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Error al aprobar: ' + (err.message || 'Error desconocido'));
        }
    };

    const handleRechazar = async () => {
        if (!rechazoModal.aporteId) return;
        try {
            await aportesService.rechazar(rechazoModal.aporteId, rechazoModal.motivo);
            setSuccess('Aporte rechazado correctamente.');
            setRechazoModal({ open: false, aporteId: null, motivo: '' });
            cargarAportes();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Error al rechazar: ' + (err.message || 'Error desconocido'));
        }
    };

    if (loading) {
        return (
            <Container sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* ===== TÍTULO ESTILO GESTIÓN DE USUARIOS ===== */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 4,
                px: 2
            }}>
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
                    Gestión de Aportes
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, mx: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2, mx: 2 }}>{success}</Alert>}

            <Paper
                elevation={0}
                sx={{
                    borderRadius: '20px',
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
                                    borderBottom: '2px solid #e2e8f0'
                                }
                            }}>
                                <TableCell>ID</TableCell>
                                <TableCell>Título</TableCell>
                                <TableCell>Aportante</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {aportes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                                        No hay aportes registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                            {aportes.map((aporte) => (
                                <TableRow
                                    key={aporte.id}
                                    sx={{
                                        '&:hover': { bgcolor: '#f8fafc' },
                                        '& td': { py: 2, borderBottom: '1px solid #f1f5f9' }
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>
                                        {aporte.id}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                                        {aporte.titulo}
                                    </TableCell>
                                    <TableCell sx={{ color: '#475569' }}>
                                        {aporte.nombre_completo}
                                    </TableCell>
                                    <TableCell sx={{ color: '#475569' }}>
                                        {aporte.email}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={aporte.estado}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                textTransform: 'capitalize',
                                                borderRadius: '8px',
                                                px: 1,
                                                ...(aporte.estado === 'aprobado' && {
                                                    bgcolor: '#dcfce7',
                                                    color: '#166534',
                                                }),
                                                ...(aporte.estado === 'rechazado' && {
                                                    bgcolor: '#fee2e2',
                                                    color: '#991b1b',
                                                }),
                                                ...(aporte.estado === 'pendiente' && {
                                                    bgcolor: '#fef3c7',
                                                    color: '#92400e',
                                                }),
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                                        {new Date(aporte.created_at).toLocaleDateString()}
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
                                                    title="Aprobar"
                                                >
                                                    <CheckCircleIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setRechazoModal({ open: true, aporteId: aporte.id, motivo: '' })}
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
                                        {aporte.estado === 'aprobado' && (
                                            <Box>
                                                <Chip
                                                label={`Créditos: ${aporte.creditos_disponibles || 0}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: '#FCE7F3',
                                                    color: '#BE185D',
                                                    fontWeight: 600,
                                                    borderRadius: 1.5,
                                                    mr: 1
                                                }}
                                                />
                                                {aporte.tokens && aporte.tokens.length > 0 && (
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    onClick={() => setTokenModal({ open: true, tokens: aporte.tokens })}
                                                >
                                                    Ver códigos
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
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: '#1e293b' }}>
                    Motivo del Rechazo
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="¿Por qué rechazas este aporte?"
                        value={rechazoModal.motivo}
                        onChange={(e) => setRechazoModal({ ...rechazoModal, motivo: e.target.value })}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => setRechazoModal({ ...rechazoModal, open: false })}
                        sx={{ textTransform: 'none', borderRadius: '10px' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleRechazar}
                        variant="contained"
                        color="error"
                        sx={{ textTransform: 'none', borderRadius: '10px' }}
                    >
                        Rechazar
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Modal de Tokens */}
            <Dialog
                open={tokenModal.open}
                onClose={() => setTokenModal({ open: false, tokens: [] })}
                maxWidth="sm"
                fullWidth
                >
                <DialogTitle sx={{ fontWeight: 700, color: '#1e293b' }}>
                    Códigos de Descarga
                </DialogTitle>
                <DialogContent>
                    <TableContainer>
                    <Table size="small">
                        <TableHead>
                        <TableRow>
                            <TableCell>Código</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Usado en</TableCell>
                            <TableCell>Fecha</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {tokenModal.tokens?.map((t, i) => (
                            <TableRow key={i}>
                            <TableCell>
                                <Typography fontFamily="monospace" fontWeight="bold">
                                {t.token}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Chip
                                label={t.usado ? 'Usado' : 'Disponible'}
                                size="small"
                                color={t.usado ? 'error' : 'success'}
                                />
                            </TableCell>
                            <TableCell>
                                {t.usado_para || '-'}
                            </TableCell>
                            <TableCell>
                                {t.usado_en ? new Date(t.usado_en).toLocaleDateString() : '-'}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTokenModal({ open: false, tokens: [] })}>
                    Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}