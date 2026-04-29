"""Vista para roles."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from biblioteca.models import Rol
from biblioteca.serializers import RolSerializer
from biblioteca.permissions import CanManageUsers


class RolViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de roles del sistema."""

    queryset = Rol.objects.all()
    serializer_class = RolSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [CanManageUsers()]
        return [IsAuthenticated()]
