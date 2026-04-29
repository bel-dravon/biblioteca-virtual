"""Vista para convocatorias."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from biblioteca.models import Convocatoria
from biblioteca.serializers import ConvocatoriaSerializer
from biblioteca.permissions import CanManageUsers


class ConvocatoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de convocatorias."""

    queryset = Convocatoria.objects.all().order_by('-fecha_inicio')
    serializer_class = ConvocatoriaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [CanManageUsers()]
        return [IsAuthenticatedOrReadOnly()]
