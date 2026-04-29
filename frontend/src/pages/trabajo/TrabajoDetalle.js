import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Collapse,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Typography,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PersonIcon from '@mui/icons-material/Person';
import { Link as MuiLink } from '@mui/material';
import { historialService, solicitudesService, trabajosService } from '../../api';
import { useAuth } from '../../context/AuthContext';
import LoanRequestModal from '../../components/LoanRequestModal';
import LoanStatusNotification from '../../components/LoanStatusNotification';
import { borderRadius, colors, shadows } from '../../theme/themeConfig';
import PDFSection from './PDFSection';
import LoanSection from './LoanSection';

export default function TrabajoDetalle() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingRequest, setExistingRequest] = useState(null);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, status: 'success', message: '' });
  const [verPdf, setVerPdf] = useState(false);

  const esExterno = user?.username === 'estudiante_externo';
  const permisoPorSolicitud =
    existingRequest?.estado === 'aprobado' && existingRequest?.tipo_solicitud === 'descarga';
  const tienePermisoDigital = (isAuthenticated && !esExterno) || permisoPorSolicitud;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const workData = await trabajosService.getById(id);

      setWork(workData);

      if (isAuthenticated) {
        if (tienePermisoDigital) {
          historialService.registrarVisualizacion(id).catch(() => null);
        }

        try {
          const misSolicitudes = await solicitudesService.getAll();
          const lista = Array.isArray(misSolicitudes) ? misSolicitudes : misSolicitudes.results || [];
          const solicitudEncontrada = lista.find((solicitud) => {
            const trabajoIdEnSolicitud = solicitud.trabajo_detalle?.id || solicitud.trabajo;
            return trabajoIdEnSolicitud === parseInt(id, 10);
          });

          setExistingRequest(solicitudEncontrada || null);
        } catch (solicitudesError) {
          console.error('Error verificando solicitudes', solicitudesError);
        }
      }
    } catch (requestError) {
      setError(requestError.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, tienePermisoDigital]);

  const handleLoanSubmit = useCallback(async (loanData) => {
    if (!work?.id) return;

    try {
      await solicitudesService.create({
        trabajo: work.id,
        tipo_solicitud: loanData.loanType === 'fisico' ? 'prestamo' : 'descarga',
      });

      setNotification({ open: true, status: 'success', message: 'Solicitud enviada exitosamente.' });
      fetchData();
    } catch (requestError) {
      let errorMsg = 'Error al solicitar.';
      if (requestError.status === 401) errorMsg = 'Tu sesion ha expirado.';
      else if (requestError.errors?.detail) errorMsg = requestError.errors.detail;

      setNotification({ open: true, status: 'rejected', message: errorMsg });
    }
  }, [work?.id, fetchData]);

  const handleOpenPdf = useCallback(() => setVerPdf(true), []);
  const handleClosePdf = useCallback(() => setVerPdf(false), []);
  const handleOpenLoanModal = useCallback(() => setLoanModalOpen(true), []);
  const handleCloseLoanModal = useCallback(() => setLoanModalOpen(false), []);
  const handleCloseNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: borderRadius.lg }} />
        </Container>
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!work) {
    return <Typography>No encontrado</Typography>;
  }

  return (
    <Box sx={{ bgcolor: colors.background.default, minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink underline="hover" color="inherit" component={Link} to="/">
            Inicio
          </MuiLink>
          <MuiLink underline="hover" color="inherit" component={Link} to="/explorar">
            Catalogo
          </MuiLink>
          <Typography
            color="text.primary"
            sx={{
              maxWidth: { xs: 150, sm: 300 },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {work.titulo}
          </Typography>
        </Breadcrumbs>

        <Button component={Link} to="/explorar" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
          Volver al catalogo
        </Button>

        <PDFSection
          verPdf={verPdf}
          pdfUrl={work.archivo_ruta}
          title={work.titulo}
          username={user?.username}
          onClose={handleClosePdf}
        />

        <Collapse in={!verPdf}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper
                sx={{
                  p: { xs: 2, md: 3 },
                  bgcolor: colors.background.paper,
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.soft,
                  border: `1px solid ${colors.borders.light}`,
                }}
              >
                <Chip
                  label={work.tipo_material}
                  color="primary"
                  size="small"
                  sx={{ mb: 2, textTransform: 'capitalize', borderRadius: borderRadius.sm }}
                />

                <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom sx={{ lineHeight: 1.3 }}>
                  {work.titulo}
                </Typography>

                {work.autores_texto && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                    {work.autores_texto.split(',').map((autor, index) => (
                      <Chip
                        key={`${autor}-${index}`}
                        avatar={
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        }
                        label={autor.trim()}
                        variant="outlined"
                        sx={{ borderRadius: borderRadius.sm }}
                      />
                    ))}
                  </Box>
                )}

                {work.thumbnail && (
                  <Box
                    sx={{
                      mb: 3,
                      borderRadius: borderRadius.md,
                      overflow: 'hidden',
                      maxHeight: { xs: '250px', md: '400px' },
                      display: 'flex',
                      justifyContent: 'center',
                      bgcolor: colors.background.light,
                    }}
                  >
                    <img src={work.thumbnail} alt={work.titulo} style={{ maxWidth: '100%', objectFit: 'contain' }} />
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Resumen
                </Typography>
                <Typography paragraph color="text.secondary" sx={{ textAlign: 'justify' }}>
                  {work.resumen}
                </Typography>

                {(work.anio_publicacion || work.especialidad || work.signatura_topografica || work.asesor_texto) && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: colors.background.light,
                      borderRadius: borderRadius.md,
                    }}
                  >
                    <Grid container spacing={2}>
                      {work.anio_publicacion && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            ANIO DE PUBLICACION
                          </Typography>
                          <Typography variant="body2">{work.anio_publicacion}</Typography>
                        </Grid>
                      )}
                      {work.signatura_topografica && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            SIGNATURA TOPOGRAFICA
                          </Typography>
                          <Typography variant="body2">{work.signatura_topografica}</Typography>
                        </Grid>
                      )}
                      {work.especialidad && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            ESPECIALIDAD
                          </Typography>
                          <Typography variant="body2">{work.especialidad}</Typography>
                        </Grid>
                      )}
                      {work.asesor_texto && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            ASESOR
                          </Typography>
                          <Typography variant="body2">{work.asesor_texto}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <LoanSection
                isAuthenticated={isAuthenticated}
                existingRequest={existingRequest}
                tienePermisoDigital={tienePermisoDigital}
                hasPdf={Boolean(work.archivo_ruta)}
                onOpenPdf={handleOpenPdf}
                onOpenLoanModal={handleOpenLoanModal}
                onNotify={setNotification}
              />
            </Grid>
          </Grid>
        </Collapse>

        {loanModalOpen && (
          <LoanRequestModal
            open={loanModalOpen}
            onClose={handleCloseLoanModal}
            book={work}
            onSubmit={handleLoanSubmit}
          />
        )}

        <LoanStatusNotification
          open={notification.open}
          status={notification.status}
          message={notification.message}
          onClose={handleCloseNotification}
        />
      </Container>
    </Box>
  );
}
