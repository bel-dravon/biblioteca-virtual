"""Vista para historial de visualizaciones."""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from biblioteca.models import HistorialVisualizacion
from biblioteca.serializers import HistorialVisualizacionSerializer


class HistorialVisualizacionViewSet(viewsets.ModelViewSet):
    """ViewSet para historial de visualizaciones."""

    queryset = HistorialVisualizacion.objects.select_related('material', 'usuario')
    serializer_class = HistorialVisualizacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]

    def get_queryset(self):
        return HistorialVisualizacion.objects.select_related(
            'material', 'usuario'
        ).filter(usuario=self.request.user).order_by('-fecha_visualizacion')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)