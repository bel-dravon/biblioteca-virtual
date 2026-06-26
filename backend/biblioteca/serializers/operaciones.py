from rest_framework import serializers
from biblioteca.models import SolicitudPrestamo, Notificacion
from biblioteca.models import User, Libro
from .auth import UserSerializer


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']


class LibroMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Libro
        fields = ['id', 'titulo', 'autor_texto', 'stock']


class SolicitudPrestamoSerializer(serializers.ModelSerializer):
    usuario = UserMiniSerializer(read_only=True)
    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='usuario',
        write_only=True
    )
    libro = LibroMiniSerializer(read_only=True)
    libro_id = serializers.PrimaryKeyRelatedField(
        queryset=Libro.objects.all(),
        source='libro',
        write_only=True
    )

    class Meta:
        model = SolicitudPrestamo
        fields = [
            'id', 'usuario', 'usuario_id', 'libro', 'libro_id',
            'estado', 'fecha_solicitud', 'fecha_aprobacion',
            'fecha_devolucion'
        ]
        read_only_fields = ['fecha_solicitud', 'fecha_aprobacion']


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = [
            'id', 'destinatario_tipo', 'destinatario_id',
            'origen_tipo', 'origen_id', 'mensaje', 'leida', 'created_at'
        ]
        read_only_fields = ['created_at']