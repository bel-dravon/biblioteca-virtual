"""Vista para perfiles."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from biblioteca.models import Perfil
from biblioteca.serializers import PerfilSerializer
from biblioteca.permissions import CanManageUsers


class PerfilViewSet(viewsets.ModelViewSet):
    """ViewSet para gestion de perfiles de usuario."""

    queryset = Perfil.objects.select_related('usuario', 'rol')
    serializer_class = PerfilSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [CanManageUsers()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Perfil.objects.select_related('usuario', 'rol').all()
        if hasattr(user, 'perfil') and user.perfil.rol.puede_gestionar_usuarios:
            return Perfil.objects.select_related('usuario', 'rol').all()
        return Perfil.objects.filter(usuario=user)