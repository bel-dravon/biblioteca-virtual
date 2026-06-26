from django.urls import path, include
from rest_framework.routers import DefaultRouter
from biblioteca.views.auth_token import CustomObtainAuthToken

from .views import (
    RolViewSet, PerfilViewSet, PalabraClaveViewSet, LibroViewSet, TrabajoInvestigacionViewSet,
    HistorialVisualizacionViewSet, ConvocatoriaViewSet, UserViewSet,
    DocumentoAporteViewSet, CreditoDescargaViewSet, AccesoExternoViewSet,
    HistorialEstadoConvocatoriaViewSet, PaginaPDFViewSet,
    SolicitudPrestamoViewSet, NotificacionViewSet,
)
from biblioteca.views.pdf import serve_pdf_as_images
from biblioteca.views.catalogo import recien_agregados, buscar_catalogo

router = DefaultRouter()
router.register(r'roles', RolViewSet)
router.register(r'perfiles', PerfilViewSet)
router.register(r'palabras-clave', PalabraClaveViewSet)
router.register(r'libros', LibroViewSet, basename='libro')
router.register(r'trabajos', TrabajoInvestigacionViewSet, basename='trabajo')
router.register(r'historial', HistorialVisualizacionViewSet)
router.register(r'convocatorias', ConvocatoriaViewSet)
router.register(r'convocatorias-historial', HistorialEstadoConvocatoriaViewSet, basename='convocatoria-historial')
router.register(r'users', UserViewSet)
router.register(r'aportes', DocumentoAporteViewSet, basename='aporte')
router.register(r'creditos', CreditoDescargaViewSet, basename='credito')
router.register(r'accesos-externos', AccesoExternoViewSet, basename='acceso-externo')
router.register(r'prestamos', SolicitudPrestamoViewSet, basename='prestamo')
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')
router.register(r'paginas-pdf', PaginaPDFViewSet, basename='pagina-pdf')

urlpatterns = [
    path('', include(router.urls)),
    path('api-token-auth/', CustomObtainAuthToken.as_view()),
    path('documentos/<int:material_id>/paginas/', serve_pdf_as_images, name='serve_pdf_as_images'),
    path('recien-agregados/', recien_agregados, name='recien_agregados'),
    path('buscar/', buscar_catalogo, name='buscar_catalogo'),
]