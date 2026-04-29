import React from 'react';
import {
  Box,
  Button,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockIcon from '@mui/icons-material/Lock';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ShareIcon from '@mui/icons-material/Share';
import { borderRadius, colors, shadows } from '../../theme/themeConfig';

export default function LoanSection({
  isAuthenticated,
  existingRequest,
  tienePermisoDigital,
  hasPdf,
  onOpenPdf,
  onOpenLoanModal,
  onNotify,
}) {
  const renderLoanButton = () => {
    if (!isAuthenticated) {
      return (
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          startIcon={<LocalLibraryIcon />}
          onClick={() => onNotify({ open: true, status: 'info', message: 'Inicia sesion primero.' })}
          sx={{ borderRadius: borderRadius.md }}
        >
          Solicitar Prestamo
        </Button>
      );
    }

    if (existingRequest?.estado === 'pendiente') {
      return (
        <Button
          variant="outlined"
          color="warning"
          fullWidth
          startIcon={<AccessTimeIcon />}
          disabled
          sx={{ borderRadius: borderRadius.md }}
        >
          Solicitud Pendiente
        </Button>
      );
    }

    if (existingRequest?.estado === 'aprobado') {
      return (
        <Button
          variant="contained"
          color="success"
          fullWidth
          startIcon={<CheckCircleIcon />}
          disabled
          sx={{ color: 'white', borderRadius: borderRadius.md }}
        >
          Prestamo Activo
        </Button>
      );
    }

    return (
      <Button
        variant="outlined"
        color="secondary"
        fullWidth
        startIcon={<LocalLibraryIcon />}
        onClick={onOpenLoanModal}
        sx={{ borderRadius: borderRadius.md }}
      >
        Solicitar Prestamo
      </Button>
    );
  };

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
          <Tooltip title="Solicita acceso digital para ver">
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

        {renderLoanButton()}

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
