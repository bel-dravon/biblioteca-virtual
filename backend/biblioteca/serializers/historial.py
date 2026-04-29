"""Serializador para historial de visualizaciones."""
from rest_framework import serializers
from biblioteca.models import HistorialVisualizacion, TrabajoInvestigacion
from .users import UserSerializer
from .trabajos import TrabajoInvestigacionSerializer


class HistorialVisualizacionSerializer(serializers.ModelSerializer):
    """Serializador para HistorialVisualizacion."""

    trabajo_detalle = TrabajoInvestigacionSerializer(
        source='trabajo',
        read_only=True
    )
    trabajo = serializers.PrimaryKeyRelatedField(
        queryset=TrabajoInvestigacion.objects.all(),
        write_only=True
    )
    usuario = UserSerializer(read_only=True)

    class Meta:
        model = HistorialVisualizacion
        fields = [
            'id', 'trabajo', 'trabajo_detalle', 'usuario',
            'fecha_visualizacion', 'ip_origen'
        ]
        read_only_fields = ['fecha_visualizacion', 'usuario', 'ip_origen']
