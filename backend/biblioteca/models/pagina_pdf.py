from django.db import models


class PaginaPDF(models.Model):
    material = models.ForeignKey(
        'biblioteca.MaterialBibliografico',
        on_delete=models.CASCADE,
        related_name='paginas'
    )
    numero = models.PositiveIntegerField()
    imagen = models.ImageField(upload_to='paginas_pdf/%Y/%m/')

    class Meta:
        ordering = ['numero']
        unique_together = ['material', 'numero']

    def __str__(self):
        return f"Pagina {self.numero} - {self.material.titulo}"