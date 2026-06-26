from rest_framework import serializers
from biblioteca.models import DocumentoAporte, CreditoDescarga, AccesoExterno


class DocumentoAporteSerializer(serializers.ModelSerializer):
    usuario_interno_id = serializers.ReadOnlyField(source='usuario_interno.id')
    usuario_interno_email = serializers.ReadOnlyField(source='usuario_interno.email')
    creditos_disponibles = serializers.SerializerMethodField()
    tokens = serializers.SerializerMethodField()
    archivo_url = serializers.SerializerMethodField()

    class Meta:
        model = DocumentoAporte
        fields = [
            'id', 'usuario_interno_id', 'usuario_interno_email',
            'nombre_completo', 'email', 'organizacion_origen',
            'titulo', 'descripcion', 'archivo', 'archivo_url',
            'archivo_hash', 'estado',
            'motivo_rechazo', 'comentario_rechazo',
            'revisado_por', 'revisado_at',
            'created_at', 'creditos_disponibles', 'tokens'
        ]
        read_only_fields = ['estado', 'revisado_por', 'revisado_at', 'archivo_hash', 'created_at']

    def get_archivo_url(self, obj):
        if obj.archivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.archivo.url)
            return obj.archivo.url
        return None

    def get_creditos_disponibles(self, obj):
        return obj.creditos.filter(usado=False).count()

    def get_tokens(self, obj):
        if obj.usuario_interno:
            return []
        return [
            {
                'token': c.token_acceso,
                'usado': c.usado,
                'usado_en': c.usado_en.isoformat() if c.usado_en else None,
                'usado_para': c.usado_para.titulo if c.usado_para else None
            }
            for c in obj.creditos.filter(token_acceso__isnull=False)
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['usuario_interno'] = request.user
        return super().create(validated_data)


class CreditoDescargaSerializer(serializers.ModelSerializer):
    aporte_titulo = serializers.ReadOnlyField(source='aporte.titulo')
    material_titulo = serializers.ReadOnlyField(source='usado_para.titulo')

    class Meta:
        model = CreditoDescarga
        fields = [
            'id', 'usuario', 'email_externo', 'token_acceso',
            'aporte', 'aporte_titulo', 'usado', 'usado_en',
            'usado_para', 'material_titulo', 'created_at'
        ]
        read_only_fields = ['usado', 'usado_en', 'usado_para', 'created_at']


class AccesoExternoSerializer(serializers.ModelSerializer):
    material_titulo = serializers.ReadOnlyField(source='material.titulo')

    class Meta:
        model = AccesoExterno
        fields = [
            'id', 'token_acceso', 'material', 'material_titulo',
            'email', 'nombre_completo', 'fecha_acceso', 'ip_origen'
        ]
        read_only_fields = ['fecha_acceso']