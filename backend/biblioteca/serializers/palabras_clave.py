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
        """Normaliza el termino y verifica duplicados."""
        if not value or not value.strip():
            raise serializers.ValidationError('El termino es requerido.')
        
        termino_normalizado = value.strip().lower()
        
        # Verificar si ya existe (case-insensitive)
        if PalabraClave.objects.filter(termino__iexact=termino_normalizado).exists():
            raise serializers.ValidationError(
                f'La palabra clave "{termino_normalizado}" ya existe.'
            )
        
        return termino_normalizado