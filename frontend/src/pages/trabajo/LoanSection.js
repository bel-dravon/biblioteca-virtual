import React from 'react';
import {
  Box,
  Button,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ShareIcon from '@mui/icons-material/Share';
import { borderRadius, colors, shadows } from '../../theme/themeConfig';

export default function LoanSection({
  isAuthenticated,
  tienePermisoDigital,
  hasPdf,
  onOpenPdf,
}) {
  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        bgcolor: colors.background.paper,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.soft,
        border: `1px solid ${colors.borders.light}`,
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Acciones
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tienePermisoDigital ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<MenuBookIcon />}
            fullWidth
            onClick={onOpenPdf}
            disabled={!hasPdf}
            sx={{
              borderRadius: borderRadius.md,
              py: 1.5,
              background: `linear-gradient(45deg, ${colors.primary.main} 30%, ${colors.primary.light} 90%)`,
            }}
          >
            Leer Documento
          </Button>
        ) : (
          <Tooltip title={isAuthenticated ? 'Acceso restringido' : 'Inicia sesion para acceder'}>
            <Button
              variant="contained"
              disabled
              startIcon={<LockIcon />}
              fullWidth
              sx={{ borderRadius: borderRadius.md, py: 1.5 }}
            >
              Acceso Restringido
            </Button>
          </Tooltip>
        )}

        <Button
          variant="text"
          startIcon={<ShareIcon />}
          fullWidth
          sx={{ borderRadius: borderRadius.md }}
        >
          Compartir Ficha
        </Button>
      </Box>
    </Paper>
  );
}
