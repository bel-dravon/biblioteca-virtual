"""Serializador para trabajos de investigacion."""
import os

from rest_framework import serializers

from biblioteca.models import PalabraClave, TrabajoInvestigacion

from .palabras_clave import PalabraClaveSerializer


class TrabajoInvestigacionSerializer(serializers.ModelSerializer):
    """Serializador general para trabajos de investigacion."""

    palabras_clave = serializers.PrimaryKeyRelatedField(
        queryset=PalabraClave.objects.all(),
        many=True,
        required=False,
        help_text='Lista de IDs de palabras clave'
    )
    class Meta:
        model = TrabajoInvestigacion
        fields = [
            'id', 'titulo', 'resumen',
            'anio_publicacion', 'archivo_ruta', 'thumbnail',
            'tipo_material', 'especialidad',
            'tiene_archivo_digital', 'fuente_fisica',
            'signatura_topografica', 'created_at', 'updated_at',
            'autores_texto', 'asesor_texto', 'palabras_clave'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'thumbnail']

    def validate_titulo(self, value):
        return _validate_titulo(value)

    def validate_resumen(self, value):
        return _validate_resumen(value)

    def validate_archivo_ruta(self, value):
        return _validate_archivo_ruta(value)

    def to_representation(self, instance):
        """Expande palabras_clave a objetos completos para lectura."""
        response = super().to_representation(instance)
        response['palabras_clave'] = PalabraClaveSerializer(
            instance.palabras_clave.all(), many=True
        ).data
        return response

    def create(self, validated_data):
        """Crea un nuevo trabajo con sus relaciones ManyToMany."""
        palabras_clave_data = validated_data.pop('palabras_clave', [])

        trabajo = TrabajoInvestigacion.objects.create(**validated_data)
        trabajo.palabras_clave.set(palabras_clave_data)
        return trabajo

    def update(self, instance, validated_data):
        """Actualiza un trabajo existente."""
        palabras_clave_data = validated_data.pop('palabras_clave', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if palabras_clave_data is not None:
            instance.palabras_clave.set(palabras_clave_data)

        return instance


class TrabajoInvestigacionUploadSerializer(serializers.ModelSerializer):
    """Serializador estricto para carga manual de trabajos."""

    palabras_clave_manual = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
        required=False,
        allow_empty=True
    )

    class Meta:
        model = TrabajoInvestigacion
        fields = [
            'id', 'titulo', 'resumen', 'anio_publicacion', 'archivo_ruta',
            'tipo_material', 'especialidad', 'fuente_fisica',
            'signatura_topografica', 'autores_texto', 'asesor_texto', 'palabras_clave_manual'
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'archivo_ruta': {'required': True},
            'titulo': {'required': True},
            'resumen': {'required': True},
            'tipo_material': {'required': True},
            'anio_publicacion': {'required': True},
        }

    def validate_titulo(self, value):
        return _validate_titulo(value)

    def validate_resumen(self, value):
        return _validate_resumen(value)

    def validate_archivo_ruta(self, value):
        return _validate_archivo_ruta(value)

    def validate_anio_publicacion(self, value):
        if value is None:
            raise serializers.ValidationError('El anio de publicacion es obligatorio.')
        if value < 1900 or value > 2100:
            raise serializers.ValidationError('El anio de publicacion no es valido.')
        return value

    def validate_fuente_fisica(self, value):
        value = (value or '').strip()
        return value or None

    def validate_autores_texto(self, value):
        value = ' '.join((value or '').strip().split())
        if len(value) < 3:
            raise serializers.ValidationError('Debes registrar al menos un autor en texto libre.')
        return value

    def validate_asesor_texto(self, value):
        value = ' '.join((value or '').strip().split())
        return value

    def validate_signatura_topografica(self, value):
        value = (value or '').strip()
        return value or None

    def validate_especialidad(self, value):
        value = (value or '').strip()
        return value or None

    def validate_palabras_clave_manual(self, value):
        palabras = _clean_string_list(value)
        if len(palabras) > 15:
            raise serializers.ValidationError('No puedes registrar mas de 15 palabras clave.')
        return palabras

    def create(self, validated_data):
        palabras_clave_manual = validated_data.pop('palabras_clave_manual', [])

        validated_data['tiene_archivo_digital'] = True

        trabajo = TrabajoInvestigacion.objects.create(**validated_data)

        if palabras_clave_manual:
            trabajo.palabras_clave.set([
                _get_or_create_palabra_clave(termino)
                for termino in palabras_clave_manual
            ])

        return trabajo


def _validate_titulo(value):
    value = (value or '').strip()
    if len(value) < 10:
        raise serializers.ValidationError('El titulo debe tener al menos 10 caracteres.')
    return value


def _validate_resumen(value):
    value = (value or '').strip()
    if len(value) < 50:
        raise serializers.ValidationError('El resumen debe tener al menos 50 caracteres.')
    return value


def _validate_archivo_ruta(value):
    if value:
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError('Solo se permiten archivos PDF.')
        max_pdf_size_bytes = _get_max_pdf_upload_size_bytes()
        if value.size > max_pdf_size_bytes:
            max_size_mb = max_pdf_size_bytes / (1024 * 1024)
            raise serializers.ValidationError(
                f'El archivo no puede superar los {max_size_mb:.0f}MB.'
            )
    return value


def _clean_string_list(values):
    cleaned_values = []
    seen = set()
    for raw_value in values or []:
        value = ' '.join((raw_value or '').strip().split())
        if not value:
            continue
        normalized = value.casefold()
        if normalized in seen:
            continue
        seen.add(normalized)
        cleaned_values.append(value)
    return cleaned_values


def _get_or_create_palabra_clave(termino):
    normalized_term = ' '.join((termino or '').strip().split())
    palabra_clave, _ = PalabraClave.objects.get_or_create(
        termino=normalized_term.capitalize()
    )
    return palabra_clave


def _get_max_pdf_upload_size_bytes() -> int:
    raw_size_mb = os.environ.get('IA_MAX_PDF_SIZE_MB', '200')
    try:
        size_mb = float(raw_size_mb)
        if size_mb <= 0:
            raise ValueError
    except ValueError:
        size_mb = 200.0
    return int(size_mb * 1024 * 1024)
