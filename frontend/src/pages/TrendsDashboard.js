import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Container, Typography, Grid, Paper, LinearProgress, Alert, Chip,
  TextField, Button, List, ListItem, ListItemText, 
  CircularProgress, Skeleton 
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  Lightbulb as LightbulbIcon,
  Public as PublicIcon,
  School as SchoolIcon,
  AutoStories as AutoStoriesIcon
} from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

import StatCard from '../components/StatCard';
import { trabajosService, estadisticasService } from '../api';

export default function TrendsDashboard() {

  // Estados para datos del backend
  const [tendencias, setTendencias] = useState([]);
  const [areasOportunidad, setAreasOportunidad] = useState([]);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState(null);
  const [autoresTop, setAutoresTop] = useState([]);
  const [tecnologias, setTecnologias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para validación de originalidad
  const [idea, setIdea] = useState('');
  const [analisis, setAnalisis] = useState(null);
  const [validando, setValidando] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await estadisticasService.getTendencias();
      
      setTendencias(data.tendencias_temas || []);
      setAreasOportunidad(data.areas_oportunidad || []);
      setEstadisticasGenerales(data.estadisticas_generales || {});
      setAutoresTop(data.autores_top || []);
      setTecnologias(data.tecnologias_emergentes || []);
      
    } catch (err) {
      console.error('Error cargando tendencias:', err);
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleValidar = useCallback(async () => {
    if (!idea.trim()) return;
    setValidando(true);
    try {
      const res = await trabajosService.validarTema(idea);
      setAnalisis(res);
    } catch (err) {
      console.error(err);
      setAnalisis({ error: 'Error al validar el tema' });
    } finally {
      setValidando(false);
    }
  }, [idea]);

  const handleIdeaChange = useCallback((e) => {
    setIdea(e.target.value);
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
        <Container maxWidth="xl" sx={{ pt: 4 }}>
          <Skeleton variant="text" width={300} height={60} sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            {[1, 2, 3].map(i => (
              <Grid item xs={12} md={4} key={i}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={cargarDatos} sx={{ mt: 2 }}>Reintentar</Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
      
      {/* Header */}
      <Box sx={{ bgcolor: '#fff', pt: 4, pb: 6, px: 2, borderBottom: '1px solid #E2E8F0' }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" fontWeight="800" color="text.primary">
              Tendencias Académicas
            </Typography>
            <Chip 
              label="Datos en Tiempo Real" 
              color="success" 
              size="small" 
              variant="outlined" 
              sx={{ fontWeight: 'bold' }} 
            />
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700 }}>
            Analisis automatico de la produccion academica registrada en la biblioteca
          </Typography>

          {/* Estadísticas Generales */}
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={4}>
              <StatCard 
                title="Trabajos Registrados" 
                value={estadisticasGenerales?.total_trabajos || 0} 
                icon={AutoStoriesIcon} 
                color="primary" 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard 
                title="Autores Activos" 
                value={estadisticasGenerales?.total_autores || 0} 
                icon={SchoolIcon} 
                color="success" 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard 
                title="Áreas de Estudio" 
                value={estadisticasGenerales?.total_palabras_clave || 0} 
                icon={PublicIcon} 
                color="warning" 
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Grid container spacing={4}>
          
          {/* Gráfico de Tendencias */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                Interés por Área de Investigación
              </Typography>
              
              {tendencias.length > 0 ? (
                tendencias.map((item, index) => (
                  <Box key={index} sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" fontWeight="600">
                          {item.tema}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.total_trabajos} trabajo{item.total_trabajos !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Chip 
                        label={item.estado} 
                        size="small" 
                        sx={{ 
                          bgcolor: item.estado === 'Oportunidad' ? '#DCFCE7' : 
                                   item.estado === 'Saturado' ? '#FEE2E2' : '#F1F5F9',
                          color: item.estado === 'Oportunidad' ? '#166534' : 
                                 item.estado === 'Saturado' ? '#991B1B' : 'text.secondary',
                          fontWeight: 'bold',
                          height: 24
                        }} 
                      />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(item.interes, 100)} 
                      sx={{ 
                        height: 12, 
                        borderRadius: 6,
                        bgcolor: '#F1F5F9',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: item.estado === 'Oportunidad' ? '#4ADE80' : 
                                   item.estado === 'Saturado' ? '#EF4444' : '#5B86E5',
                          borderRadius: 6
                        }
                      }} 
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {item.interes}% del total de publicaciones
                    </Typography>
                  </Box>
                ))
              ) : (
                <Alert severity="info">
                  No hay suficientes datos para mostrar tendencias. 
                  Agrega más trabajos con palabras clave.
                </Alert>
              )}
            </Paper>

            {/* Autores Más Productivos */}
            {autoresTop.length > 0 && (
              <Paper sx={{ p: 4, borderRadius: 3, mt: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Autores Más Productivos
                </Typography>
                <List>
                  {autoresTop.map((autor, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 1 }}>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" fontWeight="500">
                              {index + 1}. {autor.nombre}
                            </Typography>
                            <Chip 
                              label={`${autor.trabajos} trabajo${autor.trabajos !== 1 ? 's' : ''}`} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>

          {/* Sidebar con Oportunidades y Validador */}
          <Grid item xs={12} md={4}>
            
            {/* Áreas con Oportunidad */}
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#FEFCE8', border: '1px solid #FEF08A', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LightbulbIcon sx={{ color: '#D97706' }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#92400E' }}>
                  Oportunidades de Investigación
                </Typography>
              </Box>
              
              {areasOportunidad.length > 0 ? (
                <>
                  <Typography variant="body2" sx={{ color: '#B45309', mb: 2 }}>
                    Hay <strong>poca investigación</strong> en estas áreas:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {areasOportunidad.map((area, index) => (
                      <Chip 
                        key={index}
                        label={area} 
                        sx={{ 
                          bgcolor: '#FFF', 
                          border: '1px solid #FCD34D', 
                          color: '#D97706', 
                          fontWeight: 'bold' 
                        }} 
                      />
                    ))}
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No se detectaron áreas con baja investigación aún.
                </Typography>
              )}
            </Paper>

            {/* Tecnologías Emergentes */}
            {tecnologias.length > 0 && (
              <Paper sx={{ p: 3, borderRadius: 3, mb: 3, bgcolor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUpIcon sx={{ color: '#0284C7' }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#075985' }}>
                    Tecnologías en Tendencia
                  </Typography>
                </Box>
                <List dense>
                  {tecnologias.map((tech, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText 
                        primary={tech.nombre}
                        secondary={`${tech.menciones} menciones`}
                        primaryTypographyProps={{ fontWeight: 600, color: '#0C4A6E' }}
                        secondaryTypographyProps={{ color: '#0369A1' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Validador de Originalidad */}
            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Validador de Originalidad
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Verifica si tu tema ya fue investigado antes de inscribirlo.
              </Typography>
              
              <TextField 
                fullWidth 
                multiline 
                rows={3} 
                placeholder="Ej: Sistema web para gestión de biblioteca universitaria usando Django y React..." 
                value={idea} 
                onChange={handleIdeaChange} 
                sx={{ mb: 2, bgcolor: '#F8FAFC' }} 
              />
              
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleValidar}
                disabled={validando || !idea.trim()}
                startIcon={validando && <CircularProgress size={20} color="inherit" />}
              >
                {validando ? 'Analizando...' : 'Verificar Originalidad'}
              </Button>

              {analisis && !analisis.error && (
                <Box sx={{ 
                  mt: 3, 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: analisis.es_original ? '#DCFCE7' : '#FEE2E2' 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {analisis.es_original ? 
                      <CheckCircleIcon color="success" /> : 
                      <WarningIcon color="error" />
                    }
                    <Typography 
                      variant="subtitle1" 
                      fontWeight="bold" 
                      color={analisis.es_original ? 'success.main' : 'error.main'}
                    >
                      {analisis.es_original ? 'Tema Novedoso ✨' : 'Tema Recurrente'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Similitud máxima: <strong>{analisis.max_similitud}%</strong>
                  </Typography>

                  {analisis.similares.length > 0 && (
                    <>
                      <Typography variant="caption" fontWeight="bold" color="text.secondary">
                        TRABAJOS SIMILARES:
                      </Typography>
                      <List dense>
                        {analisis.similares.map((sim, i) => (
                          <ListItem key={i} sx={{ px: 0 }}>
                            <ListItemText 
                              primary={sim.titulo} 
                              secondary={`Similitud: ${sim.similitud}`} 
                              primaryTypographyProps={{ 
                                fontSize: '0.85rem', 
                                fontWeight: 500 
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Box>
              )}

              {analisis?.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {analisis.error}
                </Alert>
              )}
            </Paper>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}
