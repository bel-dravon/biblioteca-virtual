import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Tabs, Tab, Paper, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar, 
  Chip, IconButton, Button, Skeleton, 
} from '@mui/material';
import { Link } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary'; 
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArticleIcon from '@mui/icons-material/Article';

import { historialService, solicitudesService } from '../api';

function TabPanel({ children, value, index }) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
      {value === index && children}
    </Box>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
      <Icon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>{description}</Typography>
      <Button component={Link} to="/explorar" variant="outlined">
        Ir a Explorar
      </Button>
    </Box>
  );
}

export default function MiBiblioteca() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [historial, setHistorial] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [historialData, solicitudesData] = await Promise.all([
        historialService.getUserHistory(), 
        solicitudesService.getAll() 
      ]);

      setHistorial(Array.isArray(historialData) ? historialData : historialData.results || []);
      setSolicitudes(Array.isArray(solicitudesData) ? solicitudesData : solicitudesData.results || []);
      
    } catch (error) {
      console.error("Error cargando biblioteca:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aprobado': return 'success';
      case 'rechazado': return 'error';
      case 'devuelto': return 'info';
      default: return 'warning';
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom sx={{ mb: 1 }}>
          Mi Biblioteca
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Gestiona tu actividad académica y el estado de tus préstamos.
        </Typography>

        <Paper sx={{ bgcolor: 'background.paper', borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fff' }}
          >
            <Tab icon={<LocalLibraryIcon />} iconPosition="start" label="Mis Solicitudes" />
            <Tab icon={<HistoryIcon />} iconPosition="start" label="Historial de Lectura" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {loading ? <Skeleton variant="rectangular" height={200} /> : (
              solicitudes.length > 0 ? (
                <List sx={{ px: 2 }}>
                  {solicitudes.map((sol) => (
                    <Paper key={sol.id} sx={{ mb: 2, borderRadius: 2, border: '1px solid #f0f0f0' }} elevation={0}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            <LocalLibraryIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="bold">
                              {sol.trabajo_detalle?.titulo || "Documento sin título"}
                            </Typography>
                          } secondary={
                            <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Solicitado el: {new Date(sol.fecha_solicitud).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Tipo: {sol.tipo_solicitud?.replace('_', ' ')}
                              </Typography>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: 1 }}>
                          <Chip 
                            label={sol.estado} 
                            color={getStatusColor(sol.estado)} 
                            size="small" 
                            sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}
                          />
                          {sol.estado === 'aprobado' && (
                              <Typography variant="caption" color="success.main" fontWeight="bold">
                                ¡Aprobado!
                              </Typography>
                          )}
                        </Box>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              ) : (
                <EmptyState 
                  icon={LocalLibraryIcon} 
                  title="No tienes solicitudes" 
                  description="Cuando pidas un libro físico, aparecerá aquí." 
                />
              )
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {loading ? <Skeleton variant="rectangular" height={200} /> : (
              historial.length > 0 ? (
                <List sx={{ px: 2 }}>
                  {historial.map((item) => (
                    <ListItem key={item.id} button component={Link} to={`/work/${item.trabajo}`} 
                      sx={{ mb: 1, borderRadius: 2, '&:hover': { bgcolor: 'action.hover' } }}>
                      <ListItemAvatar>
                        <Avatar variant="rounded" src={item.trabajo_detalle?.thumbnail} sx={{ bgcolor: 'grey.200' }}>
                            <ArticleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.trabajo_detalle?.titulo || "Elemento del historial"}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption">
                              Visto el {new Date(item.fecha_visualizacion).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton edge="end">
                        <VisibilityIcon color="action" />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <EmptyState 
                  icon={HistoryIcon} 
                  title="Historial vacío" 
                  description="Los documentos que leas aparecerán aquí automáticamente." 
                />
              )
            )}
          </TabPanel>

        </Paper>
      </Container>
    </Box>
  );
}