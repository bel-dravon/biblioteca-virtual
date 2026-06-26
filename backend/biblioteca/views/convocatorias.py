from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from biblioteca.models import Convocatoria, HistorialEstadoConvocatoria
from biblioteca.serializers import ConvocatoriaSerializer, HistorialEstadoConvocatoriaSerializer


class ConvocatoriaViewSet(viewsets.ModelViewSet):
    queryset = Convocatoria.objects.all()
    serializer_class = ConvocatoriaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado']
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'created_at']
    ordering = ['-fecha_inicio']

    def get_queryset(self):
        user = self.request.user
        queryset = Convocatoria.objects.all()

        # Solo administradores ven convocatorias ocultas
        if not user.is_authenticated:
            return queryset.exclude(estado='oculta')

        if not (user.is_staff or (hasattr(user, 'perfil') and user.perfil.es_administrador())):
            return queryset.exclude(estado='oculta')

        return queryset


class HistorialEstadoConvocatoriaViewSet(viewsets.ReadOnlyModelViewSet):
    # Sin select_related para evitar el bug del cursor
    queryset = HistorialEstadoConvocatoria.objects.all()
    serializer_class = HistorialEstadoConvocatoriaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['convocatoria']