"""Serializador para convocatorias."""
from rest_framework import serializers
from biblioteca.models import Convocatoria


class ConvocatoriaSerializer(serializers.ModelSerializer):
    """Serializador para el modelo Convocatoria."""

    class Meta:
        model = Convocatoria
        fields = [
            'id', 'titulo', 'tipo', 'descripcion', 'requisitos',
            'fecha_inicio', 'fecha_fin', 'estado',
            'imagen_adjunta', 'documento_adjunto', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        """Valida que fecha_inicio sea anterior a fecha_fin."""
        if 'fecha_inicio' in attrs and 'fecha_fin' in attrs:
            if attrs['fecha_inicio'] > attrs['fecha_fin']:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio.'
                })
        return attrs
