from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
""" from biblioteca.views import serve_pdf_preview """

schema_view = get_schema_view(
    openapi.Info(
        title="API Biblioteca Virtual",
        default_version='v1',
        description="Documentación técnica del sistema de gestión de tesis y préstamos.",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="tu_correo@universidad.edu"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('biblioteca.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    # Ruta especial para PDFs (permite iframes)
    """ urlpatterns.append(re_path(r'^media/(?P<path>.*\.pdf)$', serve_pdf_preview)) """
    # Resto de archivos media (imágenes, etc.)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
