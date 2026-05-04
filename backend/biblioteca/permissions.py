"""Permisos personalizados para la Biblioteca Virtual."""

from rest_framework import permissions


ADMIN_ROLE = 'Administrador'


class BaseRolePermission(permissions.BasePermission):
    def _get_user_role(self, user):
        if hasattr(user, 'perfil') and user.perfil.rol:
            return user.perfil.rol.nombre
        return None

    def _is_administrador(self, user):
        return bool(
            getattr(user, 'is_authenticated', False) and
            self._get_user_role(user) == ADMIN_ROLE
        )


class IsAdministrador(BaseRolePermission):
    message = 'Solo el Administrador puede realizar esta accion.'

    def has_permission(self, request, view):
        return self._is_administrador(request.user)


class IsAdministradorOrReadOnly(BaseRolePermission):
    message = 'Se requiere rol de Administrador para modificar este recurso.'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return self._is_administrador(request.user)


class CanManageUsers(BaseRolePermission):
    message = 'No tiene permisos para gestionar usuarios.'

    def has_permission(self, request, view):
        return self._is_administrador(request.user)


class IsOwnerOrAdmin(BaseRolePermission):
    message = 'Solo puede acceder a sus propios recursos.'

    def has_object_permission(self, request, view, obj):
        if self._is_administrador(request.user):
            return True

        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user

        return False


class CanDeleteContent(BaseRolePermission):
    message = 'Solo el Administrador puede eliminar este contenido.'

    def has_permission(self, request, view):
        if request.method != 'DELETE':
            return True

        return self._is_administrador(request.user)


class IsAuthenticatedForChat(BaseRolePermission):
    """
    Permiso específico para el chat IA con PDFs.

    Requiere autenticación para usar el endpoint chat_ia.
    Previene acceso anónimo a recursos costosos (API de Gemini).
    """

    message = 'Debe iniciar sesión para usar el chat con IA.'

    def has_permission(self, request, view):
        return request.user.is_authenticated
