import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Alert, CircularProgress,
    Typography
} from '@mui/material';
import { aportesService } from '../api/aportes';
import { useAuth } from '../context/AuthContext';

export default function FormularioAporte({ open, onClose, onSuccess }) {
    const { user, isAuthenticated } = useAuth();

    const [formData, setFormData] = useState({
        nombre_completo: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
        email: user?.email || '',
        institucion: '',
        grado_academico: '',
        titulo: '',
        descripcion: '',
        archivo: null
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, archivo: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        // Validaciones básicas
        if (!formData.archivo) {
            setError('Debes seleccionar un archivo PDF o DOCX.');
            setLoading(false);
            return;
        }

        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(formData.archivo.type)) {
            setError('Solo se permiten archivos PDF o DOCX.');
            setLoading(false);
            return;
        }

        try {
            await aportesService.create(formData);
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 2000);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al enviar el aporte. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Aportar Documento</DialogTitle>

            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            ¡Aporte enviado! Será revisado por un administrador. Recibirás 3 descargas si es aprobado.
                        </Alert>
                    )}

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Los campos con * son obligatorios. Al aprobarse tu aporte, recibirás 3 créditos de descarga.
                    </Typography>

                    <TextField
                        fullWidth required margin="normal"
                        label="Nombre Completo"
                        name="nombre_completo"
                        value={formData.nombre_completo}
                        onChange={handleChange}
                    />

                    <TextField
                        fullWidth required margin="normal"
                        label="Correo Electrónico"
                        name="email" type="email"
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <TextField
                        fullWidth margin="normal"
                        label="Institución"
                        name="institucion"
                        value={formData.institucion}
                        onChange={handleChange}
                    />

                    <TextField
                        fullWidth margin="normal"
                        label="Grado Académico"
                        name="grado_academico"
                        value={formData.grado_academico}
                        onChange={handleChange}
                    />

                    <TextField
                        fullWidth required margin="normal"
                        label="Título del Documento"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                    />

                    <TextField
                        fullWidth required margin="normal"
                        label="Descripción"
                        name="descripcion"
                        multiline rows={3}
                        value={formData.descripcion}
                        onChange={handleChange}
                    />

                    <Box sx={{ mt: 2, mb: 1 }}>
                        <input
                            type="file"
                            accept=".pdf,.docx"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="aporte-file-input"
                        />
                        <label htmlFor="aporte-file-input">
                            <Button variant="outlined" component="span">
                                {formData.archivo ? `Archivo: ${formData.archivo.name}` : 'Seleccionar archivo (PDF/DOCX)'}
                            </Button>
                        </label>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    {loading ? 'Enviando...' : 'Enviar Aporte'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}