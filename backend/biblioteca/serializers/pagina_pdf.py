from rest_framework import serializers
from biblioteca.models import PaginaPDF


class PaginaPDFSerializer(serializers.ModelSerializer):
    material_titulo = serializers.ReadOnlyField(source='material.titulo')

    class Meta:
        model = PaginaPDF
        fields = ['id', 'material', 'material_titulo', 'numero', 'imagen']
        read_only_fields = ['id']