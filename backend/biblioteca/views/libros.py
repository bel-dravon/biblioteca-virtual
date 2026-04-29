"""Vista de solo lectura para libros fisicos."""
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from biblioteca.models import Libro
from biblioteca.serializers import LibroSerializer


class LibroViewSet(viewsets.ReadOnlyModelViewSet):
    """Consulta de libros fisicos con filtros por titulo y palabra clave."""

    queryset = Libro.objects.prefetch_related('palabras_clave').all()
    serializer_class = LibroSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        filters = Q()

        if titulo := params.get('titulo'):
            filters &= Q(titulo__icontains=titulo)

        if palabra_clave := params.get('palabra_clave'):
            filters &= Q(palabras_clave__termino__icontains=palabra_clave)

        if palabra_clave_id := params.get('palabra_clave_id'):
            filters &= Q(palabras_clave__id=palabra_clave_id)

        return queryset.filter(filters).distinct()
