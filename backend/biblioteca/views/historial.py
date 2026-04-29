"""Vista para historial de visualizaciones."""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from biblioteca.models import HistorialVisualizacion
from biblioteca.serializers import HistorialVisualizacionSerializer
from biblioteca.filters import HistorialVisualizacionFilter


class HistorialVisualizacionViewSet(viewsets.ModelViewSet):
    """ViewSet para historial de visualizaciones."""

    queryset = HistorialVisualizacion.objects.select_related('trabajo', 'usuario')
    serializer_class = HistorialVisualizacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = HistorialVisualizacionFilter

    def get_queryset(self):
        return HistorialVisualizacion.objects.select_related(
            'trabajo', 'usuario'
        ).filter(usuario=self.request.user).order_by('-fecha_visualizacion')

    def perform_create(self, serializer):
        ip = self.request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
        if not ip:
            ip = self.request.META.get('REMOTE_ADDR')

        serializer.save(
            usuario=self.request.user,
            ip_origen=ip or None
        )
