"""Serializador para palabras clave."""
from rest_framework import serializers
from biblioteca.models import PalabraClave


class PalabraClaveSerializer(serializers.ModelSerializer):
    """Serializador para el modelo PalabraClave."""

    class Meta:
        model = PalabraClave
        fields = ['id', 'termino']
        read_only_fields = ['id']

    def validate_termino(self, value):
        """Normaliza el término a minúsculas."""
        if not value or not value.strip():
            raise serializers.ValidationError('El término es requerido.')
        return value.strip().lower()
