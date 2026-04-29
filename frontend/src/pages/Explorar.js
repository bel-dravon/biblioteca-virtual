import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Container, Typography, Grid, Pagination, Skeleton, Alert,
  useMediaQuery, useTheme, ToggleButton, ToggleButtonGroup, Paper, Button
} from '@mui/material';
import { ViewModule as ViewModuleIcon, ViewList as ViewListIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import WorkCard from '../components/WorkCard';
import { trabajosService } from '../api';
import { useLocation } from 'react-router-dom';
import { colors } from '../theme/themeConfig';

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

      // Mapeo de filtros del frontend a parámetros de la API
      if (filters.search) apiFilters.titulo = filters.search;
      if (filters.type) apiFilters.tipo = filters.type;
      if (filters.year) apiFilters.anio = filters.year;
      if (filters.autor) apiFilters.autor = filters.autor;
      if (filters.palabraClave) apiFilters.palabra_clave = filters.palabraClave;

      const data = await trabajosService.getAll(apiFilters);
      setTrabajos(Array.isArray(data) ? data : data.results || []);
      setPage(1); // Reset a primera página al cambiar filtros
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los trabajos.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Paginación local
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
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', pb: 8 }}>
      {/* Header */}
      <Box sx={{
        bgcolor: colors.background.paper,
        pt: { xs: 3, md: 4 },
        pb: { xs: 4, md: 6 },
        px: 2,
        borderBottom: `1px solid ${colors.borders.light}`
      }}>
        <Container maxWidth="xl">
          <Typography
            variant="h4"
            component="h1"
            fontWeight="800"
            color="text.primary"
            gutterBottom
            sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
          >
            Explorar Catálogo
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: { xs: 3, md: 4 }, maxWidth: 600 }}
          >
            Encuentra tesis, libros y artículos académicos. Utiliza los filtros para refinar tu búsqueda.
          </Typography>

          <FilterBar onFiltersChange={handleFiltersChange} />
        </Container>
      </Box>

      {/* Contenido */}
      <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 4 } }}>
        {/* Contador de resultados */}
        {!loading && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              {trabajos.length} resultado{trabajos.length !== 1 ? 's' : ''} encontrado{trabajos.length !== 1 ? 's' : ''}
            </Typography>
            <ToggleButtonGroup exclusive value={viewMode} onChange={(_, value) => value && setViewMode(value)} size="small">
              <ToggleButton value="grid"><ViewModuleIcon sx={{ mr: 1 }} />Cuadrícula</ToggleButton>
              <ToggleButton value="list"><ViewListIcon sx={{ mr: 1 }} />Lista</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {loading ? (
          <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch" role="region" aria-label="Resultados de busqueda">
            {[...Array(8)].map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 4 }} />
              </Grid>
            ))}
          </Grid>
        ) : viewMode === 'grid' ? (
          <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch" role="region" aria-label="Resultados de busqueda">
            {paginatedTrabajos.map((work) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={work.id}>
                <Link to={`/work/${work.id}`} style={{ textDecoration: 'none' }}>
                  <Box sx={{ height: '100%', cursor: 'pointer', width: '100%', maxWidth: 384 }}>
                    <WorkCard trabajo={work} variant="card" />
                  </Box>
                </Link>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} role="region" aria-label="Resultados de busqueda">
            {paginatedTrabajos.map((work) => (
              <Paper key={work.id} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${colors.borders.light}` }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={9}>
                    <Typography variant="h6" fontWeight={700}>{work.titulo}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{work.autores_texto || 'Autor desconocido'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{work.resumen}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {work.tipo_material} {work.anio_publicacion ? `• ${work.anio_publicacion}` : ''} {work.especialidad ? `• ${work.especialidad}` : ''}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button component={Link} to={`/work/${work.id}`} fullWidth variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
                      Ver Detalles
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>
        )}

        {/* Estado vacío */}
        {!loading && trabajos.length === 0 && (
          <Box sx={{
            textAlign: 'center',
            py: { xs: 6, md: 8 },
            px: 2
          }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No se encontraron resultados
            </Typography>
            <Typography variant="body2" color="text.tertiary">
              Intenta ajustar los filtros de búsqueda
            </Typography>
          </Box>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: { xs: 4, md: 6 }
          }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size={isMobile ? "small" : "large"}
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}
