import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Card, CardContent,
  Chip, Button, Skeleton, Alert, Dialog, DialogContent,
  DialogTitle, IconButton, ToggleButton, ToggleButtonGroup,
  Paper
} from '@mui/material';
import { 
  Event as EventIcon, 
  School as SchoolIcon, 
  Article as ArticleIcon,
  CalendarMonth as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';

import { convocatoriasService } from '../api';
import StatCard from '../components/StatCard'; 
import { colors, borderRadius, shadows } from '../theme/themeConfig';
import { API_URL } from '../api';

export default function Convocatorias() {
  const [convocatorias, setConvocatorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedConvocatoria, setSelectedConvocatoria] = useState(null);

  useEffect(() => {
    fetchConvocatorias();
  }, []);

  const fetchConvocatorias = async () => {
    try {
      setLoading(true);
      const data = await convocatoriasService.getAll();
      setConvocatorias(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las convocatorias.');
    } finally {
      setLoading(false);
    }
  };

  const activas = convocatorias.filter(c => c.estado === 'activo').length;
  const proximas = convocatorias.filter(c => c.estado === 'proximo').length;

  const getTypeConfig = (tipo) => {
    const t = tipo?.toLowerCase();
    if (t === 'beca') return { icon: <SchoolIcon />, color: 'success', bg: '#DCFCE7', text: '#166534' };
    if (t === 'evento') return { icon: <EventIcon />, color: 'primary', bg: '#DBEAFE', text: '#1E40AF' };
    return { icon: <ArticleIcon />, color: 'warning', bg: '#FEF3C7', text: '#92400E' };
  };

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${API_URL}${url}`;
    return `${API_URL}/${url}`;
  };

  const renderPreview = (conv) => {
    const imageUrl = getMediaUrl(conv?.imagen_adjunta);
    const docUrl = getMediaUrl(conv?.documento_adjunto);
    const isPdf = docUrl.toLowerCase().endsWith('.pdf');

    if (imageUrl) {
      return <Box component="img" src={imageUrl} alt={conv.titulo} sx={{ width: '100%', height: { xs: 220, md: '100%' }, objectFit: 'cover', borderRadius: 3 }} />;
    }

    if (docUrl && isPdf) {
      return <Box component="iframe" src={docUrl} title={conv.titulo} sx={{ width: '100%', minHeight: { xs: 260, md: 420 }, border: 0, borderRadius: 3, bgcolor: '#fff' }} />;
    }

    if (docUrl) {
      return (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', bgcolor: colors.background.light }}>
          <AttachFileIcon sx={{ fontSize: 48, color: colors.primary.main, mb: 2 }} />
          <Typography fontWeight={700} gutterBottom>Documento adjunto disponible</Typography>
          <Button component="a" href={docUrl} target="_blank" rel="noreferrer" variant="contained">Abrir documento</Button>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', bgcolor: colors.background.light }}>
        <ImageIcon sx={{ fontSize: 48, color: colors.text.secondary, mb: 2 }} />
        <Typography color="text.secondary">Sin adjuntos multimedia</Typography>
      </Paper>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
      
      <Box sx={{ bgcolor: '#fff', pt: 4, pb: 6, px: 2, borderBottom: '1px solid #E2E8F0' }}>
        <Container maxWidth="xl">
          <Typography variant="h4" fontWeight="800" color="text.primary" gutterBottom>
            Convocatorias y Eventos
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
            Mantente al día con las oportunidades académicas, becas de investigación y eventos de la facultad.
          </Typography>

          <ToggleButtonGroup
            exclusive
            value={viewMode}
            onChange={(_, value) => value && setViewMode(value)}
            size="small"
            sx={{ mb: 4 }}
          >
            <ToggleButton value="grid"><ViewModuleIcon sx={{ mr: 1 }} />Cuadrícula</ToggleButton>
            <ToggleButton value="list"><ViewListIcon sx={{ mr: 1 }} />Lista</ToggleButton>
          </ToggleButtonGroup>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <StatCard 
                title="Convocatorias Activas" 
                value={activas} 
                icon={SchoolIcon} 
                color="success" 
                trend={5} 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard 
                title="Próximos Eventos" 
                value={proximas} 
                icon={EventIcon} 
                color="primary" 
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Grid container spacing={3}>
            {[...Array(3)].map((_, i) => (
              <Grid item xs={12} md={6} lg={4} key={i}>
                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 4 }} />
              </Grid>
            ))}
          </Grid>
        ) : viewMode === 'grid' ? (
          <Grid container spacing={3}>
            {convocatorias.map((conv) => {
              const style = getTypeConfig(conv.tipo);
              return (
                <Grid item xs={12} md={6} lg={4} key={conv.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: borderRadius.lg, boxShadow: shadows.soft, border: '1px solid transparent', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: shadows.softHover } }}>
                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Chip icon={style.icon} label={conv.tipo} sx={{ bgcolor: style.bg, color: style.text, fontWeight: 'bold', borderRadius: '8px', '& .MuiChip-icon': { color: style.text } }} />
                        <Chip label={conv.estado} size="small" variant="outlined" color={conv.estado === 'activo' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                      </Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ lineHeight: 1.3 }}>{conv.titulo}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3 }}>{conv.descripcion}</Typography>
                      <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px dashed ${colors.borders.light}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="caption" fontWeight="600" color="text.secondary">Cierre: {new Date(conv.fecha_fin).toLocaleDateString()}</Typography>
                        </Box>
                        <Button fullWidth variant="outlined" endIcon={<ArrowForwardIcon />} onClick={() => setSelectedConvocatoria(conv)} sx={{ mt: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 'bold', border: `1px solid ${colors.borders.light}`, color: colors.text.primary, '&:hover': { bgcolor: colors.background.light, borderColor: colors.primary.main } }}>Ver Detalles</Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {convocatorias.map((conv) => {
              const style = getTypeConfig(conv.tipo);
              return (
                <Paper key={conv.id} sx={{ p: 2.5, borderRadius: borderRadius.lg, boxShadow: shadows.soft, border: `1px solid ${colors.borders.light}` }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Chip icon={style.icon} label={conv.tipo} sx={{ bgcolor: style.bg, color: style.text, fontWeight: 'bold', '& .MuiChip-icon': { color: style.text } }} />
                        <Chip label={conv.estado} size="small" variant="outlined" color={conv.estado === 'activo' ? 'success' : 'default'} sx={{ textTransform: 'capitalize' }} />
                      </Box>
                      <Typography variant="h6" fontWeight={700} gutterBottom>{conv.titulo}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{conv.descripcion}</Typography>
                      <Typography variant="caption" color="text.secondary">Cierre: {new Date(conv.fecha_fin).toLocaleDateString()}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button fullWidth variant="contained" onClick={() => setSelectedConvocatoria(conv)} endIcon={<ArrowForwardIcon />} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Ver Detalles</Button>
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Box>
        )}
      </Container>

      <Dialog open={Boolean(selectedConvocatoria)} onClose={() => setSelectedConvocatoria(null)} fullWidth maxWidth="lg">
        {selectedConvocatoria && (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              <Typography variant="h5" fontWeight={800}>{selectedConvocatoria.titulo}</Typography>
              <IconButton onClick={() => setSelectedConvocatoria(null)} sx={{ position: 'absolute', right: 16, top: 16 }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} alignItems="stretch">
                <Grid item xs={12} md={6}>
                  {renderPreview(selectedConvocatoria)}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip label={selectedConvocatoria.tipo} color="primary" />
                    <Chip label={selectedConvocatoria.estado} variant="outlined" sx={{ textTransform: 'capitalize' }} />
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>{selectedConvocatoria.descripcion}</Typography>
                  {selectedConvocatoria.requisitos && (
                    <>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>Requisitos</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mb: 3 }}>{selectedConvocatoria.requisitos}</Typography>
                    </>
                  )}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>FECHA INICIO</Typography>
                      <Typography variant="body2">{new Date(selectedConvocatoria.fecha_inicio).toLocaleDateString()}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>FECHA CIERRE</Typography>
                      <Typography variant="body2">{new Date(selectedConvocatoria.fecha_fin).toLocaleDateString()}</Typography>
                    </Grid>
                  </Grid>
                  {selectedConvocatoria.documento_adjunto && (
                    <Button component="a" href={getMediaUrl(selectedConvocatoria.documento_adjunto)} target="_blank" rel="noreferrer" variant="outlined" startIcon={<AttachFileIcon />} sx={{ mt: 3, textTransform: 'none' }}>
                      Abrir documento adjunto
                    </Button>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
