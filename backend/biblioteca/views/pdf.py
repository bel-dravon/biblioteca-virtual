"""Vista para servir archivos PDF permitiendo iframes."""
import os

from django.conf import settings
from django.http import FileResponse, Http404
from django.views.decorators.clickjacking import xframe_options_exempt


@xframe_options_exempt
def serve_pdf(request, path):
    """Sirve archivos PDF sin restricción X-Frame-Options para permitir iframes"""
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    if os.path.exists(file_path) and path.endswith('.pdf'):
        response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(path)}"'
        return response
    raise Http404("Archivo no encontrado")
