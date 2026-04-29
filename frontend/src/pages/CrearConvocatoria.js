import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, TextField, Button, MenuItem, Grid, Snackbar, Alert } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import { convocatoriasService } from '../api'; 
export default function CrearConvocatoria() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titulo: '', tipo: 'Beca', descripcion: '', requisitos: '',
    fecha_inicio: '', fecha_fin: '', estado: 'activo'
  });
  const [imagenAdjunta, setImagenAdjunta] = useState(null);
  const [documentoAdjunto, setDocumentoAdjunto] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      if (imagenAdjunta) payload.append('imagen_adjunta', imagenAdjunta);
      if (documentoAdjunto) payload.append('documento_adjunto', documentoAdjunto);

      await convocatoriasService.create(payload);
      setSnackbar({ open: true, message: 'Convocatoria creada exitosamente', severity: 'success' });
      setTimeout(() => navigate('/convocatorias'), 1500);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al crear convocatoria', severity: 'error' });
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (event) => {
    const { name, files } = event.target;
    const selectedFile = files && files[0] ? files[0] : null;
    if (name === 'imagen_adjunta') setImagenAdjunta(selectedFile);
    if (name === 'documento_adjunto') setDocumentoAdjunto(selectedFile);
  };

  const clearSelectedFile = (fieldName) => {
    if (fieldName === 'imagen_adjunta') setImagenAdjunta(null);
    if (fieldName === 'documento_adjunto') setDocumentoAdjunto(null);
  };

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight="bold" gutterBottom>Nueva Convocatoria</Typography>
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Título" name="titulo" onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Tipo" name="tipo" value={formData.tipo} onChange={handleChange}>
                <MenuItem value="Beca">Beca</MenuItem>
                <MenuItem value="Evento">Evento</MenuItem>
                <MenuItem value="Concurso">Concurso</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Estado" name="estado" value={formData.estado} onChange={handleChange}>
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="proximo">Próximo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Inicio" name="fecha_inicio" InputLabelProps={{shrink: true}} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Cierre" name="fecha_fin" InputLabelProps={{shrink: true}} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Descripción" name="descripcion" onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Requisitos" name="requisitos" placeholder="- Ser estudiante regular..." onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
                <input id="imagen-adjunta" name="imagen_adjunta" type="file" accept="image/*" hidden onChange={handleFileChange} />
                <label htmlFor="imagen-adjunta" style={{ flex: 1 }}>
                  <Button component="span" fullWidth variant="outlined" startIcon={<ImageIcon />} sx={{ py: 1.4 }}>
                    {imagenAdjunta ? `Imagen: ${imagenAdjunta.name}` : 'Adjuntar Imagen'}
                  </Button>
                </label>
                {imagenAdjunta && (
                  <Button variant="text" color="inherit" startIcon={<CloseIcon />} onClick={() => clearSelectedFile('imagen_adjunta')} sx={{ minWidth: 'auto', px: 1.5 }}>
                    Quitar
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
                <input id="documento-adjunto" name="documento_adjunto" type="file" hidden onChange={handleFileChange} />
                <label htmlFor="documento-adjunto" style={{ flex: 1 }}>
                  <Button component="span" fullWidth variant="outlined" startIcon={<AttachFileIcon />} sx={{ py: 1.4 }}>
                    {documentoAdjunto ? `Documento: ${documentoAdjunto.name}` : 'Adjuntar Documento'}
                  </Button>
                </label>
                {documentoAdjunto && (
                  <Button variant="text" color="inherit" startIcon={<CloseIcon />} onClick={() => clearSelectedFile('documento_adjunto')} sx={{ minWidth: 'auto', px: 1.5 }}>
                    Quitar
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" size="large" fullWidth>Publicar Convocatoria</Button>
            </Grid>
          </Grid>
        </Paper>
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
