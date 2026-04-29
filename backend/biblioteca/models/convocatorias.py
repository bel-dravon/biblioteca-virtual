"""
Modelo de convocatorias.
"""
from django.db import models


class Convocatoria(models.Model):
    """
    Convocatorias para presentación de trabajos de investigación.

    Gestiona eventos y períodos de recepción de nuevos trabajos
    académicos en la biblioteca.

    Attributes:
        titulo: Título de la convocatoria.
        tipo: Tipo de convocatoria (tesis, artículos, etc).
        descripcion: Descripción detallada.
        requisitos: Requisitos para participar.
        fecha_inicio: Fecha de apertura.
        fecha_fin: Fecha de cierre.
        estado: Estado actual de la convocatoria.
    """

    ESTADOS_CONV = [
        ('activo', 'Activo'),
        ('cerrado', 'Cerrado'),
        ('proximo', 'Próximo'),
    ]

    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=50)
    descripcion = models.TextField()
    requisitos = models.TextField(blank=True, null=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADOS_CONV, default='activo')
    imagen_adjunta = models.ImageField(upload_to='convocatorias/imagenes/', null=True, blank=True)
    documento_adjunto = models.FileField(upload_to='convocatorias/documentos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Convocatoria'
        verbose_name_plural = 'Convocatorias'
        ordering = ['-fecha_inicio']

    def __str__(self) -> str:
        return str(self.titulo)
