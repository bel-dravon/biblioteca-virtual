from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from biblioteca.models import MaterialBibliografico, Libro, TrabajoInvestigacion
from biblioteca.serializers import LibroSerializer, TrabajoInvestigacionSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def recien_agregados(request):
    """
    Devuelve materiales (libros y trabajos) agregados en los ultimos 7 dias.
    """
    hace_7_dias = timezone.now() - timedelta(days=7)

    libros = Libro.objects.filter(created_at__gte=hace_7_dias)
    trabajos = TrabajoInvestigacion.objects.filter(created_at__gte=hace_7_dias)

    return Response({
        'libros': LibroSerializer(libros, many=True).data,
        'trabajos': TrabajoInvestigacionSerializer(trabajos, many=True).data,
        'total': libros.count() + trabajos.count(),
        'desde': hace_7_dias.isoformat()
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def buscar_catalogo(request):
    """
    Busqueda unificada en todo el catalogo (libros y trabajos).
    Filtros: autor, titulo, anio, palabra_clave, tipo_material
    """
    params = request.query_params

    # Base queryset de MaterialBibliografico (padre)
    queryset = MaterialBibliografico.objects.all()

    # Filtros comunes (en el padre)
    if titulo := params.get('titulo'):
        queryset = queryset.filter(titulo__icontains=titulo)

    if autor := params.get('autor'):
        queryset = queryset.filter(autor_texto__icontains=autor)

    if anio := params.get('anio'):
        queryset = queryset.filter(anio_publicacion=anio)

    if palabra_clave := params.get('palabra_clave'):
        queryset = queryset.filter(
            relaciones_palabras_clave__palabra_clave__termino__icontains=palabra_clave
        ).distinct()

    # Separar por tipo
    tipo = params.get('tipo_material')

    # Obtener IDs de libros y trabajos del queryset filtrado
    libros_ids = []
    trabajos_ids = []

    for material in queryset:
        try:
            # Verificar si tiene relacion con Libro
            if hasattr(material, 'libro'):
                libros_ids.append(material.id)
        except:
            pass

        try:
            # Verificar si tiene relacion con TrabajoInvestigacion
            if hasattr(material, 'trabajoinvestigacion'):
                trabajos_ids.append(material.id)
        except:
            pass

    if tipo == 'libro':
        libros = Libro.objects.filter(id__in=libros_ids)
        trabajos = TrabajoInvestigacion.objects.none()
    elif tipo == 'trabajo':
        libros = Libro.objects.none()
        trabajos = TrabajoInvestigacion.objects.filter(id__in=trabajos_ids)
    else:
        # Sin filtro de tipo: devolver ambos
        libros = Libro.objects.filter(id__in=libros_ids)
        trabajos = TrabajoInvestigacion.objects.filter(id__in=trabajos_ids)

    return Response({
        'libros': LibroSerializer(libros, many=True).data,
        'trabajos': TrabajoInvestigacionSerializer(trabajos, many=True).data,
        'total_libros': libros.count(),
        'total_trabajos': trabajos.count(),
        'filtros_aplicados': {
            'titulo': params.get('titulo'),
            'autor': params.get('autor'),
            'anio': params.get('anio'),
            'palabra_clave': params.get('palabra_clave'),
            'tipo_material': tipo,
        }
    })