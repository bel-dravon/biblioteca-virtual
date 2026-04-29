"""
Modelos de operaciones: préstamos y visualizaciones.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

from .catalogo import TrabajoInvestigacion


class SolicitudPrestamo(models.Model):
    """
    Solicitud de préstamo o consulta de un trabajo de investigación.

    Gestiona el flujo de solicitudes de usuarios para acceder a
    materiales físicos o digitales de la biblioteca.

    Attributes:
        trabajo: Trabajo solicitado.
        usuario: Usuario que realiza la solicitud.
        tipo_solicitud: Tipo de acceso solicitado (consulta, préstamo).
        fecha_solicitud: Fecha y hora de la solicitud.
        estado: Estado actual de la solicitud.
    """

    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
        ('devuelto', 'Devuelto'),
    ]
    trabajo = models.ForeignKey(TrabajoInvestigacion, on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    tipo_solicitud = models.CharField(max_length=50, default='consulta')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')

    class Meta:
        verbose_name = 'Solicitud de Préstamo'
        verbose_name_plural = 'Solicitudes de Préstamo'
        ordering = ['-fecha_solicitud']


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
