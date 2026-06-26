"""Serializador para historial de visualizaciones."""
from rest_framework import serializers
from biblioteca.models import HistorialVisualizacion, MaterialBibliografico
from .auth import UserSerializer


class HistorialVisualizacionSerializer(serializers.ModelSerializer):
    """Serializador para HistorialVisualizacion."""

    material_detalle = serializers.SerializerMethodField(read_only=True)
    material = serializers.PrimaryKeyRelatedField(
        queryset=MaterialBibliografico.objects.all(),
        write_only=True
    )
    usuario = UserSerializer(read_only=True)

    class Meta:
        model = HistorialVisualizacion
        fields = [
            'id', 'material', 'material_detalle', 'usuario',
            'fecha_visualizacion'
        ]
        read_only_fields = ['fecha_visualizacion', 'usuario']

    def get_material_detalle(self, obj):
        from .libros import LibroSerializer
        from .trabajos import TrabajoInvestigacionSerializer

        # Intentar obtener como Libro
        try:
            libro = obj.material.libro
            return LibroSerializer(libro).data
        except Libro.DoesNotExist:
            pass

        # Intentar obtener como TrabajoInvestigacion
        try:
            trabajo = obj.material.trabajoinvestigacion
            return TrabajoInvestigacionSerializer(trabajo).data
        except TrabajoInvestigacion.DoesNotExist:
            pass

        return {'id': obj.material.id, 'titulo': obj.material.titulo}