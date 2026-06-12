from django.db import models


class PaginaPDF(models.Model):
    trabajo = models.ForeignKey(
        'TrabajoInvestigacion',
        on_delete=models.CASCADE,
        related_name='paginas'
    )
    numero = models.PositiveIntegerField()
    imagen = models.ImageField(upload_to='paginas_pdf/%Y/%m/')

    class Meta:
        ordering = ['numero']
        unique_together = ['trabajo', 'numero']

    def __str__(self):
        return f"Página {self.numero} - {self.trabajo.titulo}"