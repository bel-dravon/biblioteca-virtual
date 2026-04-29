import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Link as MuiLink,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Link as RouterLink } from 'react-router-dom';
import { apiClient } from '../api';
import { borderRadius, colors, shadows } from '../theme/themeConfig';

const typeConfig = {
  tesis: { bg: '#FEF3C7', color: '#D97706', label: 'Tesis' },
  proyecto_grado: { bg: '#DBEAFE', color: '#2563EB', label: 'Proyecto de Grado' },
  trabajo_dirigido: { bg: '#FDE68A', color: '#B45309', label: 'Trabajo Dirigido' },
  monografia: { bg: '#F3E8FF', color: '#9333EA', label: 'Monografia' },
  libro: { bg: '#D1FAE5', color: '#059669', label: 'Libro' },
};

const initialFilters = {
  tipo: '',
  autor: '',
  palabra_clave: '',
  anio: '',
};

export default function SmartLibrarySearch() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [mode, setMode] = useState('search');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);

  const activeFilters = useMemo(() => {
    const payload = {};
    if (filters.tipo) payload.tipo = filters.tipo;
    if (filters.autor) payload.autor = filters.autor;
    if (filters.palabra_clave) payload.palabra_clave = filters.palabra_clave;
    if (filters.anio) payload.anio = filters.anio;
    return payload;
  }, [filters]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer('');
    setSources([]);

    try {
      if (mode === 'search') {
        const data = await apiClient.post('/ia/search/', {
          query,
          limit: 12,
          filters: activeFilters,
        });
        setResults(data.results || []);
      } else {
        const data = await apiClient.post('/ia/rag/', {
          query,
          limit: 8,
          filters: activeFilters,
        });
        setAnswer(data.answer || '');
        setSources(data.sources || []);
        setResults(data.results || []);
      }
    } catch (err) {
      setError(err.message || 'No se pudo completar la consulta.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const getYear = (anio) => {
    if (!anio) return 'S/A';
    return String(anio);
  };

  const getAuthorName = (item) => {
    if (item.autores_texto) {
      return item.autores_texto;
    }
    if (Array.isArray(item.autores) && item.autores.length > 0) {
      return item.autores
        .map((autor) => `${autor.nombre || ''} ${autor.apellido || ''}`.trim())
        .filter(Boolean)
        .join(', ');
    }
    if (item.autor) return item.autor;
    return 'Autor no disponible';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background.default, pb: 8 }}>
      <Box
        sx={{
          bgcolor: colors.background.paper,
          pt: { xs: 3, md: 4 },
          pb: { xs: 4, md: 6 },
          px: 2,
          borderBottom: `1px solid ${colors.borders.light}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            fontWeight="800"
            color="text.primary"
            gutterBottom
            sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
          >
            Buscador Inteligente
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 700 }}
          >
            Explora el conocimiento de la biblioteca con busqueda semantica y preguntas
            asistidas por IA.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: 3, md: 4 } }}>
        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.borders.light}`,
            boxShadow: shadows.soft,
          }}
        >
          <Tabs
            value={mode}
            onChange={(_, value) => setMode(value)}
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{ mb: 3 }}
          >
            <Tab
              value="search"
              icon={<SearchIcon />}
              iconPosition="start"
              label="Busqueda Semantica"
            />
            <Tab
              value="rag"
              icon={<AutoAwesomeIcon />}
              iconPosition="start"
              label="Pregunta IA"
            />
          </Tabs>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={
                    mode === 'search'
                      ? 'Describe el tema o concepto que buscas'
                      : 'Formula tu pregunta sobre la biblioteca'
                  }
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  multiline
                  minRows={mode === 'rag' ? 2 : 1}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Filtros opcionales
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Tipo (tesis, monografia, libro...)"
                  value={filters.tipo}
                  onChange={handleFilterChange('tipo')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Autor"
                  value={filters.autor}
                  onChange={handleFilterChange('autor')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Palabra clave"
                  value={filters.palabra_clave}
                  onChange={handleFilterChange('palabra_clave')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Anio"
                  value={filters.anio}
                  onChange={handleFilterChange('anio')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={mode === 'search' ? <SearchIcon /> : <AutoAwesomeIcon />}
                  disabled={loading}
                  sx={{ width: { xs: '100%', md: 'auto' }, borderRadius: borderRadius.md }}
                >
                  {mode === 'search' ? 'Buscar' : 'Preguntar'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {mode === 'rag' && answer && (
          <Paper
            sx={{
              mt: 4,
              p: { xs: 2, md: 3 },
              borderRadius: borderRadius.lg,
              border: `1px solid ${colors.borders.light}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MenuBookIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                Respuesta IA
              </Typography>
            </Box>
            <Typography variant="body1" color="text.primary" sx={{ whiteSpace: 'pre-line' }}>
              {answer}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              Fuentes citadas
            </Typography>
            {sources.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No se encontraron fuentes para esta respuesta.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {sources.map((source) => (
                  <MuiLink
                    key={`${source.id}-${source.index}`}
                    component={RouterLink}
                    to={`/work/${source.id}`}
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: colors.primary.dark,
                      fontWeight: 600,
                    }}
                  >
                    <Chip label={`[${source.index}]`} size="small" />
                    {source.title || 'Documento'}
                  </MuiLink>
                ))}
              </Stack>
            )}
          </Paper>
        )}

        {mode === 'search' && !loading && results.length === 0 && query && !error && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No se encontraron resultados
            </Typography>
            <Typography variant="body2" color="text.tertiary">
              Intenta ajustar el texto o los filtros.
            </Typography>
          </Box>
        )}

        {results.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Documentos relacionados
            </Typography>
            <Grid container spacing={2}>
              {results.map((item) => {
                const type = typeConfig[item.tipo_material] || {
                  bg: '#F3F4F6',
                  color: '#4B5563',
                  label: 'Otro',
                };

                return (
                  <Grid item xs={12} md={6} key={item.id}>
                    <Card
                      sx={{
                        borderRadius: borderRadius.lg,
                        border: `1px solid ${colors.borders.light}`,
                        boxShadow: shadows.soft,
                        height: '100%',
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            mb: 1,
                          }}
                        >
                          <MuiLink
                            component={RouterLink}
                            to={`/work/${item.id}`}
                            underline="none"
                            sx={{ color: colors.text.primary, fontWeight: 700 }}
                          >
                            {item.titulo}
                          </MuiLink>
                          <Chip
                            label={type.label}
                            size="small"
                            sx={{ bgcolor: type.bg, color: type.color, fontWeight: 700 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {getAuthorName(item)} · {getYear(item.anio_publicacion)}
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {(item.resumen || '').slice(0, 240)}
                          {item.resumen && item.resumen.length > 240 ? '...' : ''}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
