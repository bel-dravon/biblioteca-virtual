"""Serializador para perfiles."""
from rest_framework import serializers

from biblioteca.models import Rol, Perfil, User
from .auth import UserSerializer
from .roles import RolSerializer


class PerfilSerializer(serializers.ModelSerializer):
    """Serializador para el modelo Perfil."""

    usuario = UserSerializer(read_only=True)
    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='usuario',
        write_only=True,
        required=False
    )
    rol = RolSerializer(read_only=True)
    rol_id = serializers.PrimaryKeyRelatedField(
        queryset=Rol.objects.all(),
        source='rol',
        write_only=True,
        required=False
    )

    class Meta:
        model = Perfil
        fields = ['usuario', 'usuario_id', 'rol', 'rol_id']
        read_only_fields = ['usuario']