import React from 'react';
import { Box, Container, Typography, Paper, Grid, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import GavelIcon from '@mui/icons-material/Gavel';
import { colors } from '../theme/themeConfig';

export default function About() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }} role="main">

      <Box sx={{ bgcolor: 'white', pt: 4, pb: 4, px: 2, borderBottom: '1px solid #E2E8F0' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" fontWeight="800" color="text.primary" gutterBottom>
            Información Institucional
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Conoce más sobre nuestra misión y las normativas de uso de la biblioteca.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={4}>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4, borderRadius: 3, mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InfoIcon color="primary" />
                <Typography variant="h6" component="h2" fontWeight="bold">Sobre Nosotros</Typography>
              </Box>
              <Typography paragraph color="text.secondary">
                La <strong>Biblioteca Virtual de Ingeniería de Sistemas</strong> es una plataforma dedicada a la gestión, preservación y difusión de la producción intelectual de nuestra facultad. Nuestro objetivo es facilitar el acceso a tesis, proyectos de grado y material bibliográfico para estudiantes e investigadores.
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" component="h3" fontWeight="bold" gutterBottom color="primary.main">
                    Nuestra Misión
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Democratizar el acceso a la información técnica y científica, proporcionando herramientas tecnológicas que agilicen la búsqueda y recuperación de documentos académicos.
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" component="h3" fontWeight="bold" gutterBottom color="primary.main">
                    Nuestra Visión
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Constituirnos en el repositorio digital de referencia a nivel universitario, integrando tecnologías de Inteligencia Artificial para potenciar la investigación.
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <GavelIcon color="warning" />
                <Typography variant="h6" component="h2" fontWeight="bold">Reglamento de Préstamos</Typography>
              </Box>

              <Typography variant="body2" sx={{ mb: 2 }}>
                Para garantizar el acceso equitativo al material físico, se establecen las siguientes normas:
              </Typography>

              <List>
                {[
                  "El préstamo a domicilio tiene una duración máxima de 3 días.",
                  "La no devolución en fecha conlleva una suspensión temporal del servicio.",
                  "El material debe ser devuelto en las mismas condiciones en las que fue entregado.",
                  "Los documentos marcados como 'Solo Sala' no pueden retirarse de la institución.",
                  "El acceso a documentos digitales es exclusivo para estudiantes matriculados."
                ].map((text, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={text} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: colors.primary.lighter, border: `1px solid ${colors.primary.light}` }}>
              <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom color="primary.dark">
                ¿Necesitas Ayuda?
              </Typography>
              <Typography variant="body2" paragraph color="text.secondary">
                Si tienes problemas con tu cuenta o necesitas orientación para buscar un tema, contáctanos.
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" fontWeight="bold" display="block">UBICACIÓN</Typography>
                <Typography variant="body2" gutterBottom>Bloque C, Planta Baja (Campus Universitario)</Typography>

                <Typography variant="caption" fontWeight="bold" display="block" sx={{ mt: 2 }}>HORARIO DE ATENCIÓN</Typography>
                <Typography variant="body2" gutterBottom>Lun - Vie: 08:00 - 18:00</Typography>

                <Typography variant="caption" fontWeight="bold" display="block" sx={{ mt: 2 }}>CORREO</Typography>
                <Typography variant="body2">biblioteca.sistemas@univ.edu.bo</Typography>
              </Box>
            </Paper>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}