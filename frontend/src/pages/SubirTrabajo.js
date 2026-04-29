import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import { palabrasClaveService, trabajosService } from '../api';

const MAX_PDF_SIZE_MB = 200;

const INITIAL_FORM = {
  titulo: '',
  resumen: '',
  tipo_material: 'tesis',
  anio_publicacion: new Date().getFullYear(),
  especialidad: '',
  signatura_topografica: '',
  fuente_fisica: '',
  autores_texto: '',
  asesor_texto: '',
};

export default function SubirTrabajo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [palabrasClaveDisponibles, setPalabrasClaveDisponibles] = useState([]);
  const [palabrasClaveSeleccionadas, setPalabrasClaveSeleccionadas] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setInitialLoading(true);
        const [palabrasRes, trabajoRes] = await Promise.all([
          palabrasClaveService.getAll(),
          isEditMode ? trabajosService.getById(id) : Promise.resolve(null),
        ]);

        const palabrasList = Array.isArray(palabrasRes) ? palabrasRes : palabrasRes.results || [];

        setPalabrasClaveDisponibles(palabrasList);

        if (trabajoRes) {
          setFormData({
            titulo: trabajoRes.titulo || '',
            resumen: trabajoRes.resumen || '',
            tipo_material: trabajoRes.tipo_material || 'tesis',
            anio_publicacion: trabajoRes.anio_publicacion || new Date().getFullYear(),
            especialidad: trabajoRes.especialidad || '',
            signatura_topografica: trabajoRes.signatura_topografica || '',
            fuente_fisica: trabajoRes.fuente_fisica || '',
            autores_texto: trabajoRes.autores_texto || '',
            asesor_texto: trabajoRes.asesor_texto || '',
          });
          setPalabrasClaveSeleccionadas(Array.isArray(trabajoRes.palabras_clave) ? trabajoRes.palabras_clave : []);
        }
      } catch (err) {
        console.error('Error cargando formulario de trabajo:', err);
        setError('No se pudieron cargar los datos del formulario.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [id, isEditMode]);

  const autoresPreview = useMemo(
    () => String(formData.autores_texto || '').split(',').map((item) => item.trim()).filter(Boolean),
    [formData.autores_texto]
  );

  const keywordsPreview = useMemo(
    () => palabrasClaveSeleccionadas.map((palabra) => palabra?.termino).filter(Boolean),
    [palabrasClaveSeleccionadas]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files && event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFieldErrors((prev) => ({ ...prev, archivo_ruta: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (formData.titulo.trim().length < 10) {
      nextErrors.titulo = 'El titulo debe tener al menos 10 caracteres.';
    }

    if (formData.resumen.trim().length < 50) {
      nextErrors.resumen = 'El resumen debe tener al menos 50 caracteres.';
    }

    if (!formData.autores_texto.trim()) {
      nextErrors.autores_texto = 'Debes registrar al menos un autor.';
    }

    const anio = Number(formData.anio_publicacion);
    if (!Number.isInteger(anio) || anio < 1900 || anio > 2100) {
      nextErrors.anio_publicacion = 'Ingresa un anio valido entre 1900 y 2100.';
    }

    if (!isEditMode && !file) {
      nextErrors.archivo_ruta = 'Debes seleccionar un archivo PDF.';
    }

    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        nextErrors.archivo_ruta = 'Solo se permiten archivos PDF.';
      }
      if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
        nextErrors.archivo_ruta = `El archivo no puede superar los ${MAX_PDF_SIZE_MB}MB.`;
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildCreatePayload = () => {
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        data.append(key, value);
      }
    });

    data.append('archivo_ruta', file);
    data.append('palabras_clave_manual', JSON.stringify(
      palabrasClaveSeleccionadas.map((palabra) => palabra.termino).filter(Boolean)
    ));

    return data;
  };

  const buildEditPayload = () => ({
    ...formData,
    anio_publicacion: Number(formData.anio_publicacion),
    palabras_clave: palabrasClaveSeleccionadas.map((palabra) => palabra.id),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isEditMode) {
        await trabajosService.update(id, buildEditPayload());
        setSuccess('Trabajo actualizado exitosamente.');
        setTimeout(() => navigate('/admin/trabajos'), 1500);
      } else {
        await trabajosService.create(buildCreatePayload());
        setSuccess('Trabajo subido exitosamente.');
        setTimeout(() => navigate('/admin/trabajos'), 1500);
      }
    } catch (err) {
      console.error('Error guardando trabajo:', err);
      let mensajeError = isEditMode ? 'Error al actualizar el trabajo.' : 'Error al subir el trabajo.';

      if (err.errors && typeof err.errors === 'object') {
        const detalles = Object.entries(err.errors)
          .map(([campo, detalle]) => `${campo}: ${Array.isArray(detalle) ? detalle.join(', ') : detalle}`)
          .join(' | ');
        mensajeError = `Error del servidor: ${detalles}`;
      } else if (err.message) {
        mensajeError = err.message;
      }

      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
          {isEditMode ? 'Editar Trabajo' : 'Gestion de Acervo'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {isEditMode
            ? 'Actualiza los metadatos del trabajo usando texto libre para autores y asesor.'
            : 'Registra manualmente los metadatos del trabajo y adjunta su PDF definitivo.'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            1. Informacion General
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <TextField required fullWidth label="Titulo del Trabajo" name="titulo" value={formData.titulo} onChange={handleChange} error={Boolean(fieldErrors.titulo)} helperText={fieldErrors.titulo || 'Minimo 10 caracteres.'} />
            </Grid>
            <Grid item xs={12}>
              <TextField required fullWidth multiline rows={4} label="Resumen" name="resumen" value={formData.resumen} onChange={handleChange} error={Boolean(fieldErrors.resumen)} helperText={fieldErrors.resumen || 'Describe el contenido principal en al menos 50 caracteres.'} />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 4 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            2. Metadatos Bibliograficos
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Material</InputLabel>
                <Select name="tipo_material" value={formData.tipo_material} label="Tipo de Material" onChange={handleChange}>
                  <MenuItem value="tesis">Tesis</MenuItem>
                  <MenuItem value="proyecto_grado">Proyecto de Grado</MenuItem>
                  <MenuItem value="trabajo_dirigido">Trabajo Dirigido</MenuItem>
                  <MenuItem value="monografia">Monografia</MenuItem>
                  <MenuItem value="libro">Libro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField required fullWidth type="number" label="Anio de Publicacion" name="anio_publicacion" value={formData.anio_publicacion} onChange={handleChange} error={Boolean(fieldErrors.anio_publicacion)} helperText={fieldErrors.anio_publicacion || 'Usa solo el anio, por ejemplo 2024.'} inputProps={{ min: 1900, max: 2100 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Especialidad" name="especialidad" value={formData.especialidad} onChange={handleChange} helperText="Opcional. Ejemplo: Redes, Software, Bases de Datos." />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Signatura Topografica" name="signatura_topografica" value={formData.signatura_topografica} onChange={handleChange} helperText="Opcional. Ejemplo: 005.1 P45s" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Ubicacion Fisica" name="fuente_fisica" value={formData.fuente_fisica} onChange={handleChange} helperText="Opcional. Ejemplo: Estante B-4." />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                minRows={2}
                label="Autores"
                name="autores_texto"
                value={formData.autores_texto || ''}
                onChange={handleChange}
                error={Boolean(fieldErrors.autores_texto)}
                helperText={fieldErrors.autores_texto || 'Escribe los nombres de los autores separados por comas.'}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={palabrasClaveDisponibles}
                value={palabrasClaveSeleccionadas}
                onChange={(_, value) => setPalabrasClaveSeleccionadas(value)}
                getOptionLabel={(option) => option.termino || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderTags={(value, getTagProps) => value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return <Chip key={key} label={option.termino} {...tagProps} />;
                })}
                renderInput={(params) => <TextField {...params} label="Palabras Clave" helperText="Opcional. Selecciona palabras clave existentes." />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Asesor o Tutor"
                name="asesor_texto"
                value={formData.asesor_texto || ''}
                onChange={handleChange}
                helperText="Opcional. Escribe el nombre del asesor o tutor." 
              />
            </Grid>
          </Grid>

          {(autoresPreview.length > 0 || keywordsPreview.length > 0) && (
            <Alert severity="info" sx={{ mb: 4 }}>
              {autoresPreview.length > 0 ? `Autores seleccionados: ${autoresPreview.join(', ')}.` : 'Sin autores seleccionados.'}
              {keywordsPreview.length > 0 ? ` Palabras clave: ${keywordsPreview.join(', ')}.` : ''}
              {formData.asesor_texto ? ` Asesor: ${formData.asesor_texto}.` : ''}
            </Alert>
          )}

          {!isEditMode && (
            <>
              <Divider sx={{ mb: 4 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                3. Archivo Digital
              </Typography>
              <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 4, textAlign: 'center', bgcolor: '#fafafa' }}>
                <input accept="application/pdf" style={{ display: 'none' }} id="raised-button-file" type="file" onChange={handleFileChange} />
                <label htmlFor="raised-button-file">
                  <Button variant="contained" component="span" startIcon={<CloudUploadIcon />} sx={{ mb: 2 }}>
                    Seleccionar PDF
                  </Button>
                </label>
                {file ? (
                  <Typography variant="body1" color="success.main" fontWeight="bold">Archivo: {file.name}</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">Sube el PDF definitivo del trabajo.</Typography>
                )}
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                  Solo PDF. Tamano maximo: {MAX_PDF_SIZE_MB}MB.
                </Typography>
                {fieldErrors.archivo_ruta && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{fieldErrors.archivo_ruta}</Typography>}
              </Box>
            </>
          )}

          <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" size="large" disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}>
              {loading ? (isEditMode ? 'Guardando...' : 'Subiendo...') : (isEditMode ? 'Guardar Cambios' : 'Publicar Trabajo')}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
