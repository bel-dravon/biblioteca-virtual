from django.db import models


class MaterialBibliografico(models.Model):
    """
    Modelo padre para todos los materiales bibliograficos.
    Libro y TrabajoInvestigacion heredan de este modelo (multi-table inheritance).
    """
    titulo = models.CharField(max_length=500, db_index=True)
    autor_texto = models.TextField()
    anio_publicacion = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    imagen_portada = models.ImageField(upload_to='portadas/', null=True, blank=True)
    resumen = models.TextField()
    signatura_topografica = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Material Bibliografico'
        verbose_name_plural = 'Materiales Bibliograficos'
        ordering = ['-created_at']

    def __str__(self):
        return self.titulo

    @property
    def es_reciente(self):
        from django.utils import timezone
        from datetime import timedelta
        return self.created_at >= timezone.now() - timedelta(days=7)


class PalabraClave(models.Model):
    termino = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = 'Palabra Clave'
        verbose_name_plural = 'Palabras Clave'

    def save(self, *args, **kwargs):
        self.termino = self.termino.strip().lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.termino


class MaterialBibliograficoPalabraClave(models.Model):
    material = models.ForeignKey(
        MaterialBibliografico,
        on_delete=models.CASCADE,
        related_name='relaciones_palabras_clave'
    )
    palabra_clave = models.ForeignKey(
        PalabraClave,
        on_delete=models.CASCADE,
        related_name='relaciones_materiales'
    )

    class Meta:
        unique_together = ['material', 'palabra_clave']
        verbose_name = 'Relacion Material - Palabra Clave'
        verbose_name_plural = 'Relaciones Material - Palabra Clave'


class Libro(MaterialBibliografico):
    """
    Hereda de MaterialBibliografico. La PK de Libro es FK a MaterialBibliografico.
    """
    isbn = models.CharField(max_length=20, unique=True, null=True, blank=True)
    editorial = models.CharField(max_length=100, null=True, blank=True)
    numero_edicion = models.PositiveSmallIntegerField(default=1)
    stock = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Libro'
        verbose_name_plural = 'Libros'


class TrabajoInvestigacion(MaterialBibliografico):
    """
    Hereda de MaterialBibliografico. La PK de TrabajoInvestigacion es FK a MaterialBibliografico.
    """
    contenido = models.TextField(blank=True)  # ← blank=True para no ser obligatorio en admin
    asesor_texto = models.CharField(max_length=255)
    archivo_ruta = models.FileField(upload_to='documentos/%Y/%m/', null=True, blank=True)
    tiene_archivo_digital = models.BooleanField(default=False)
    especialidad = models.CharField(max_length=255, null=True, blank=True)
    fuente_fisica = models.CharField(max_length=255, null=True, blank=True)
    permite_preview_publico = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Trabajo de Investigacion'
        verbose_name_plural = 'Trabajos de Investigacion'