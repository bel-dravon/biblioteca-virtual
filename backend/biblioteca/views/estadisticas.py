"""Vistas de estadisticas (function-based views)."""
import logging
from datetime import datetime

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from django.db.models import Count

from biblioteca.models import (
    PalabraClave, TrabajoInvestigacion
)
from shared.response_helpers import api_error_response


logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def estadisticas_tendencias(request):
    """Endpoint para estadísticas y tendencias del repositorio."""
    try:
        total_trabajos = TrabajoInvestigacion.objects.count()

        # Palabras clave populares con análisis de saturación
        palabras_populares = PalabraClave.objects.annotate(
            num_trabajos=Count('trabajoinvestigacion')
        ).filter(num_trabajos__gt=0).order_by('-num_trabajos')[:10]

        tendencias_temas = []
        for palabra in palabras_populares:
            porcentaje = round(
                (palabra.num_trabajos / total_trabajos * 100), 2
            ) if total_trabajos > 0 else 0

            if porcentaje >= 20:
                estado = "Saturado"
            elif porcentaje >= 10:
                estado = "Popular"
            elif porcentaje >= 5:
                estado = "Estable"
            else:
                estado = "Oportunidad"

            tendencias_temas.append({
                'tema': palabra.termino,
                'interes': porcentaje,
                'estado': estado,
                'total_trabajos': palabra.num_trabajos
            })

        trabajos_por_anio = TrabajoInvestigacion.objects.exclude(
            anio_publicacion__isnull=True
        ).values('anio_publicacion').annotate(total=Count('id')).order_by('anio_publicacion')

        # Trabajos por tipo
        trabajos_por_tipo = TrabajoInvestigacion.objects.values(
            'tipo_material'
        ).annotate(total=Count('id')).order_by('-total')

        # Áreas de oportunidad
        areas_oportunidad = PalabraClave.objects.annotate(
            num_trabajos=Count('trabajoinvestigacion')
        ).filter(
            num_trabajos__lte=2, num_trabajos__gt=0
        ).values_list('termino', flat=True)[:5]

        autores_data = []

        hace_30_dias = datetime.now().date().replace(day=1)
        trabajos_recientes = TrabajoInvestigacion.objects.filter(
            created_at__gte=hace_30_dias
        ).count()

        return Response({
            'tendencias_temas': tendencias_temas,
            'trabajos_por_anio': list(trabajos_por_anio),
            'trabajos_por_tipo': list(trabajos_por_tipo),
            'areas_oportunidad': list(areas_oportunidad),
            'autores_top': autores_data,
            'trabajos_recientes': trabajos_recientes,
            'carreras_activas': [],
            'tecnologias_emergentes': [],
            'estadisticas_generales': {
                'total_trabajos': total_trabajos,
                'total_autores': 0,
                'total_palabras_clave': PalabraClave.objects.count(),
            }
        })

    except Exception as e:
        logger.error(f"Error en estadísticas_tendencias: {e}")
        return api_error_response(
            message='Error al generar estadísticas',
            error_code='STATS_ERROR',
            details=str(e),
            http_status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def trabajos_por_mes(request):
    """Endpoint para trabajos publicados por anio."""
    try:
        trabajos = TrabajoInvestigacion.objects.exclude(
            anio_publicacion__isnull=True
        ).values('anio_publicacion').annotate(total=Count('id')).order_by('anio_publicacion')

        return Response({'data': list(trabajos)})

    except Exception as e:
        logger.error(f"Error en trabajos_por_mes: {e}")
        return api_error_response(
            message='Error al obtener datos',
            error_code='STATS_ERROR',
            http_status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
