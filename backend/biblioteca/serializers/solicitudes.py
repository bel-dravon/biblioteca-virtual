"""Serializador para solicitudes de préstamo."""
from rest_framework import serializers
from biblioteca.models import SolicitudPrestamo, TrabajoInvestigacion
from .users import UserSerializer
from .trabajos import TrabajoInvestigacionSerializer


class SolicitudPrestamoSerializer(serializers.ModelSerializer):
    """Serializador para SolicitudPrestamo."""

    usuario = UserSerializer(read_only=True)
    trabajo_detalle = TrabajoInvestigacionSerializer(
        source='trabajo',
        read_only=True
    )
    trabajo = serializers.PrimaryKeyRelatedField(
        queryset=TrabajoInvestigacion.objects.all(),
        write_only=True
    )

    class Meta:
        model = SolicitudPrestamo
        fields = [
            'id', 'trabajo', 'trabajo_detalle', 'usuario',
            'tipo_solicitud', 'fecha_solicitud', 'estado'
        ]
        read_only_fields = ['fecha_solicitud', 'estado', 'usuario']

    def validate_tipo_solicitud(self, value):
        """Valida el tipo de solicitud."""
        tipos_validos = ['consulta', 'prestamo', 'descarga']
        if value and value.lower() not in tipos_validos:
            raise serializers.ValidationError(
                f'Tipo de solicitud inválido. Opciones: {", ".join(tipos_validos)}'
            )
        return value.lower() if value else 'consulta'
