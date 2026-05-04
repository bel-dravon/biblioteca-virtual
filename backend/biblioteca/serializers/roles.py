"""Serializador para roles."""
from rest_framework import serializers
from biblioteca.models import Rol


class RolSerializer(serializers.ModelSerializer):
    """Serializador para el modelo Rol."""

    class Meta:
        model = Rol
        fields = [
            'id', 'nombre', 'descripcion',
            'puede_gestionar_usuarios', 'puede_eliminar_contenido',
            'puede_ver_estadisticas'
        ]
        read_only_fields = ['id']
