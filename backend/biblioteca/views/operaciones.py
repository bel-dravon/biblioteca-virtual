from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q

from biblioteca.models import SolicitudPrestamo, Notificacion, User
from biblioteca.serializers import SolicitudPrestamoSerializer, NotificacionSerializer
from biblioteca.services import notificar_a_usuario, notificar_a_administradores


class SolicitudPrestamoViewSet(viewsets.ModelViewSet):
    queryset = SolicitudPrestamo.objects.all()
    serializer_class = SolicitudPrestamoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or (hasattr(user, 'perfil') and user.perfil.rol.puede_gestionar_usuarios):
            return SolicitudPrestamo.objects.all()
        return SolicitudPrestamo.objects.filter(usuario=user)

    def perform_create(self, serializer):
        solicitud = serializer.save(usuario=self.request.user)

        notificar_a_administradores(
            mensaje=f'Nueva solicitud de prestamo: "{solicitud.libro.titulo}" por {solicitud.usuario.email}',
            origen_tipo='prestamo',
            origen_id=solicitud.id
        )

        return solicitud

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.estado != 'pendiente':
            return Response(
                {'detail': 'Solo se pueden aprobar solicitudes pendientes.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if solicitud.libro.stock <= 0:
            return Response(
                {'detail': 'No hay stock disponible para este libro.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        solicitud.libro.stock -= 1
        solicitud.libro.save()

        solicitud.estado = 'aprobada'
        solicitud.fecha_aprobacion = timezone.now()
        solicitud.save()

        notificar_a_usuario(
            usuario_id=solicitud.usuario.id,
            mensaje=f'Tu solicitud de prestamo para "{solicitud.libro.titulo}" ha sido aprobada.',
            origen_tipo='prestamo',
            origen_id=solicitud.id
        )

        return Response(SolicitudPrestamoSerializer(solicitud).data)

    @action(detail=True, methods=['post'])
    def devolver(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.estado != 'aprobada':
            return Response(
                {'detail': 'Solo se pueden devolver prestamos aprobados.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        solicitud.libro.stock += 1
        solicitud.libro.save()

        solicitud.estado = 'devuelta'
        solicitud.fecha_devolucion = timezone.now()
        solicitud.save()

        notificar_a_usuario(
            usuario_id=solicitud.usuario.id,
            mensaje=f'Tu prestamo de "{solicitud.libro.titulo}" ha sido marcado como devuelto.',
            origen_tipo='prestamo',
            origen_id=solicitud.id
        )

        return Response(SolicitudPrestamoSerializer(solicitud).data)


class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Notificacion.objects.filter(
            Q(destinatario_tipo='usuario', destinatario_id=user.id) |
            Q(destinatario_tipo='rol', destinatario_id=user.perfil.rol.id if hasattr(user, 'perfil') else -1)
        )

    @action(detail=False, methods=['get'], url_path='mis-notificaciones')
    def mis_notificaciones(self, request):
        notificaciones = self.get_queryset().order_by('-created_at')
        serializer = self.get_serializer(notificaciones, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='no-leidas')
    def no_leidas(self, request):
        count = self.get_queryset().filter(leida=False).count()
        return Response({'count': count})

    @action(detail=True, methods=['patch'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        notificacion = self.get_object()
        notificacion.leida = True
        notificacion.save()
        return Response(self.get_serializer(notificacion).data)

    @action(detail=False, methods=['post'], url_path='marcar-todas-leidas')
    def marcar_todas_leidas(self, request):
        self.get_queryset().filter(leida=False).update(leida=True)
        return Response({'detail': 'Todas las notificaciones marcadas como leidas.'})