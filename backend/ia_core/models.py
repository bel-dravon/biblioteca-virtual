from django.contrib.postgres.fields import ArrayField
from django.db import models

from biblioteca.models import TrabajoInvestigacion

EMBEDDING_DIMENSIONS = 768

try:
    from pgvector.django import VectorField
    PGVECTOR_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    VectorField = None
    PGVECTOR_AVAILABLE = False


class ThesisEmbedding(models.Model):
    """
    Stores embeddings for thesis-level retrieval and analytics.

    Uses pgvector when available, otherwise falls back to ArrayField.
    """

    trabajo = models.OneToOneField(
        TrabajoInvestigacion,
        on_delete=models.CASCADE,
        related_name="ia_embedding",
    )
    if PGVECTOR_AVAILABLE:
        embedding = VectorField(dimensions=EMBEDDING_DIMENSIONS)
    else:
        embedding = ArrayField(models.FloatField(), size=EMBEDDING_DIMENSIONS)
    embedding_model = models.CharField(
        max_length=100,
        default="models/text-embedding-004",
    )
    indexed_text = models.TextField(blank=True, default="")
    metadata = models.JSONField(blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Thesis Embedding"
        verbose_name_plural = "Thesis Embeddings"
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"Embedding {self.trabajo_id}"
