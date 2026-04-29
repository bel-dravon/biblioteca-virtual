import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Divider } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

import WorkCard from '../components/WorkCard';
import { trabajosService } from '../api';

export default function HomePage() {
  const [recientes, setRecientes] = useState([]);

  useEffect(() => {
    const loadRecientes = async () => {
      try {
        const data = await trabajosService.getAll();
        const lista = Array.isArray(data) ? data : data.results || [];
        setRecientes(lista.slice(0, 8));
      } catch (error) {
        console.error("Error cargando recientes", error);
      }
    };
    loadRecientes();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', py: 6 }}>
      <Container maxWidth="xl">
        
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight="800" color="text.primary" gutterBottom>
            Bienvenido a la Biblioteca Virtual
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Acceso directo a la producción intelectual reciente de la carrera.
          </Typography>
        </Box>

        <Divider sx={{ mb: 6 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Agregados Recientemente
          </Typography>
          <Button 
            component={Link} 
            to="/explorar" 
            endIcon={<ArrowForwardIcon />}
            variant="text"
          >
            Ver catálogo completo
          </Button>
        </Box>

        {recientes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 items-stretch md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recientes.map((work) => (
              <div key={work.id} className="flex h-full">
                <Link to={`/work/${work.id}`} style={{ textDecoration: 'none', width: '100%' }}>
                  <Box sx={{ height: '100%', width: '100%' }}>
                    <WorkCard work={work} />
                  </Box>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Cargando trabajos recientes...
          </Typography>
        )}

      </Container>
    </Box>
  );
}
