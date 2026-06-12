"""Vista para trabajos de investigación."""
import json
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.db.models import Q

from biblioteca.models import TrabajoInvestigacion, CreditoDescarga, AccesoExterno
from biblioteca.serializers import TrabajoInvestigacionSerializer
from biblioteca.serializers.trabajos import TrabajoInvestigacionUploadSerializer
from biblioteca.permissions import (
    CanManageUsers,
    CanDeleteContent
)
from shared.response_helpers import api_error_response


logger = logging.getLogger(__name__)


class TrabajoInvestigacionViewSet(viewsets.ModelViewSet):
    """ViewSet principal para trabajos de investigación."""
    queryset = TrabajoInvestigacion.objects.all()
    """ queryset = TrabajoInvestigacion.objects.prefetch_related('palabras_clave') """
    serializer_class = TrabajoInvestigacionSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action in ['create', 'subir_trabajo']:
            return TrabajoInvestigacionUploadSerializer
        return TrabajoInvestigacionSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        if self.action in ['create', 'update', 'partial_update', 'subir_trabajo']:
            return [CanManageUsers()]
        return [IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        filters = Q()

        if titulo := params.get('titulo'):
            filters &= Q(titulo__icontains=titulo)

        if resumen := params.get('resumen'):
            filters &= Q(resumen__icontains=resumen)

        if autor := params.get('autor'):
            filters &= Q(autores_texto__icontains=autor)

        if tipo := params.get('tipo'):
            filters &= Q(tipo_material=tipo)

        if anio := params.get('anio'):
            filters &= Q(anio_publicacion=anio)

        if palabra_clave := params.get('palabra_clave'):
            filters &= Q(palabras_clave__termino__icontains=palabra_clave)

        return queryset.filter(filters).distinct()

    @action(detail=False, methods=['post'], permission_classes=[CanManageUsers])
    def subir_trabajo(self, request):
        """Endpoint para subir un nuevo trabajo de investigación."""
        return self._handle_manual_upload(request)

    def create(self, request, *args, **kwargs):
        """Crea un nuevo trabajo con metadatos cargados manualmente."""
        return self._handle_manual_upload(request)

    def _handle_manual_upload(self, request):
        try:
            with transaction.atomic():
                serializer = self.get_serializer(data=self._build_upload_payload(request))
                if not serializer.is_valid():
                    return api_error_response(
                        message='Error de validación',
                        details=serializer.errors,
                        http_status=status.HTTP_400_BAD_REQUEST
                    )

                trabajo = serializer.save()
                logger.info(f"Trabajo creado: {trabajo.id} - {trabajo.titulo}")
                response_serializer = TrabajoInvestigacionSerializer(
                    trabajo,
                    context=self.get_serializer_context()
                )

                return Response(
                    response_serializer.data,
                    status=status.HTTP_201_CREATED
                )
        except ValueError as e:
            return api_error_response(
                message='Error de validación',
                details=str(e),
                http_status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error al subir trabajo: {e}")
            return api_error_response(
                message='Error al guardar el trabajo',
                error_code='UPLOAD_ERROR',
                details=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _build_upload_payload(self, request):
        payload = {
            key: value
            for key, value in request.data.items()
            if key != 'palabras_clave_manual'
        }
        payload['archivo_ruta'] = request.data.get('archivo_ruta')
        payload['palabras_clave_manual'] = self._parse_json_list(
            request.data.get('palabras_clave_manual'),
            field_name='palabras_clave_manual',
            required=False
        )
        return payload

    def _parse_json_list(self, raw_value, field_name, required=True):
        if raw_value in [None, '']:
            return [] if not required else []

        if isinstance(raw_value, list):
            return raw_value

        try:
            parsed_value = json.loads(raw_value)
        except (TypeError, json.JSONDecodeError) as exc:
            raise ValueError(f'El campo {field_name} debe enviarse como una lista JSON.') from exc

        if not isinstance(parsed_value, list):
            raise ValueError(f'El campo {field_name} debe enviarse como una lista JSON.')

        return parsed_value
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def puede_descargar(self, request, pk=None):
        """
        Verifica si el usuario (autenticado o por token) puede descargar este trabajo.
        """
        trabajo = self.get_object()
        user = request.user
        
        # Usuario interno autenticado
        if user.is_authenticated:
            tiene_credito = CreditoDescarga.objects.filter(
                usuario=user, usado=False
            ).exists()
            return Response({
                'puede_descargar': tiene_credito,
                'es_interno': True,
                'creditos_disponibles': CreditoDescarga.objects.filter(
                    usuario=user, usado=False
                ).count()
            })
    
        # Usuario externo (por token en query param)
        token = request.query_params.get('token')
        if token:
            tiene_credito = CreditoDescarga.objects.filter(
                token_acceso=token, usado=False
            ).exists()
            tiene_acceso_completo = AccesoExterno.objects.filter(
                token_acceso=token, trabajo=trabajo
            ).exists()
            return Response({
                'puede_descargar': tiene_credito,
                'puede_ver_completo': tiene_acceso_completo,
                'es_interno': False,
                'token': token
            })
        
        # Sin token, sin login: no puede descargar
        return Response({
            'puede_descargar': False,
            'puede_ver_completo': False,
            'es_interno': False,
            'mensaje': 'Regístrate o aporta un documento para descargar'
        })
