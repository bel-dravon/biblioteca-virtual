"""Serializador para convocatorias."""
from rest_framework import serializers
from biblioteca.models import Convocatoria, HistorialEstadoConvocatoria


class HistorialEstadoConvocatoriaSerializer(serializers.ModelSerializer):
    """Serializador para historial de estados de convocatoria."""

    class Meta:
        model = HistorialEstadoConvocatoria
        fields = ['id', 'convocatoria', 'estado_anterior', 'estado_nuevo', 'fecha_cambio']
        read_only_fields = ['fecha_cambio']


class ConvocatoriaSerializer(serializers.ModelSerializer):
    """Serializador para el modelo Convocatoria."""

    historial_estados = HistorialEstadoConvocatoriaSerializer(many=True, read_only=True)

    class Meta:
        model = Convocatoria
        fields = [
            'id', 'titulo', 'descripcion', 'requisitos',
            'fecha_inicio', 'fecha_fin', 'estado',
            'imagen_adjunta', 'documento_adjunto', 'created_at',
            'historial_estados'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        if 'fecha_inicio' in attrs and 'fecha_fin' in attrs:
            if attrs['fecha_inicio'] > attrs['fecha_fin']:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio.'
                })
        return attrs