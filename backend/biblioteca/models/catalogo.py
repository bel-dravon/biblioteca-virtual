"""
Modelos del catálogo bibliográfico.
"""
from django.db import models
from django.core.files.base import ContentFile
from io import BytesIO
import os

from .auth import Perfil  # noqa: F401 — keep for potential cross-references

try:
    import fitz
    from PIL import Image
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
class PalabraClave(models.Model):
    """
    Modelo para palabras clave/descriptores de trabajos.

    Utilizadas para categorización y búsqueda de trabajos de investigación.

    Attributes:
        termino: Palabra o frase clave (única).
    """

    termino = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = 'Palabra Clave'
        verbose_name_plural = 'Palabras Clave'
        ordering = ['termino']

    def __str__(self):
        return self.termino


class Libro(models.Model):
    """Modelo para libros fisicos del inventario bibliografico."""

    titulo = models.CharField(max_length=255)
    autor = models.CharField(max_length=255)
    isbn = models.CharField(max_length=20, unique=True, null=True, blank=True)
    editorial = models.CharField(max_length=100, null=True, blank=True)
    anio_publicacion = models.PositiveIntegerField(null=True, blank=True)
    numero_edicion = models.PositiveSmallIntegerField(default=1)
    stock = models.PositiveIntegerField(default=1)
    palabras_clave = models.ManyToManyField(PalabraClave, blank=True)
    portada = models.ImageField(upload_to='portadas_libros/', null=True, blank=True)

    class Meta:
        verbose_name = 'Libro'
        verbose_name_plural = 'Libros'
        ordering = ['titulo', 'autor']

    def __str__(self):
        return self.titulo


class TrabajoInvestigacion(models.Model):
    """
    Modelo principal para trabajos de investigación académica.

    Representa tesis, artículos, libros y proyectos de grado almacenados
    en la biblioteca virtual. Incluye metadatos, archivo PDF y thumbnail.

    Attributes:
        titulo: Título del trabajo.
        resumen: Resumen o abstract del contenido.
        asesor_texto: Nombre del asesor o tutor en texto libre.
        fecha_publicacion: Fecha de publicación o defensa.
        archivo_ruta: Archivo PDF del trabajo completo.
        thumbnail: Imagen de portada generada automáticamente.
        tipo_material: Categoría del trabajo.

    Example:
        >>> trabajo = TrabajoInvestigacion.objects.create(
        ...     titulo='Sistema de Gestión Bibliotecaria',
        ...     resumen='Desarrollo de un sistema...',
        ...     tipo_material='tesis',
        ...     fecha_publicacion='2024-01-15'
        ... )
    """

    TIPO_CHOICES = [
        ('tesis', 'Tesis'),
        ('proyecto_grado', 'Proyecto de Grado'),
        ('trabajo_dirigido', 'Trabajo Dirigido'),
        ('monografia', 'Monografía'),
        ('libro', 'Libro'),
    ]
    titulo = models.CharField(max_length=500, db_index=True)
    resumen = models.TextField()
    contenido = models.TextField(blank=True, default="")
    autores_texto = models.TextField(blank=True, default='')
    asesor_texto = models.CharField(max_length=255, blank=True, default='')
    anio_publicacion = models.IntegerField(blank=True, null=True, db_index=True)
    archivo_ruta = models.FileField(upload_to='trabajos/', max_length=500, blank=True, null=True)
    thumbnail = models.ImageField(upload_to='thumbnails/', blank=True, null=True)

    tipo_material = models.CharField(max_length=50, choices=TIPO_CHOICES, db_index=True)
    especialidad = models.CharField(max_length=255, blank=True, null=True)

    tiene_archivo_digital = models.BooleanField(default=True)
    fuente_fisica = models.CharField(max_length=255, blank=True, null=True)
    signatura_topografica = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    palabras_clave = models.ManyToManyField(PalabraClave)

    class Meta:
        verbose_name = 'Trabajo de Investigación'
        verbose_name_plural = 'Trabajos de Investigación'
        ordering = ['-anio_publicacion', '-created_at']

    def __str__(self):
        return self.titulo

    def generate_thumbnail(self):
        if not PYMUPDF_AVAILABLE or not self.archivo_ruta:
            return False
        if not self.archivo_ruta.name.lower().endswith('.pdf'):
            return False

        try:
            if hasattr(self.archivo_ruta, 'path'):
                doc = fitz.open(self.archivo_ruta.path)
            else:
                self.archivo_ruta.open()
                doc = fitz.open(stream=self.archivo_ruta.read(), filetype="pdf")

            if doc.page_count == 0: return False

            page = doc[0]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # Redimensionar
            img.thumbnail((400, 600)) 
            
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            
            name = os.path.splitext(os.path.basename(self.archivo_ruta.name))[0]
            self.thumbnail.save(f"{name}_thumb.jpg", ContentFile(buffer.getvalue()), save=False)
            doc.close()
            return True
        except Exception as e:
            print(f"Error thumbnail: {e}")
            return False

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.archivo_ruta and not self.thumbnail:
            if self.generate_thumbnail():
                super().save(update_fields=['thumbnail'])

    # Nuevos campos para control de acceso
    permite_preview_publico = models.BooleanField(
        default=True,
        help_text="Si es True, usuarios no autenticados ven una versión limitada"
    )
    tipo_preview = models.CharField(
        max_length=20,
        choices=[('paginas', 'Número de páginas'), ('porcentaje', 'Porcentaje del texto')],
        default='paginas'
    )
    valor_preview = models.PositiveIntegerField(
        default=15,
        help_text="Número de páginas de preview para usuarios externos"
    )
