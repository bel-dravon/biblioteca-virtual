"""Serializador para libros fisicos."""
from rest_framework import serializers

from biblioteca.models import Libro
from .palabras_clave import PalabraClaveSerializer


class LibroSerializer(serializers.ModelSerializer):
    """Serializador de lectura para inventario de libros fisicos."""

    palabras_clave = PalabraClaveSerializer(many=True, read_only=True)

    class Meta:
        model = Libro
        fields = [
            'id',
            'titulo',
            'autor_texto',
            'isbn',
            'editorial',
            'anio_publicacion',
            'numero_edicion',
            'stock',
            'resumen',
            'signatura_topografica',
            'imagen_portada',
            'palabras_clave',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields