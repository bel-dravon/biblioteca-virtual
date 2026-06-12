import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Box, Breadcrumbs, Button, Chip, Container, Collapse,
  Grid, Paper, Skeleton, Typography, Avatar,
} from '@mui/material';
import NavigateNextIcon          from '@mui/icons-material/NavigateNext';
import PersonIcon                from '@mui/icons-material/Person';
import CalendarTodayIcon         from '@mui/icons-material/CalendarToday';
import SchoolIcon                from '@mui/icons-material/School';
import LibraryBooksIcon          from '@mui/icons-material/LibraryBooks';
import SupervisorAccountIcon     from '@mui/icons-material/SupervisorAccount';
import MenuBookIcon              from '@mui/icons-material/MenuBook';
import VisibilityIcon            from '@mui/icons-material/Visibility';
import { Link as MuiLink }       from '@mui/material';
import { historialService, trabajosService } from '../../api';
import { useAuth }               from '../../context/AuthContext';
import { borderRadius, colors, shadows } from '../../theme/themeConfig';
import LoanSection               from './LoanSection';
import ImageViewer               from '../../components/ImageViewer';

const TIPO_COLOR = {
  'Tesis':            '#4F46E5',
  'Artículo':         '#0891B2',
  'Monografía':       '#7C3AED',
  'Proyecto':         '#059669',
  'Informe':          '#D97706',
  'trabajo_dirigido': '#4F46E5',
};
const DEFAULT_TIPO_COLOR = '#6B7280';

function MetaItem({ icon, label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
      <Box sx={{
        width: 28, height: 28, borderRadius: 1.5, flexShrink: 0, mt: 0.2,
        bgcolor: '#F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {React.cloneElement(icon, { sx: { fontSize: 14, color: '#64748B' } })}
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: 0.8, color: '#94A3B8', textTransform: 'uppercase', lineHeight: 1 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', mt: 0.3 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export default function TrabajoDetalle() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [work, setWork]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [verPdf, setVerPdf]       = useState(false);
  const [esPreview, setEsPreview] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const workData = await trabajosService.getById(id);
      setWork(workData);
      if (isAuthenticated) historialService.registrarVisualizacion(id).catch(() => null);
    } catch (e) {
      setError(e.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  const handleOpenPdf     = useCallback(() => { setEsPreview(false); setVerPdf(true);    }, []);
  const handleOpenPreview = useCallback(() => { setEsPreview(true);  setVerPdf(true);    }, []);
  const handleClosePdf    = useCallback(() => { setVerPdf(false);    setEsPreview(false); }, []);

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Skeleton variant="rectangular" height={32}  sx={{ borderRadius: 1, mb: 1, width: 320 }} />
          <Skeleton variant="rectangular" height={24}  sx={{ borderRadius: 1, mb: 2, width: 80 }} />
          <Skeleton variant="rectangular" height={48}  sx={{ borderRadius: 1, mb: 1.5, width: '70%' }} />
          <Skeleton variant="rectangular" height={28}  sx={{ borderRadius: 1, mb: 3, width: 240 }} />
          <Skeleton variant="rectangular" height={44}  sx={{ borderRadius: 1, mb: 3, width: 260 }} />
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={4}><Skeleton variant="rectangular" height={360} sx={{ borderRadius: 2 }} /></Grid>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2, mb: 2 }} />
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error) return <Typography color="error" sx={{ p: 4 }}>{error}</Typography>;
  if (!work)  return <Typography sx={{ p: 4 }}>No encontrado</Typography>;

  const accentColor = TIPO_COLOR[work.tipo_material] || DEFAULT_TIPO_COLOR;
  const autores     = work.autores_texto ? work.autores_texto.split(',').map(a => a.trim()) : [];
  const hasContent  = work.anio_publicacion || work.especialidad || work.signatura_topografica || work.asesor_texto;

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>

      {verPdf && (
        <ImageViewer
          pdfUrl={work.archivo_ruta}
          titulo={work.titulo}
          username={user?.username || 'BiblioVirtual'}
          esPreview={!isAuthenticated}
          trabajoId={id}
          onClose={handleClosePdf}
        />
      )}

      <Collapse in={!verPdf}>
        <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 6, md: 8 } }}>

          {/* Breadcrumbs */}
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" sx={{ color: '#CBD5E1' }} />}
            sx={{ mb: 1.75 }}
          >
            {[
              { to: '/',         label: 'Inicio'    },
              { to: '/explorar', label: 'Catálogo'  },
            ].map(({ to, label }) => (
              <MuiLink key={to} underline="hover" component={Link} to={to} sx={{
                color: '#64748B', fontSize: '0.8rem', fontWeight: 500,
                '&:hover': { color: accentColor },
              }}>
                {label}
              </MuiLink>
            ))}
            <Typography sx={{
              color: '#334155', fontSize: '0.8rem', fontWeight: 600,
              maxWidth: { xs: 160, sm: 420 }, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {work.titulo}
            </Typography>
          </Breadcrumbs>

          {/* Chip tipo */}
          <Chip label={work.tipo_material} size="small" sx={{
            mb: 1.5, bgcolor: `${accentColor}15`, color: accentColor,
            fontWeight: 700, fontSize: '0.68rem', height: 20,
            letterSpacing: 0.5, borderRadius: 1,
          }} />

          {/* Título */}
          <Typography variant="h4" sx={{
            fontWeight: 800, color: '#0F172A', lineHeight: 1.2,
            letterSpacing: '-0.4px', fontSize: { xs: '1.3rem', md: '1.8rem' },
            mb: autores.length ? 1.5 : 0,
          }}>
            {work.titulo}
          </Typography>

          {/* Autores */}
          {autores.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2.5 }}>
              {autores.map((autor, i) => (
                <Chip
                  key={`${autor}-${i}`}
                  avatar={
                    <Avatar sx={{ bgcolor: `${accentColor}20`, width: 18, height: 18 }}>
                      <PersonIcon sx={{ fontSize: 11, color: accentColor }} />
                    </Avatar>
                  }
                  label={autor}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: '#E2E8F0', color: '#475569', fontWeight: 500,
                    fontSize: '0.75rem', borderRadius: 10,
                    '& .MuiChip-avatar': { width: 18, height: 18, ml: '4px' },
                  }}
                />
              ))}
            </Box>
          )}

          {/* ── Contenido principal ── */}
          {/*
              Layout desktop:
              - Con imagen:    [imagen 3col] [resumen+meta 5col] [acciones 4col]
              - Sin imagen:    [resumen+meta 8col]               [acciones 4col]
              Layout mobile: todo apilado
          */}
          <Grid container spacing={2.5} alignItems="flex-start">

            {/* Imagen — solo si existe */}
            {work.thumbnail && (
              <Grid item xs={12} md={3}>
                <Box sx={{
                  borderRadius: 2.5, overflow: 'hidden',
                  border: '1px solid #E2E8F0', bgcolor: '#fff',
                  position: { md: 'sticky' }, top: { md: 24 },
                }}>
                  <img
                    src={work.thumbnail} alt={work.titulo}
                    style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                  />
                </Box>
              </Grid>
            )}

            {/* Resumen + metadatos */}
            <Grid item xs={12} md={work.thumbnail ? 5 : 8}>

              <Paper elevation={0} sx={{
                p: { xs: 2.5, md: 3 }, borderRadius: 2.5,
                border: '1px solid #E2E8F0', bgcolor: '#fff', mb: 2,
              }}>
                <Typography sx={{
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1,
                  color: accentColor, textTransform: 'uppercase', mb: 1.25,
                }}>
                  Resumen
                </Typography>
                <Typography sx={{ color: '#475569', lineHeight: 1.85, fontSize: '0.9rem', textAlign: 'justify' }}>
                  {work.resumen}
                </Typography>
              </Paper>

              {hasContent && (
                <Paper elevation={0} sx={{
                  p: { xs: 2.5, md: 3 }, borderRadius: 2.5,
                  border: '1px solid #E2E8F0', bgcolor: '#fff',
                }}>
                  <Typography sx={{
                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1,
                    color: accentColor, textTransform: 'uppercase', mb: 2.5,
                  }}>
                    Información del documento
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                    <MetaItem icon={<CalendarTodayIcon />}     label="Año de publicación"   value={work.anio_publicacion} />
                    <MetaItem icon={<LibraryBooksIcon />}      label="Signatura topográfica" value={work.signatura_topografica} />
                    <MetaItem icon={<SchoolIcon />}            label="Especialidad"          value={work.especialidad} />
                    <MetaItem icon={<SupervisorAccountIcon />} label="Asesor"                value={work.asesor_texto} />
                  </Box>
                </Paper>
              )}
            </Grid>

            {/* LoanSection — siempre en columna derecha (desktop) / abajo (mobile) */}
            <Grid item xs={12} md={4}>
              <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
                <LoanSection
                  isAuthenticated={isAuthenticated}
                  hasPdf={Boolean(work.archivo_ruta)}
                  onOpenPdf={handleOpenPdf}
                  onOpenPreview={handleOpenPreview}
                  trabajoId={id}
                />
              </Box>
            </Grid>

          </Grid>

        </Container>
      </Collapse>
    </Box>
  );
}