import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar, 
  IconButton, Button, Skeleton, 
} from '@mui/material';
import { Link } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArticleIcon from '@mui/icons-material/Article';

import { historialService } from '../api';

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
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const historialData = await historialService.getUserHistory();
      setHistorial(Array.isArray(historialData) ? historialData : historialData.results || []);
    } catch (error) {
      console.error("Error cargando biblioteca:", error);
    } finally {
      setLoading(false);
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
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: '#fff' }}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              Historial de Lectura
            </Typography>
          </Box>

          <Box sx={{ p: 2 }}>
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
          </Box>

        </Paper>
      </Container>
    </Box>
  );
}