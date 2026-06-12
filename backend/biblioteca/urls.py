from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken import views as authtoken_views
from .views import (
    RolViewSet, PerfilViewSet, PalabraClaveViewSet, LibroViewSet, TrabajoInvestigacionViewSet,
    HistorialVisualizacionViewSet, ConvocatoriaViewSet, UserViewSet, estadisticas_tendencias, trabajos_por_mes,
    DocumentoAporteViewSet, CreditoDescargaViewSet, AccesoExternoViewSet, 
)
from biblioteca.views.pdf import serve_pdf, serve_pdf_as_images

router = DefaultRouter()
router.register(r'roles', RolViewSet)
router.register(r'perfiles', PerfilViewSet)
router.register(r'palabras-clave', PalabraClaveViewSet)
router.register(r'libros', LibroViewSet, basename='libro')
router.register(r'trabajos', TrabajoInvestigacionViewSet, basename='trabajo')
router.register(r'historial', HistorialVisualizacionViewSet)
router.register(r'convocatorias', ConvocatoriaViewSet)
router.register(r'users', UserViewSet)
router.register(r'aportes', DocumentoAporteViewSet, basename='aporte')
router.register(r'creditos', CreditoDescargaViewSet, basename='credito')
router.register(r'accesos-externos', AccesoExternoViewSet, basename='acceso-externo')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/api-token-auth/', authtoken_views.obtain_auth_token),
    path('api/estadisticas/tendencias/', estadisticas_tendencias, name='estadisticas-tendencias'),
    path('api/estadisticas/trabajos-mes/', trabajos_por_mes, name='trabajos-por-mes'),
    path('media/<path:path>.pdf', serve_pdf, name='serve_pdf'),
    path('api/documentos/<int:trabajo_id>/paginas/', serve_pdf_as_images, name='serve_pdf_as_images'),
]