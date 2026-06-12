import uuid
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.http import FileResponse, Http404
import os
from django.conf import settings

from biblioteca.models import DocumentoAporte, CreditoDescarga, AccesoExterno
from biblioteca.models import TrabajoInvestigacion
from biblioteca.serializers.contribuciones import (
    DocumentoAporteSerializer,
    CreditoDescargaSerializer,
    AccesoExternoSerializer
)
from biblioteca.permissions import CanManageUsers, IsAdministrador


class DocumentoAporteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar aportes de documentos.
    - Cualquiera puede crear (AllowAny).
    - Solo admins pueden listar todos, aprobar o rechazar.
    - Usuarios autenticados pueden ver sus propios aportes.
    """
    queryset = DocumentoAporte.objects.all()
    serializer_class = DocumentoAporteSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action in ['aprobar', 'rechazar', 'list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [CanManageUsers()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return DocumentoAporte.objects.none()
        # Admin ve todo
        if user.is_staff or user.is_superuser:
            return DocumentoAporte.objects.all()
        # Usuario normal ve solo los suyos
        return DocumentoAporte.objects.filter(usuario_interno=user)

    @action(detail=True, methods=['post'], permission_classes=[CanManageUsers])
    def aprobar(self, request, pk=None):
        """Admin aprueba un aporte y genera 3 créditos de descarga."""
        aporte = self.get_object()
        if aporte.estado == 'aprobado':
            return Response(
                {'detail': 'Este aporte ya fue aprobado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        aporte.estado = 'aprobado'
        aporte.revisado_por = request.user
        aporte.revisado_at = timezone.now()
        aporte.save()

        # Generar 3 créditos de descarga
        creditos_creados = []
        for i in range(3):
            token = str(uuid.uuid4()).replace('-', '')
            credito = CreditoDescarga.objects.create(
                aporte=aporte,
                usuario=aporte.usuario_interno,
                email_externo=aporte.email if not aporte.usuario_interno else None,
                token_acceso=token if not aporte.usuario_interno else None
            )
            creditos_creados.append({
                'id': credito.id,
                'token': credito.token_acceso
            })

        return Response({
            'detail': 'Aporte aprobado. Se generaron 3 créditos de descarga.',
            'aporte_id': aporte.id,
            'creditos': creditos_creados
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[CanManageUsers])
    def rechazar(self, request, pk=None):
        """Admin rechaza un aporte."""
        aporte = self.get_object()
        motivo = request.data.get('motivo', '')

        if aporte.estado == 'rechazado':
            return Response(
                {'detail': 'Este aporte ya fue rechazado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        aporte.estado = 'rechazado'
        aporte.motivo_rechazo = motivo
        aporte.revisado_por = request.user
        aporte.revisado_at = timezone.now()
        aporte.save()

        return Response({
            'detail': 'Aporte rechazado.',
            'motivo': motivo
        }, status=status.HTTP_200_OK)


class CreditoDescargaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar créditos de descarga.
    - Usuario autenticado ve los suyos.
    - Externo puede consultar por token.
    """
    queryset = CreditoDescarga.objects.all()
    serializer_class = CreditoDescargaSerializer

    def get_permissions(self):
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        # Si es usuario autenticado, devuelve sus créditos
        if user.is_authenticated:
            return CreditoDescarga.objects.filter(usuario=user)
        # Si es externo, buscar por token en query param
        token = self.request.query_params.get('token')
        if token:
            return CreditoDescarga.objects.filter(token_acceso=token)
        return CreditoDescarga.objects.none()

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def usar(self, request):
        """
        Consume un crédito para descargar un trabajo específico.
        Body: { "trabajo_id": 123, "token": "abc-123" } (token opcional si está autenticado)
        """
        user = request.user
        trabajo_id = request.data.get('trabajo_id')
        token = request.data.get('token')

        if not trabajo_id:
            return Response(
                {'detail': 'Se requiere trabajo_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            trabajo = TrabajoInvestigacion.objects.get(id=trabajo_id)
        except TrabajoInvestigacion.DoesNotExist:
            return Response(
                {'detail': 'Trabajo no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Buscar crédito disponible
        if user.is_authenticated:
            # Usuario interno: busca por usuario
            credito = CreditoDescarga.objects.filter(
                usuario=user, usado=False
            ).first()
        else:
            # Usuario externo: busca por token
            if not token:
                return Response(
                    {'detail': 'Se requiere token para usuarios externos.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            credito = CreditoDescarga.objects.filter(
                token_acceso=token, usado=False
            ).first()

        if not credito:
            return Response(
                {'detail': 'No tienes créditos de descarga disponibles.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Consumir crédito
        credito.usado = True
        credito.usado_en = timezone.now()
        credito.usado_para = trabajo
        credito.save()

        # Si es externo, registrar acceso al documento completo
        if not user.is_authenticated:
            AccesoExterno.objects.get_or_create(
                token_acceso=token,
                trabajo=trabajo,
                defaults={
                    'email': credito.email_externo or 'externo@unknown.com',
                    'nombre_completo': credito.aporte.nombre_completo,
                    'ip_origen': request.META.get('REMOTE_ADDR')
                }
            )

        return Response({
            'detail': 'Crédito consumido. Puedes descargar el documento.',
            'credito_id': credito.id,
            'trabajo_id': trabajo.id,
            'trabajo_titulo': trabajo.titulo,
            'descargas_restantes': self._creditos_restantes(user, token)
        }, status=status.HTTP_200_OK)

    def _creditos_restantes(self, user, token):
        if user.is_authenticated:
            return CreditoDescarga.objects.filter(usuario=user, usado=False).count()
        return CreditoDescarga.objects.filter(token_acceso=token, usado=False).count()
    
    @action(detail=False, methods=['get'])
    def mis_creditos(self, request):
        """Devuelve cuántos créditos de descarga tiene el usuario autenticado."""
        if not request.user.is_authenticated:
            return Response({'creditos': 0})
        
        count = CreditoDescarga.objects.filter(
            usuario=request.user, 
            usado=False
        ).count()
        
        return Response({'creditos': count})
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def descargar_con_token(self, request):
        """
        Descarga un PDF usando un token de crédito o cuenta de usuario.
        Body: { "trabajo_id": 123, "token": "abc-123" } (token solo para externos)
        """
        token = request.data.get('token')
        trabajo_id = request.data.get('trabajo_id')
        user = request.user
        
        if not trabajo_id:
            return Response({'detail': 'Se requiere trabajo_id.'}, status=400)
        
        # Buscar crédito disponible según tipo de usuario
        if user.is_authenticated:
            # Usuario interno: busca por usuario
            credito = CreditoDescarga.objects.filter(
                usuario=user, usado=False
            ).first()
        else:
            # Usuario externo: busca por token
            if not token:
                return Response({'detail': 'Se requiere token.'}, status=400)
            credito = CreditoDescarga.objects.filter(
                token_acceso=token, usado=False
            ).first()
        
        if not credito:
            return Response(
                {'detail': 'No tienes créditos de descarga disponibles.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verificar que el trabajo existe y tiene archivo
        try:
            trabajo = TrabajoInvestigacion.objects.get(id=trabajo_id)
        except TrabajoInvestigacion.DoesNotExist:
            return Response(
                {'detail': 'Documento no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not trabajo.archivo_ruta:
            return Response(
                {'detail': 'Este documento no tiene archivo digital.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Consumir el crédito
        credito.usado = True
        credito.usado_en = timezone.now()
        credito.usado_para = trabajo
        credito.save()
        
        # Si es externo, registrar acceso
        if not user.is_authenticated:
            AccesoExterno.objects.get_or_create(
                token_acceso=token,
                trabajo=trabajo,
                defaults={
                    'email': credito.email_externo or 'externo@unknown.com',
                    'nombre_completo': credito.aporte.nombre_completo,
                    'ip_origen': request.META.get('REMOTE_ADDR')
                }
            )
        
        # Servir el archivo
        file_path = os.path.join(settings.MEDIA_ROOT, str(trabajo.archivo_ruta))
        if not os.path.exists(file_path):
            raise Http404("Archivo no encontrado en el servidor")
        
        return FileResponse(
            open(file_path, 'rb'),
            content_type='application/pdf',
            as_attachment=True,
            filename=f"{trabajo.titulo[:50]}.pdf"
        )

class AccesoExternoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para verificar accesos externos desbloqueados.
    """
    queryset = AccesoExterno.objects.all()
    serializer_class = AccesoExternoSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        token = self.request.query_params.get('token')
        if token:
            return AccesoExterno.objects.filter(token_acceso=token)
        return AccesoExterno.objects.none()

    @action(detail=False, methods=['get'], url_path='verificar')
    def verificar_acceso(self, request):
        """
        Verifica si un token tiene acceso a un trabajo específico.
        Query params: ?token=abc&trabajo_id=123
        """
        token = request.query_params.get('token')
        trabajo_id = request.query_params.get('trabajo_id')

        if not token or not trabajo_id:
            return Response(
                {'detail': 'Se requieren token y trabajo_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tiene_acceso = AccesoExterno.objects.filter(
            token_acceso=token,
            trabajo_id=trabajo_id
        ).exists()

        return Response({
            'tiene_acceso': tiene_acceso,
            'token': token,
            'trabajo_id': trabajo_id
        })