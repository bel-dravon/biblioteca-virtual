import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Fade,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PreviewIcon from '@mui/icons-material/Preview';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ShareIcon from '@mui/icons-material/Share';
import { aportesService } from '../../api/aportes';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../api/config';

/* ── helpers de estilo compartido con TrabajoDetalle ── */
const ACCENT = '#4F46E5';

export default function LoanSection({
  isAuthenticated,
  hasPdf,
  onOpenPdf,
  onOpenPreview,
  trabajoId,
}) {
  const { user } = useAuth();

  const [modalAporteOpen, setModalAporteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [resultadoVerificacion, setResultadoVerificacion] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenDescarga, setTokenDescarga] = useState('');

  const [formData, setFormData] = useState({
    nombre_completo: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
    email: user?.email || '',
    institucion: '',
    grado_academico: '',
    titulo: '',
    descripcion: '',
    archivo: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, archivo: e.target.files[0] }));
  };

  const handleSubmitAporte = async (e) => {
    e.preventDefault();
    setLoading(true);
    setVerificando(true);
    setError('');
    setSuccess(false);
    setResultadoVerificacion(null);

    if (!formData.archivo) {
      setError('Debes seleccionar un archivo PDF o DOCX.');
      setLoading(false);
      setVerificando(false);
      return;
    }

    try {
      const response = await aportesService.create(formData);
      setVerificando(false);
      setResultadoVerificacion({
        exito: true,
        estado: response.estado || 'aprobado',
        mensaje:
          response.estado === 'aprobado'
            ? '¡Documento verificado y aprobado! Se generaron 2 créditos de descarga.'
            : 'Documento en revisión.',
        tokens: response.tokens || [],
      });
      setSuccess(true);

      setTimeout(() => {
        setModalAporteOpen(false);
        setSuccess(false);
        setResultadoVerificacion(null);
        setFormData({
          nombre_completo: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
          email: user?.email || '',
          institucion: '',
          grado_academico: '',
          titulo: '',
          descripcion: '',
          archivo: null,
        });
      }, 6000);
    } catch (err) {
      setVerificando(false);
      setResultadoVerificacion({
        exito: false,
        estado: 'rechazado',
        mensaje: err.message || 'El documento no cumple con los requisitos.',
      });
      setError(err.message || 'Error al enviar el aporte.');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarConToken = async () => {
    if (!tokenDescarga || !trabajoId) return;
    try {
      const response = await fetch(`${API_URL}/api/creditos/descargar_con_token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenDescarga, trabajo_id: trabajoId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Error al descargar. Verifica tu código.');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setTokenDescarga('');
      alert('¡Descarga exitosa!');
    } catch (err) {
      console.error(err);
      alert('Error de conexión al intentar descargar.');
    }
  };

  const handleDescargarInterno = async () => {
    if (!trabajoId) return;
    try {
      const response = await fetch(`${API_URL}/api/creditos/descargar_con_token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ trabajo_id: trabajoId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'No tienes créditos de descarga disponibles.');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('¡Descarga exitosa!');
    } catch (err) {
      console.error(err);
      alert('Error de conexión al intentar descargar.');
    }
  };

  /* ──────────────── render ──────────────── */

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 2.5,
          border: '1px solid #E2E8F0',
          bgcolor: '#fff',
        }}
      >
        {/* Header */}
        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: 1,
            color: ACCENT,
            textTransform: 'uppercase',
            mb: 2,
          }}
        >
          Acciones
        </Typography>

        {!hasPdf && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
            Este documento no tiene archivo PDF disponible.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

          {/* ── Acceso principal ── */}
          {isAuthenticated ? (
            <Button
              fullWidth
              variant="contained"
              onClick={onOpenPdf}
              disabled={!hasPdf}
              startIcon={<MenuBookIcon />}
              sx={{
                py: 1.4,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                bgcolor: ACCENT,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#4338CA', boxShadow: 'none' },
                '&:disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' },
              }}
            >
              Leer documento
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={onOpenPreview}
              disabled={!hasPdf}
              startIcon={<PreviewIcon />}
              sx={{
                py: 1.4,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                bgcolor: '#0891B2',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#0E7490', boxShadow: 'none' },
                '&:disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' },
              }}
            >
              Ver preview
              <Typography
                component="span"
                sx={{
                  ml: 0.8,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  opacity: 0.85,
                }}
              >
                (15 páginas)
              </Typography>
            </Button>
          )}

          {/* ── Descarga ── */}
          {isAuthenticated && (
            <Button
              fullWidth
              variant="outlined"
              onClick={handleDescargarInterno}
              disabled={!hasPdf}
              startIcon={<DownloadIcon />}
              sx={{
                py: 1.2,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#475569',
                borderColor: '#E2E8F0',
                '&:hover': { borderColor: ACCENT, color: ACCENT, bgcolor: `${ACCENT}08` },
                '&:disabled': { borderColor: '#E2E8F0', color: '#94A3B8' },
              }}
            >
              Descargar PDF
            </Button>
          )}

          {/* ── Token (externos) ── */}
          {!isAuthenticated && (
            <Fade in={true}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <VpnKeyIcon sx={{ fontSize: 16, color: ACCENT }} />
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      color: '#64748B',
                      textTransform: 'uppercase',
                    }}
                  >
                    Código de acceso
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  size="small"
                  placeholder="Pega tu código aquí"
                  value={tokenDescarga}
                  onChange={(e) => setTokenDescarga(e.target.value)}
                  sx={{
                    mb: 1.5,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      bgcolor: '#fff',
                      fontSize: '0.85rem',
                    },
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleDescargarConToken}
                  disabled={!tokenDescarga || !hasPdf}
                  startIcon={<DownloadIcon />}
                  sx={{
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    bgcolor: '#475569',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#334155', boxShadow: 'none' },
                    '&:disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' },
                  }}
                >
                  Descargar con código
                </Button>

                <Typography
                  sx={{
                    mt: 1.5,
                    fontSize: '0.75rem',
                    color: '#64748B',
                    textAlign: 'center',
                  }}
                >
                  ¿No tienes código?{' '}
                  <Box
                    component="span"
                    onClick={() => setModalAporteOpen(true)}
                    sx={{
                      color: ACCENT,
                      fontWeight: 600,
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Aporta un documento
                  </Box>
                </Typography>
              </Box>
            </Fade>
          )}

          <Divider sx={{ my: 0.5, borderColor: '#E2E8F0' }} />

          {/* ── Aportar ── */}
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setModalAporteOpen(true)}
            startIcon={<CloudUploadIcon />}
            sx={{
              py: 1.2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#059669',
              borderColor: '#D1FAE5',
              bgcolor: '#ECFDF5',
              '&:hover': {
                borderColor: '#059669',
                bgcolor: '#D1FAE5',
              },
            }}
          >
            Aportar documento
          </Button>

          {/* ── Compartir ── */}
          <Button
            fullWidth
            variant="text"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              // Podrías agregar un snackbar aquí
            }}
            startIcon={<ShareIcon />}
            sx={{
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#64748B',
              '&:hover': { color: ACCENT, bgcolor: `${ACCENT}08` },
            }}
          >
            Copiar enlace
          </Button>
        </Box>
      </Paper>

      {/* ═══════════════════════════════════════
          MODAL DE APORTE
         ═══════════════════════════════════════ */}
      <Dialog
        open={modalAporteOpen}
        onClose={() => !loading && !verificando && setModalAporteOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header dinámico */}
        <DialogTitle
          sx={{
            bgcolor: verificando
              ? '#F8FAFC'
              : resultadoVerificacion
              ? resultadoVerificacion.estado === 'aprobado'
                ? '#ECFDF5'
                : '#FEF2F2'
              : '#fff',
            color: '#0F172A',
            fontWeight: 700,
            fontSize: '1.1rem',
            py: 2.5,
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          {verificando
            ? 'Verificando documento...'
            : resultadoVerificacion
            ? resultadoVerificacion.estado === 'aprobado'
              ? '¡Aporte aprobado!'
              : 'Aporte rechazado'
            : 'Aportar documento'}
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>
          {/* ── CARGA ── */}
          {verificando && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                gap: 3,
              }}
            >
              <CircularProgress size={56} thickness={3.5} sx={{ color: ACCENT }} />
              <Typography variant="h6" fontWeight={700} color={ACCENT}>
                Analizando documento...
              </Typography>
              <Box sx={{ textAlign: 'center', color: '#64748B', fontSize: '0.85rem', lineHeight: 1.8 }}>
                <Typography component="div" sx={{ mb: 0.5 }}>
                  • Formato correcto (PDF/DOCX)
                </Typography>
                <Typography component="div" sx={{ mb: 0.5 }}>
                  • Mínimo 5 páginas
                </Typography>
                <Typography component="div" sx={{ mb: 0.5 }}>
                  • Contenido sustancial (500+ palabras)
                </Typography>
                <Typography component="div">• No duplicado</Typography>
              </Box>
            </Box>
          )}

          {/* ── RESULTADO ── */}
          {resultadoVerificacion && !verificando && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
                gap: 2.5,
              }}
            >
              {resultadoVerificacion.estado === 'aprobado' ? (
                <CheckCircleIcon sx={{ fontSize: 64, color: '#059669' }} />
              ) : (
                <CancelIcon sx={{ fontSize: 64, color: '#DC2626' }} />
              )}

              <Typography
                variant="h6"
                fontWeight={700}
                color={
                  resultadoVerificacion.estado === 'aprobado' ? '#059669' : '#DC2626'
                }
              >
                {resultadoVerificacion.estado === 'aprobado'
                  ? '¡Aporte Aprobado!'
                  : 'Aporte Rechazado'}
              </Typography>

              <Typography
                sx={{ textAlign: 'center', color: '#475569', fontSize: '0.95rem', maxWidth: 400 }}
              >
                {resultadoVerificacion.mensaje}
              </Typography>

              {/* Tokens para externos */}
              {!isAuthenticated && resultadoVerificacion.tokens?.length > 0 && (
                <Box
                  sx={{
                    width: '100%',
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: '#F5F3FF',
                    border: '2px dashed #C4B5FD',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      color: ACCENT,
                      textTransform: 'uppercase',
                      mb: 1.5,
                    }}
                  >
                    Tu código de acceso
                  </Typography>

                  {resultadoVerificacion.tokens.map((t, i) => (
                    <Typography
                      key={i}
                      variant="h5"
                      fontFamily="monospace"
                      fontWeight={700}
                      sx={{
                        letterSpacing: 3,
                        userSelect: 'all',
                        cursor: 'pointer',
                        bgcolor: '#fff',
                        p: 1.5,
                        borderRadius: 1.5,
                        mb: 1,
                        color: '#1E293B',
                        border: '1px solid #E2E8F0',
                        fontSize: '1.4rem',
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(t.token);
                        alert('¡Código copiado al portapapeles!');
                      }}
                    >
                      {t.token}
                    </Typography>
                  ))}

                  <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 1 }}>
                    Tienes 2 descargas con este código. Úsalo en cualquier documento.
                  </Typography>
                </Box>
              )}

              {isAuthenticated && (
                <Typography sx={{ fontSize: '0.85rem', color: '#64748B', textAlign: 'center' }}>
                  Tus 2 créditos se han añadido a tu cuenta. Ve a <strong>Mi Biblioteca</strong> para usarlos.
                </Typography>
              )}
            </Box>
          )}

          {/* ── FORMULARIO ── */}
          {!verificando && !resultadoVerificacion && (
            <Box component="form" onSubmit={handleSubmitAporte} sx={{ mt: 0.5 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.85rem' }}>
                  {error}
                </Alert>
              )}

              <Typography sx={{ fontSize: '0.85rem', color: '#64748B', mb: 2.5, lineHeight: 1.6 }}>
                Al aprobarse tu aporte, recibirás{' '}
                <strong style={{ color: ACCENT }}>2 créditos de descarga</strong> válidos para
                cualquier documento de la biblioteca.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Nombre completo"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Institución"
                  name="institucion"
                  value={formData.institucion}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Grado académico"
                  name="grado_academico"
                  value={formData.grado_academico}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Título del documento"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Descripción"
                  name="descripcion"
                  multiline
                  rows={3}
                  value={formData.descripcion}
                  onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />

                {/* Input de archivo estilizado */}
                <Box sx={{ mt: 0.5 }}>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="aporte-file-input"
                  />
                  <label htmlFor="aporte-file-input">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      sx={{
                        py: 1.2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        color: formData.archivo ? '#059669' : '#64748B',
                        borderColor: formData.archivo ? '#A7F3D0' : '#E2E8F0',
                        bgcolor: formData.archivo ? '#ECFDF5' : '#F8FAFC',
                        borderStyle: 'dashed',
                        justifyContent: 'flex-start',
                        '&:hover': {
                          borderColor: ACCENT,
                          bgcolor: `${ACCENT}08`,
                        },
                      }}
                    >
                      <CloudUploadIcon sx={{ mr: 1, fontSize: 18 }} />
                      {formData.archivo
                        ? `Archivo: ${formData.archivo.name}`
                        : 'Seleccionar archivo (PDF / DOCX)'}
                    </Button>
                  </label>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderTop: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC',
            gap: 1,
          }}
        >
          {!verificando && (
            <Button
              onClick={() => {
                setModalAporteOpen(false);
                setResultadoVerificacion(null);
                setError('');
              }}
              disabled={loading}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: '#64748B',
                borderRadius: 2,
                px: 2,
              }}
            >
              {resultadoVerificacion ? 'Cerrar' : 'Cancelar'}
            </Button>
          )}

          {!verificando && !resultadoVerificacion && (
            <Button
              onClick={handleSubmitAporte}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : null}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                bgcolor: ACCENT,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#4338CA', boxShadow: 'none' },
                '&:disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' },
              }}
            >
              {loading ? 'Enviando...' : 'Enviar aporte'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}