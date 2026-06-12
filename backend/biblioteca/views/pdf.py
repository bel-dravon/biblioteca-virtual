import os
from django.http import Http404, FileResponse
from django.conf import settings
from django.views.decorators.clickjacking import xframe_options_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@xframe_options_exempt
def serve_pdf(request, path):
    """Sirve archivos PDF desde MEDIA_ROOT con X-Frame-Options exento."""
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    if not os.path.exists(file_path):
        raise Http404("Archivo no encontrado")
    return FileResponse(open(file_path, 'rb'), content_type='application/pdf')


@api_view(['GET'])
@permission_classes([AllowAny])
def serve_pdf_as_images(request, trabajo_id):
    """
    Devuelve las páginas del PDF como imágenes PNG pre-generadas.
    ¡Mucho más rápido porque lee de la base de datos y archivos estáticos!
    """
    from biblioteca.models import TrabajoInvestigacion, AccesoExterno

    try:
        trabajo = TrabajoInvestigacion.objects.get(id=trabajo_id)
    except TrabajoInvestigacion.DoesNotExist:
        raise Http404("Documento no encontrado")

    user = request.user
    token = request.GET.get('token')

    # Verificar acceso
    es_interno = user.is_authenticated
    tiene_acceso_completo = False
    if token:
        tiene_acceso_completo = AccesoExterno.objects.filter(
            token_acceso=token, trabajo=trabajo
        ).exists()

    # Determinar cuántas páginas mostrar
    if not es_interno and not tiene_acceso_completo:
        n_paginas = trabajo.valor_preview if trabajo.tipo_preview == 'paginas' else 15
    else:
        n_paginas = None

    # Obtener páginas pre-generadas de la base de datos (¡instantáneo!)
    paginas_qs = trabajo.paginas.all()
    if n_paginas:
        paginas_qs = paginas_qs[:n_paginas]

    paginas = []
    for pagina in paginas_qs:
        paginas.append({
            'numero': pagina.numero,
            'imagen': request.build_absolute_uri(pagina.imagen.url)
        })

    return Response({
        'titulo': trabajo.titulo,
        'total_paginas': trabajo.paginas.count(),
        'paginas_mostradas': len(paginas),
        'es_preview': not es_interno and not tiene_acceso_completo,
        'paginas': paginas
    })