import React from 'react';
import { Box, Container, Grid, Typography, IconButton, Link as MuiLink } from '@mui/material';
import { Facebook, Twitter, Instagram, } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { colors } from '../theme/themeConfig';

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: 'white', pt: 6, pb: 3, borderTop: `1px solid ${colors.borders.light}`, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>
              BiblioVirtual
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mb: 2 }}>
              Plataforma de gestión y difusión académica de la carrera de Ingeniería de Sistemas. Acceso abierto al conocimiento.
            </Typography>
            <Box>
              <IconButton size="small" aria-label="Facebook" sx={{ color: 'text.secondary', '&:hover': { color: '#1877F2' } }}><Facebook /></IconButton>
              <IconButton size="small" aria-label="Twitter" sx={{ color: 'text.secondary', '&:hover': { color: '#1DA1F2' } }}><Twitter /></IconButton>
              <IconButton size="small" aria-label="Instagram" sx={{ color: 'text.secondary', '&:hover': { color: '#E4405F' } }}><Instagram /></IconButton>
            </Box>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
              Plataforma
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <MuiLink component={Link} to="/explorar" color="text.secondary" underline="hover" variant="body2">Catálogo</MuiLink>
              <MuiLink component={Link} to="/convocatorias" color="text.secondary" underline="hover" variant="body2">Convocatorias</MuiLink>
            </Box>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
              Soporte
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <MuiLink href="#" color="text.secondary" underline="hover" variant="body2">Centro de Ayuda</MuiLink>
              <MuiLink href="#" color="text.secondary" underline="hover" variant="body2">Reglamento</MuiLink>
              <MuiLink href="#" color="text.secondary" underline="hover" variant="body2">Contacto</MuiLink>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
              Desarrollado por
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Belén Asunción Rodríguez Navarro<br/>
              Potosí, Bolivia.
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ borderTop: `1px solid ${colors.borders.light}`, mt: 4, pt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.tertiary">
            © {new Date().getFullYear()} BiblioVirtual. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
