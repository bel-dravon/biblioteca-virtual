import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, Pagination, Skeleton, Alert,
  useMediaQuery, useTheme, ToggleButton, ToggleButtonGroup, Paper, Button, Chip
} from '@mui/material';
import { ViewModule as ViewModuleIcon, ViewList as ViewListIcon, SearchOff as SearchOffIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import WorkCard from '../components/WorkCard';
import { trabajosService } from '../api';
import { useLocation } from 'react-router-dom';
import { colors } from '../theme/themeConfig';

// Color de acento por tipo de material para la vista lista
const TIPO_COLOR = {
  'Tesis': '#4F46E5',
  'Artículo': '#0891B2',
  'Monografía': '#7C3AED',
  'Proyecto': '#059669',
  'Informe': '#D97706',
};
const DEFAULT_TIPO_COLOR = '#6B7280';

export default function Explorar() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const itemsPerPage = 12;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    const typeParam = params.get('tipo');

    if (query || typeParam) {
      setFilters(prev => ({
        ...prev,
        search: query || prev.search,
        type: typeParam || prev.type
      }));
    }
    fetchTrabajos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, location.search]);

  const fetchTrabajos = useCallback(async () => {
    setLoading(true);
    try {
      const apiFilters = {};
      if (filters.search) apiFilters.titulo = filters.search;
      if (filters.type) apiFilters.tipo = filters.type;
      if (filters.year) apiFilters.anio = filters.year;
      if (filters.autor) apiFilters.autor = filters.autor;
      if (filters.palabraClave) apiFilters.palabra_clave = filters.palabraClave;

      const data = await trabajosService.getAll(apiFilters);
      setTrabajos(Array.isArray(data) ? data : data.results || []);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los trabajos.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const paginatedTrabajos = useMemo(() => trabajos.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  ), [trabajos, page, itemsPerPage]);

  const totalPages = useMemo(() => Math.ceil(trabajos.length / itemsPerPage), [trabajos.length, itemsPerPage]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handlePageChange = useCallback((e, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F4F6FA', pb: 10 }}>

      {/* Header con FilterBar */}
      <Box sx={{
        bgcolor: '#fff',
        borderBottom: '1px solid #E5E7EB',
        pt: { xs: 3, md: 4 },
        pb: { xs: 3, md: 5 },
        px: 2,
        position: 'relative',
        // Línea de acento índigo en el borde izquierdo del header
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: '#4F46E5',
          borderRadius: '0 2px 2px 0',
        }
      }}>
        <Container maxWidth="xl">
          <Typography
            variant="overline"
            sx={{
              color: '#4F46E5',
              fontWeight: 700,
              letterSpacing: 2,
              fontSize: '0.7rem',
              display: 'block',
              mb: 0.5
            }}
          >
            Catálogo
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#111827',
              mb: 3,
              letterSpacing: '-0.5px',
            }}
          >
            Explorar documentos
          </Typography>
          <FilterBar onFiltersChange={handleFiltersChange} />
        </Container>
      </Box>

      {/* Cuerpo */}
      <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 4 } }}>

        {/* Barra de resultados y controles de vista */}
        {!loading && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            gap: 2,
            flexWrap: 'wrap',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#374151',
                  fontWeight: 600,
                }}
              >
                {trabajos.length.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                resultado{trabajos.length !== 1 ? 's' : ''}
              </Typography>
            </Box>

            <ToggleButtonGroup
              exclusive
              value={viewMode}
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
              sx={{
                bgcolor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 2,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  px: 1.5,
                  py: 0.75,
                  color: '#6B7280',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  '&.Mui-selected': {
                    bgcolor: '#4F46E5',
                    color: '#fff',
                    '&:hover': { bgcolor: '#4338CA' },
                  },
                  '&:hover': { bgcolor: '#F3F4F6' },
                }
              }}
            >
              <ToggleButton value="grid">
                <ViewModuleIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Cuadrícula
              </ToggleButton>
              <ToggleButton value="list">
                <ViewListIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Lista
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2, fontWeight: 500 }}
          >
            {error}
          </Alert>
        )}

        {/* Skeletons de carga */}
        {loading ? (
          <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch">
            {[...Array(8)].map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton
                  variant="rectangular"
                  height={320}
                  sx={{ borderRadius: 3, bgcolor: '#E9ECF2' }}
                />
              </Grid>
            ))}
          </Grid>

        ) : viewMode === 'grid' ? (
          /* Vista cuadrícula */
          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            alignItems="stretch"
            role="region"
            aria-label="Resultados de búsqueda"
          >
            {paginatedTrabajos.map((work) => (
              <Grid item xs={12} sm={6} md={4} key={work.id}>
                <Link to={`/work/${work.id}`} style={{ textDecoration: 'none' }}>
                  <Box sx={{
                    height: '100%',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: 384,
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    borderRadius: 3,
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 10px 30px rgba(79,70,229,0.12)',
                    }
                  }}>
                    <WorkCard trabajo={work} variant="card" />
                  </Box>
                </Link>
              </Grid>
            ))}
          </Grid>

        ) : (
          /* Vista lista */
          <Box
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            role="region"
            aria-label="Resultados de búsqueda"
          >
            {paginatedTrabajos.map((work) => {
              const accentColor = TIPO_COLOR[work.tipo_material] || DEFAULT_TIPO_COLOR;
              return (
                <Paper
                  key={work.id}
                  elevation={0}
                  sx={{
                    p: 0,
                    borderRadius: 3,
                    border: '1px solid #E5E7EB',
                    bgcolor: '#fff',
                    overflow: 'hidden',
                    display: 'flex',
                    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                    '&:hover': {
                      borderColor: accentColor,
                      boxShadow: `0 4px 20px rgba(0,0,0,0.07)`,
                    }
                  }}
                >
                  {/* Línea de acento lateral por tipo */}
                  <Box sx={{
                    width: 4,
                    flexShrink: 0,
                    bgcolor: accentColor,
                    borderRadius: '3px 0 0 3px',
                  }} />

                  <Box sx={{ flex: 1, p: { xs: 2, md: 2.5 } }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={9}>
                        {/* Tipo de material */}
                        {work.tipo_material && (
                          <Chip
                            label={work.tipo_material}
                            size="small"
                            sx={{
                              mb: 1,
                              bgcolor: `${accentColor}15`,
                              color: accentColor,
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              height: 20,
                              letterSpacing: 0.5,
                              borderRadius: 1,
                            }}
                          />
                        )}

                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: '0.95rem', md: '1rem' },
                            color: '#111827',
                            lineHeight: 1.35,
                            mb: 0.5,
                          }}
                        >
                          {work.titulo}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ color: '#4F46E5', fontWeight: 500, mb: 0.75, fontSize: '0.8rem' }}
                        >
                          {work.autores_texto || 'Autor desconocido'}
                        </Typography>

                        {work.resumen && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 0.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontSize: '0.82rem',
                              lineHeight: 1.55,
                            }}
                          >
                            {work.resumen}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 1.5, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                          {work.anio_publicacion && (
                            <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 500 }}>
                              {work.anio_publicacion}
                            </Typography>
                          )}
                          {work.especialidad && (
                            <>
                              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#D1D5DB', alignSelf: 'center' }} />
                              <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 500 }}>
                                {work.especialidad}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                        <Button
                          component={Link}
                          to={`/work/${work.id}`}
                          variant="contained"
                          disableElevation
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: '#4F46E5',
                            borderRadius: 2,
                            px: 2.5,
                            py: 1,
                            fontSize: '0.82rem',
                            '&:hover': { bgcolor: '#4338CA' },
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Ver detalles
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}

        {/* Estado vacío */}
        {!loading && trabajos.length === 0 && (
          <Box sx={{
            textAlign: 'center',
            py: { xs: 8, md: 12 },
            px: 2,
          }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}>
              <SearchOffIcon sx={{ fontSize: 28, color: '#4F46E5' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 0.75 }}>
              Sin resultados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mx: 'auto' }}>
              No hay documentos que coincidan con tu búsqueda. Probá ajustando los filtros.
            </Typography>
          </Box>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: { xs: 5, md: 7 }
          }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size={isMobile ? 'small' : 'large'}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                  fontWeight: 600,
                },
                '& .Mui-selected': {
                  bgcolor: '#4F46E5 !important',
                  color: '#fff',
                },
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}
