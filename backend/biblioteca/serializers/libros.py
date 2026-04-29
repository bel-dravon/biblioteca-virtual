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
            'autor',
            'isbn',
            'editorial',
            'anio_publicacion',
            'numero_edicion',
            'stock',
            'palabras_clave',
            'portada',
        ]
        read_only_fields = fields
