"""
Modelos de operaciones: visualizaciones, prestamos y notificaciones.
"""
from django.db import models
from django.conf import settings

from .catalogo import MaterialBibliografico, Libro


class HistorialVisualizacion(models.Model):
    """
    Registro de visualizaciones de materiales bibliograficos.
    Solo para usuarios internos identificados.
    """
    material = models.ForeignKey(
        MaterialBibliografico,
        on_delete=models.CASCADE,
        related_name='historial_visualizaciones'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='historial_visualizaciones'
    )
    fecha_visualizacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Historial de Visualizacion'
        verbose_name_plural = 'Historial de Visualizaciones'
        ordering = ['-fecha_visualizacion']


class SolicitudPrestamo(models.Model):
    """
    Solicitudes de prestamo de libros fisicos.
    Solo para usuarios internos.
    """
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('aprobada', 'Aprobada'),
        ('devuelta', 'Devuelta'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='solicitudes_prestamo'
    )
    libro = models.ForeignKey(
        Libro,
        on_delete=models.CASCADE,
        related_name='solicitudes_prestamo'
    )
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    fecha_devolucion = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Solicitud de Prestamo'
        verbose_name_plural = 'Solicitudes de Prestamo'
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"{self.usuario.email} -> {self.libro.titulo} ({self.estado})"


class Notificacion(models.Model):
    """
    Sistema de notificaciones para usuarios.
    """
    TIPOS_DESTINATARIO = [
        ('usuario', 'Usuario'),
        ('rol', 'Rol'),
    ]

    TIPOS_ORIGEN = [
        ('aporte', 'Aporte'),
        ('prestamo', 'Prestamo'),
    ]

    destinatario_tipo = models.CharField(max_length=20, choices=TIPOS_DESTINATARIO)
    destinatario_id = models.PositiveIntegerField()
    origen_tipo = models.CharField(max_length=20, choices=TIPOS_ORIGEN)
    origen_id = models.PositiveIntegerField()
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Notificacion'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notificacion para {self.destinatario_tipo} {self.destinatario_id}"