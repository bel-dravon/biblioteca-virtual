"""Vista para solicitudes de préstamo."""
import logging

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from biblioteca.models import SolicitudPrestamo
from biblioteca.serializers import SolicitudPrestamoSerializer
from biblioteca.permissions import CanManageLoans, CanManageUsers
from shared.response_helpers import api_success_response


logger = logging.getLogger(__name__)


class SolicitudPrestamoViewSet(viewsets.ModelViewSet):
    """ViewSet para solicitudes de préstamo."""

    queryset = SolicitudPrestamo.objects.select_related('usuario', 'trabajo')
    serializer_class = SolicitudPrestamoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = SolicitudPrestamo.objects.select_related(
            'usuario', 'trabajo'
        ).order_by('-fecha_solicitud')

        user = self.request.user

        if CanManageUsers().has_permission(self.request, self):
            return queryset

        return queryset.filter(usuario=user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[CanManageLoans])
    def aprobar(self, request, pk=None):
        solicitud = self.get_object()
        solicitud.estado = 'aprobado'
        solicitud.save()
        logger.info(f"Solicitud {pk} aprobada por {request.user.username}")
        return api_success_response(
            data={'estado': 'aprobado'},
            message='Solicitud aprobada exitosamente'
        )

    @action(detail=True, methods=['patch'], permission_classes=[CanManageLoans])
    def rechazar(self, request, pk=None):
        solicitud = self.get_object()
        solicitud.estado = 'rechazado'
        solicitud.save()
        logger.info(f"Solicitud {pk} rechazada por {request.user.username}")
        return api_success_response(
            data={'estado': 'rechazado'},
            message='Solicitud rechazada'
        )
