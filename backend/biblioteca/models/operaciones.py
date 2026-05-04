"""
Modelos de operaciones: visualizaciones.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

from .catalogo import TrabajoInvestigacion


class HistorialVisualizacion(models.Model):
    """
    Registro de visualizaciones de trabajos de investigación.

    Permite auditar quién y cuándo accedió a cada trabajo,
    útil para estadísticas y análisis de uso.

    Attributes:
        trabajo: Trabajo visualizado.
        usuario: Usuario que visualizó (puede ser null para anónimos).
        fecha_visualizacion: Fecha y hora del acceso.
        ip_origen: Dirección IP del cliente.
    """

    trabajo = models.ForeignKey(TrabajoInvestigacion, on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True)
    fecha_visualizacion = models.DateTimeField(default=timezone.now)
    ip_origen = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        verbose_name = 'Historial de Visualización'
        verbose_name_plural = 'Historial de Visualizaciones'
        ordering = ['-fecha_visualizacion']
