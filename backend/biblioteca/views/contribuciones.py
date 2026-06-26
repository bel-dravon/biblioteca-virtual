import uuid
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.http import FileResponse, Http404
import os
from django.conf import settings

from biblioteca.models import DocumentoAporte, CreditoDescarga, AccesoExterno, Notificacion
from biblioteca.models import TrabajoInvestigacion, MaterialBibliografico, User
from biblioteca.serializers.contribuciones import (
    DocumentoAporteSerializer,
    CreditoDescargaSerializer,
    AccesoExternoSerializer
)
from biblioteca.permissions import CanManageUsers
from biblioteca.services import notificar_a_usuario, notificar_a_administradores


class DocumentoAporteViewSet(viewsets.ModelViewSet):
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
        if user.is_staff or user.is_superuser:
            return DocumentoAporte.objects.all()
        return DocumentoAporte.objects.filter(usuario_interno=user)

    def perform_create(self, serializer):
        aporte = serializer.save()

        notificar_a_administradores(
            mensaje=f'Nuevo aporte pendiente: "{aporte.titulo}" por {aporte.nombre_completo}',
            origen_tipo='aporte',
            origen_id=aporte.id
        )

        return aporte

    @action(detail=True, methods=['post'], permission_classes=[CanManageUsers])
    def aprobar(self, request, pk=None):
        aporte = self.get_object()
        if aporte.estado == 'aceptado':
            return Response(
                {'detail': 'Este aporte ya fue aprobado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        aporte.estado = 'aceptado'
        aporte.revisado_por = request.user
        aporte.revisado_at = timezone.now()
        aporte.save()

        creditos_creados = []
        for i in range(2):
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

        if aporte.usuario_interno:
            notificar_a_usuario(
                usuario_id=aporte.usuario_interno.id,
                mensaje=f'Tu aporte "{aporte.titulo}" ha sido aprobado. Has recibido 2 creditos de descarga.',
                origen_tipo='aporte',
                origen_id=aporte.id
            )

        return Response({
            'detail': 'Aporte aprobado. Se generaron 2 creditos de descarga.',
            'aporte_id': aporte.id,
            'creditos': creditos_creados
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[CanManageUsers])
    def rechazar(self, request, pk=None):
        aporte = self.get_object()

        motivo = request.data.get('motivo_rechazo')
        comentario = request.data.get('comentario_rechazo', '')

        if not motivo:
            return Response(
                {'detail': 'Debes proporcionar un motivo de rechazo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if motivo not in [m[0] for m in DocumentoAporte.MOTIVOS_RECHAZO]:
            return Response(
                {'detail': 'Motivo de rechazo no valido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if aporte.estado == 'rechazado':
            return Response(
                {'detail': 'Este aporte ya fue rechazado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        aporte.estado = 'rechazado'
        aporte.motivo_rechazo = motivo
        aporte.comentario_rechazo = comentario
        aporte.revisado_por = request.user
        aporte.revisado_at = timezone.now()
        aporte.save()

        if aporte.usuario_interno:
            mensaje = f'Tu aporte "{aporte.titulo}" ha sido rechazado. Motivo: {aporte.get_motivo_rechazo_display()}'
            if comentario:
                mensaje += f'. Comentario: {comentario}'

            notificar_a_usuario(
                usuario_id=aporte.usuario_interno.id,
                mensaje=mensaje,
                origen_tipo='aporte',
                origen_id=aporte.id
            )

        return Response({
            'detail': 'Aporte rechazado.',
            'motivo': aporte.get_motivo_rechazo_display(),
            'comentario': comentario
        }, status=status.HTTP_200_OK)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class CreditoDescargaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CreditoDescarga.objects.all()
    serializer_class = CreditoDescargaSerializer

    def get_permissions(self):
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return CreditoDescarga.objects.filter(usuario=user)
        token = self.request.query_params.get('token')
        if token:
            return CreditoDescarga.objects.filter(token_acceso=token)
        return CreditoDescarga.objects.none()

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def usar(self, request):
        user = request.user
        material_id = request.data.get('material_id')
        token = request.data.get('token')

        if not material_id:
            return Response(
                {'detail': 'Se requiere material_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            material = MaterialBibliografico.objects.get(id=material_id)
        except MaterialBibliografico.DoesNotExist:
            return Response(
                {'detail': 'Material no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.is_authenticated:
            credito = CreditoDescarga.objects.filter(
                usuario=user, usado=False
            ).first()
        else:
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
                {'detail': 'No tienes creditos de descarga disponibles.'},
                status=status.HTTP_403_FORBIDDEN
            )

        credito.usado = True
        credito.usado_en = timezone.now()
        credito.usado_para = material
        credito.save()

        if not user.is_authenticated:
            AccesoExterno.objects.get_or_create(
                token_acceso=token,
                material=material,
                defaults={
                    'email': credito.email_externo or 'externo@unknown.com',
                    'nombre_completo': credito.aporte.nombre_completo,
                    'ip_origen': request.META.get('REMOTE_ADDR')
                }
            )

        return Response({
            'detail': 'Credito consumido. Puedes descargar el documento.',
            'credito_id': credito.id,
            'material_id': material.id,
            'material_titulo': material.titulo,
            'descargas_restantes': self._creditos_restantes(user, token)
        }, status=status.HTTP_200_OK)

    def _creditos_restantes(self, user, token):
        if user.is_authenticated:
            return CreditoDescarga.objects.filter(usuario=user, usado=False).count()
        return CreditoDescarga.objects.filter(token_acceso=token, usado=False).count()

    @action(detail=False, methods=['get'])
    def mis_creditos(self, request):
        if not request.user.is_authenticated:
            return Response({'creditos': 0})

        count = CreditoDescarga.objects.filter(
            usuario=request.user,
            usado=False
        ).count()

        return Response({'creditos': count})

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def descargar_con_token(self, request):
        token = request.data.get('token')
        material_id = request.data.get('material_id')
        user = request.user

        if not material_id:
            return Response({'detail': 'Se requiere material_id.'}, status=400)

        if user.is_authenticated:
            credito = CreditoDescarga.objects.filter(
                usuario=user, usado=False
            ).first()
        else:
            if not token:
                return Response({'detail': 'Se requiere token.'}, status=400)
            credito = CreditoDescarga.objects.filter(
                token_acceso=token, usado=False
            ).first()

        if not credito:
            return Response(
                {'detail': 'No tienes creditos de descarga disponibles.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            material = MaterialBibliografico.objects.get(id=material_id)
        except MaterialBibliografico.DoesNotExist:
            return Response(
                {'detail': 'Documento no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            trabajo = material.trabajoinvestigacion
        except MaterialBibliografico.trabajoinvestigacion.RelatedObjectDoesNotExist:
            return Response(
                {'detail': 'Este material no tiene archivo digital.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not trabajo.archivo_ruta:
            return Response(
                {'detail': 'Este documento no tiene archivo digital.'},
                status=status.HTTP_404_NOT_FOUND
            )

        credito.usado = True
        credito.usado_en = timezone.now()
        credito.usado_para = material
        credito.save()

        if not user.is_authenticated:
            AccesoExterno.objects.get_or_create(
                token_acceso=token,
                material=material,
                defaults={
                    'email': credito.email_externo or 'externo@unknown.com',
                    'nombre_completo': credito.aporte.nombre_completo,
                    'ip_origen': request.META.get('REMOTE_ADDR')
                }
            )

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
        token = request.query_params.get('token')
        material_id = request.query_params.get('material_id')

        if not token or not material_id:
            return Response(
                {'detail': 'Se requieren token y material_id.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tiene_acceso = AccesoExterno.objects.filter(
            token_acceso=token,
            material_id=material_id
        ).exists()

        return Response({
            'tiene_acceso': tiene_acceso,
            'token': token,
            'material_id': material_id
        })