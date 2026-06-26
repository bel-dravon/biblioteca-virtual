from .roles import RolViewSet
from .perfiles import PerfilViewSet
from .palabras_clave import PalabraClaveViewSet
from .libros import LibroViewSet
from .trabajos import TrabajoInvestigacionViewSet
from .historial import HistorialVisualizacionViewSet
from .users import UserViewSet
from .convocatorias import ConvocatoriaViewSet, HistorialEstadoConvocatoriaViewSet
from .operaciones import SolicitudPrestamoViewSet, NotificacionViewSet
from .pagina_pdf import PaginaPDFViewSet
from .contribuciones import (
    DocumentoAporteViewSet,
    CreditoDescargaViewSet,
    AccesoExternoViewSet,
)

__all__ = [
    'RolViewSet',
    'PerfilViewSet',
    'PalabraClaveViewSet',
    'LibroViewSet',
    'TrabajoInvestigacionViewSet',
    'HistorialVisualizacionViewSet',
    'ConvocatoriaViewSet',
    'UserViewSet',
    'SolicitudPrestamoViewSet',
    'NotificacionViewSet',
    'DocumentoAporteViewSet',
    'CreditoDescargaViewSet',
    'AccesoExternoViewSet',
    'HistorialEstadoConvocatoriaViewSet',
    'PaginaPDFViewSet',
]