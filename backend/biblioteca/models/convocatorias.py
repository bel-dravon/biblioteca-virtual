"""
Modelo de convocatorias.
"""
from django.db import models


class Convocatoria(models.Model):
    """
    Convocatorias para presentacion de trabajos de investigacion.
    """
    ESTADOS_CONV = [
        ('vigente', 'Vigente'),
        ('en_gracia', 'En Gracia'),
        ('oculta', 'Oculta'),
    ]

    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    requisitos = models.TextField(blank=True, null=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADOS_CONV, default='vigente')
    imagen_adjunta = models.ImageField(upload_to='convocatorias/imagenes/', null=True, blank=True)
    documento_adjunto = models.FileField(upload_to='convocatorias/documentos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Convocatoria'
        verbose_name_plural = 'Convocatorias'
        ordering = ['-fecha_inicio']

    def __str__(self) -> str:
        return str(self.titulo)


class HistorialEstadoConvocatoria(models.Model):
    """
    Registro de cambios de estado de una convocatoria.
    """
    convocatoria = models.ForeignKey(
        Convocatoria,
        on_delete=models.CASCADE,
        related_name='historial_estados'
    )
    estado_anterior = models.CharField(max_length=20, null=True, blank=True)
    estado_nuevo = models.CharField(max_length=20)
    fecha_cambio = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Historial de Estado'
        verbose_name_plural = 'Historial de Estados'
        ordering = ['-fecha_cambio']

    def __str__(self):
        return f"{self.convocatoria.titulo}: {self.estado_anterior} -> {self.estado_nuevo}"