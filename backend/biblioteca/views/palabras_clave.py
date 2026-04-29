"""Vista para palabras clave."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from biblioteca.models import PalabraClave
from biblioteca.serializers import PalabraClaveSerializer
from biblioteca.permissions import CanDeleteContent, CanManageUsers


class PalabraClaveViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de palabras clave."""

    queryset = PalabraClave.objects.all()
    serializer_class = PalabraClaveSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [CanManageUsers(), CanDeleteContent()]
        if self.action in ['create', 'update', 'partial_update']:
            return [CanManageUsers()]
        return [IsAuthenticatedOrReadOnly()]
