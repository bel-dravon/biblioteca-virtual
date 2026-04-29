import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Typography, IconButton, Tooltip, CircularProgress,
  Alert
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Close as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { colors, borderRadius, shadows } from '../theme/themeConfig';
import { API_URL } from '../api';

/**
 * Visor de PDF protegido con restricciones de copia y captura.
 *
 * LIMITACIONES IMPORTANTES (explicadas al final del archivo):
 * - Las protecciones son disuasorias, NO absolutas
 * - Un usuario determinado puede evadir estas medidas
 * - Se recomienda complementar con marcas de agua en el backend
 */
const ProtectedPDFViewer = ({
  pdfUrl,
  title = "Documento",
  onClose,
  watermarkText = ""
}) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Bloquear atajos de teclado para guardar/imprimir (solo dentro del visor)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Solo prevenir atajos dentro del contenedor del visor PDF
      if (!viewerRef.current?.contains(e.target)) return;

      // Bloquear Ctrl+S (guardar) y Ctrl+P (imprimir), NO Ctrl+C (copiar)
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'p')) ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Bloquear clic derecho solo dentro del visor
    const handleContextMenu = (e) => {
      if (!viewerRef.current?.contains(e.target)) return;
      e.preventDefault();
      return false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Manejar fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controles de zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  // URL del PDF con parámetros para deshabilitar toolbar del navegador
  const getPdfUrl = () => {
    if (!pdfUrl) return '';

    // Construir URL completa si es ruta relativa
    let fullUrl = pdfUrl;
    if (pdfUrl.startsWith('/')) {
      fullUrl = `${API_URL}${pdfUrl}`;
    } else if (!pdfUrl.startsWith('http')) {
      fullUrl = `${API_URL}/${pdfUrl}`;
    }

    // Agregar parámetros para ocultar controles del visor nativo
    const separator = fullUrl.includes('?') ? '&' : '#';
    return `${fullUrl}${separator}toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  };

  return (
    <Paper
      ref={containerRef}
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        bgcolor: '#1a1a2e',
        border: `1px solid ${colors.borders.light}`,
        boxShadow: shadows.soft,
        height: isFullscreen ? '100vh' : { xs: '70vh', md: '80vh' },
        display: 'flex',
        flexDirection: 'column',
        // Prevenir selección de texto
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      {/* Barra de herramientas */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          bgcolor: 'rgba(0,0,0,0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: 'white',
            fontWeight: 600,
            maxWidth: { xs: '150px', sm: '300px', md: '400px' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Controles de zoom */}
          <Tooltip title="Reducir">
            <IconButton size="small" onClick={handleZoomOut} sx={{ color: 'white' }} aria-label="Reducir zoom">
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Typography variant="caption" sx={{ color: 'white', mx: 1, minWidth: 45, textAlign: 'center' }}>
            {zoom}%
          </Typography>

          <Tooltip title="Ampliar">
            <IconButton size="small" onClick={handleZoomIn} sx={{ color: 'white' }} aria-label="Ampliar zoom">
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Fullscreen */}
          <Tooltip title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
            <IconButton size="small" onClick={toggleFullscreen} sx={{ color: 'white', ml: 1 }} aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>

          {/* Cerrar */}
          {onClose && (
            <Tooltip title="Cerrar visor">
              <IconButton size="small" onClick={onClose} sx={{ color: 'white', ml: 1 }} aria-label="Cerrar visor">
                <CloseIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Aviso de protección */}
      <Box
        sx={{
          px: 2,
          py: 0.5,
          bgcolor: 'rgba(245, 158, 11, 0.1)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <WarningIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
        <Typography variant="caption" sx={{ color: '#F59E0B' }}>
          Documento protegido - Solo lectura permitida
        </Typography>
      </Box>

      {/* Contenedor del PDF */}
      <Box
        ref={viewerRef}
        role="document"
        aria-label="Visor de documento PDF"
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 200px)',
          bgcolor: '#525659',
        }}
      >
        {/* Loading */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              zIndex: 10,
            }}
          >
            <CircularProgress sx={{ color: 'white' }} />
            <Typography variant="body2" sx={{ color: 'white' }}>
              Cargando documento...
            </Typography>
          </Box>
        )}

        {/* Iframe del PDF */}
        {pdfUrl ? (
          <iframe
            src={getPdfUrl()}
            title={title}
            onLoad={() => setLoading(false)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              pointerEvents: 'auto', // Permitir scroll
            }}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Alert severity="warning">
              No hay documento PDF disponible
            </Alert>
          </Box>
        )}

        {/* Capa de protección transparente (bloquea interacción directa con el PDF) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            // Esta capa está ENCIMA del iframe pero es transparente a eventos de scroll
            pointerEvents: 'none',
            // Watermark dinámico (marca de agua)
            '&::before': watermarkText ? {
              content: `"${watermarkText}"`,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-45deg)',
              fontSize: '4rem',
              fontWeight: 'bold',
              color: 'rgba(255,255,255,0.05)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 5,
            } : {},
          }}
        />
      </Box>

      {/* Footer con información */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Documento de uso académico - Prohibida su reproducción
        </Typography>
      </Box>
    </Paper>
  );
};

export default ProtectedPDFViewer;

/**
 * ============================================================
 * EXPLICACIÓN: PROTECCIÓN DE CONTENIDO PDF
 * ============================================================
 *
 * MEDIDAS IMPLEMENTADAS:
 * 1. Bloqueo de atajos (Ctrl+P, Ctrl+S, PrintScreen) dentro del visor
 * 2. Deshabilitación del clic derecho dentro del visor
 * 3. Ocultación de la barra de herramientas del visor PDF nativo
 * 4. Marca de agua superpuesta (watermark)
 * 5. Mensaje de "documento protegido"
 * 6. user-select: none para prevenir selección de texto
 *
 * LIMITACIONES IMPORTANTES:
 *
 * 1. CAPTURAS DE PANTALLA:
 *    - NO es posible prevenir capturas 100% desde el navegador
 *    - El usuario puede usar herramientas externas (Snipping Tool, ShareX)
 *    - Los dispositivos móviles tienen capturas de pantalla a nivel de SO
 *
 * 2. DESCARGA:
 *    - Si el PDF está en una URL pública, puede descargarse directamente
 *    - Las herramientas de desarrollo del navegador revelan la URL
 *    - Se puede interceptar el tráfico de red
 *
 * 3. COPIAR TEXTO:
 *    - El OCR puede extraer texto de capturas de pantalla
 *    - Algunos visores permiten copiar aunque se bloquee JS
 *
 * RECOMENDACIONES PARA MAYOR PROTECCIÓN:
 *
 * 1. BACKEND - Marca de agua en el PDF:
 *    - Agregar marca de agua con el nombre/ID del usuario
 *    - Usar PyPDF2 o reportlab en Django para generar PDFs marcados
 *
 * 2. DRM (Digital Rights Management):
 *    - Servicios como Adobe DRM, Locklizard, Vitrium
 *    - Mayor costo pero protección más robusta
 *
 * 3. STREAMING de imágenes:
 *    - Convertir PDF a imágenes página por página
 *    - Renderizar como canvas (más difícil de copiar)
 *    - Usar pdf.js con renderizado personalizado
 *
 * 4. ACCESO CONTROLADO:
 *    - URLs temporales con tokens que expiran
 *    - Logging de accesos por usuario
 *    - Límite de visualizaciones
 *
 * 5. TÉRMINOS Y CONDICIONES:
 *    - Hacer que el usuario acepte términos antes de ver
 *    - Consecuencias legales por violación de copyright
 *
 * CONCLUSIÓN:
 * La protección 100% de contenido digital es técnicamente imposible.
 * El objetivo es hacer la copia lo suficientemente difícil para
 * disuadir a usuarios casuales, mientras se acepta que usuarios
 * técnicamente avanzados pueden evadir las medidas.
 */
