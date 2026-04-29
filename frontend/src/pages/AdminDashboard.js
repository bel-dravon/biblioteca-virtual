import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Container, Typography, Paper,
  List, ListItem, ListItemText, ListItemAvatar, Avatar, 
  IconButton, Chip, Alert, Skeleton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import { solicitudesService } from '../api';

export default function AdminDashboard() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await solicitudesService.getAll();
      setSolicitudes(Array.isArray(res) ? res : res.results || []);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendientes = useMemo(
    () => solicitudes.filter(s => s.estado === 'pendiente'),
    [solicitudes]
  );

  const handleSolicitudAction = useCallback(async (id, action) => {
    try {
      if (action === 'aprobar') {
        await solicitudesService.aprobar(id);
        setMessage({ type: 'success', text: 'Solicitud Aprobada' });
      } else { 
        await solicitudesService.rechazar(id);
        setMessage({ type: 'success', text: 'Solicitud rechazada' });
      }
      fetchData();
    } catch (error) {
      console.error("Error actualizando solicitud:", error);
    }
  }, [fetchData]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
        Gestión de Préstamos
      </Typography>

      {message && (
        <Alert severity="success" onClose={() => setMessage(null)} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow:'hidden' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Solicitudes de Prestamo
          </Typography>
        </Box>

        <Box sx={{ p: 2, bgcolor: '#f9f9f9', minHeight: 400 }}>
          {loading ? <Skeleton variant="rectangular" height={200} /> : (
            <List>
              {pendientes.length === 0 && (
                <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                  No hay solicitudes pendientes.
                </Typography>
              )}
              
              {pendientes.map((sol) => (
                <ListItem key={sol.id} secondaryAction={
                    <Box>
                      <IconButton color="success" onClick={() => handleSolicitudAction(sol.id, 'aprobar')} aria-label="Aprobar solicitud">
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleSolicitudAction(sol.id, 'rechazar')} aria-label="Rechazar solicitud">
                        <CancelIcon />
                      </IconButton>
                    </Box>
                  }
                  sx={{ bgcolor: 'white', mb: 1, borderRadius: 1, boxShadow: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}><LocalLibraryIcon /></Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={
                      <Typography fontWeight="bold">
                        {sol.usuario?.username || 'Usuario'}
                      </Typography>
                    } secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          Libro: {sol.trabajo_detalle?.titulo || "Cargando..."}
                        </Typography>
                        <Chip label={sol.tipo_solicitud} size="small" sx={{ mt: 0.5 }} />
                      </>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>
    </Container>
  );
}