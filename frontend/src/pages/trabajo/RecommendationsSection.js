import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { borderRadius, colors } from '../../theme/themeConfig';

export default function RecommendationsSection({ recomendaciones }) {
  return (
    <>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Relacionados (Sugeridos por IA)
      </Typography>

      {recomendaciones.length > 0 ? (
        <Grid container spacing={2}>
          {recomendaciones.map((rec) => (
            <Grid item xs={12} sm={6} key={rec.id}>
              <Paper
                component={Link}
                to={`/work/${rec.id}`}
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  gap: 2,
                  textDecoration: 'none',
                  color: 'inherit',
                  borderRadius: borderRadius.md,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: colors.primary.main,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 50, sm: 60 },
                    height: { xs: 70, sm: 80 },
                    bgcolor: colors.background.light,
                    borderRadius: borderRadius.sm,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={rec.thumbnail || 'https://via.placeholder.com/60x80'}
                    alt="cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{
                      lineHeight: 1.2,
                      mb: 0.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {rec.titulo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rec.tipo_material} • {rec.anio_publicacion || 'S/A'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          No hay suficientes datos para generar recomendaciones aun.
        </Typography>
      )}
    </>
  );
}
