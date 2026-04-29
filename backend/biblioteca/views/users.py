"""Vista para usuarios."""
import logging

from rest_framework import viewsets, permissions, status
from django.contrib.auth.models import User
from biblioteca.serializers import UserSerializer
from biblioteca.permissions import CanManageUsers
from shared.response_helpers import api_error_response


logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de usuarios."""

    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [CanManageUsers()]

    def destroy(self, request, *args, **kwargs):
        user_to_delete = self.get_object()

        if user_to_delete == request.user:
            return api_error_response(
                message='No puedes eliminarte a ti mismo.',
                error_code='SELF_DELETE',
                http_status=status.HTTP_400_BAD_REQUEST
            )

        if user_to_delete.is_superuser:
            return api_error_response(
                message='No puedes eliminar un superusuario.',
                error_code='SUPERUSER_DELETE',
                http_status=status.HTTP_403_FORBIDDEN
            )

        logger.warning(f"Usuario {user_to_delete.username} eliminado por {request.user.username}")
        return super().destroy(request, *args, **kwargs)
