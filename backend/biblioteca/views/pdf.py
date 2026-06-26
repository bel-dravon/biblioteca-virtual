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
def serve_pdf_as_images(request, material_id):
    """
    Devuelve las paginas del PDF como imagenes PNG pre-generadas.
    Preview fijo de 15 paginas para usuarios externos.
    """
    from biblioteca.models import MaterialBibliografico, AccesoExterno

    try:
        material = MaterialBibliografico.objects.get(id=material_id)
    except MaterialBibliografico.DoesNotExist:
        raise Http404("Documento no encontrado")

    user = request.user
    token = request.GET.get('token')

    # Verificar si es un trabajo de investigacion
    try:
        trabajo = material.trabajoinvestigacion
    except MaterialBibliografico.trabajoinvestigacion.RelatedObjectDoesNotExist:
        raise Http404("Este material no tiene paginas PDF")

    # Verificar acceso
    es_interno = user.is_authenticated
    tiene_acceso_completo = False
    if token:
        tiene_acceso_completo = AccesoExterno.objects.filter(
            token_acceso=token, material=material
        ).exists()

    # Determinar cuantas paginas mostrar
    if not es_interno and not tiene_acceso_completo:
        if not trabajo.permite_preview_publico:
            return Response({
                'titulo': trabajo.titulo,
                'total_paginas': 0,
                'paginas_mostradas': 0,
                'es_preview': True,
                'mensaje': 'Este documento no permite preview publico.',
                'paginas': []
            })
        n_paginas = 15
    else:
        n_paginas = None

    # Obtener paginas pre-generadas de la base de datos
    paginas_qs = material.paginas.all()
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
        'total_paginas': material.paginas.count(),
        'paginas_mostradas': len(paginas),
        'es_preview': not es_interno and not tiene_acceso_completo,
        'paginas': paginas
    })