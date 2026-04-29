"""Filtros de la app biblioteca."""
import django_filters

from biblioteca.models import HistorialVisualizacion


class HistorialVisualizacionFilter(django_filters.FilterSet):
    """Filtro por rango de fechas para historial de visualizaciones."""

    fecha_inicio = django_filters.IsoDateTimeFilter(
        field_name='fecha_visualizacion',
        lookup_expr='gte'
    )
    fecha_fin = django_filters.IsoDateTimeFilter(
        field_name='fecha_visualizacion',
        lookup_expr='lte'
    )

    class Meta:
        model = HistorialVisualizacion
        fields = ['fecha_inicio', 'fecha_fin']
