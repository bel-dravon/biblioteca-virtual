import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h3" fontWeight={800} color="primary">
          404
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          Pagina no encontrada
        </Typography>
        <Typography color="text.secondary">
          La ruta que intentas visitar no existe o fue movida.
        </Typography>
        <Button component={Link} to="/" variant="contained" sx={{ mt: 1 }}>
          Volver al inicio
        </Button>
      </Box>
    </Container>
  );
}
