from .auth import UserSerializer
from .roles import RolSerializer
from .perfiles import PerfilSerializer
from .palabras_clave import PalabraClaveSerializer
from .libros import LibroSerializer
from .trabajos import TrabajoInvestigacionSerializer, TrabajoInvestigacionUploadSerializer
from .historial import HistorialVisualizacionSerializer
from .convocatorias import ConvocatoriaSerializer, HistorialEstadoConvocatoriaSerializer
from .contribuciones import DocumentoAporteSerializer, CreditoDescargaSerializer, AccesoExternoSerializer
from .operaciones import SolicitudPrestamoSerializer, NotificacionSerializer
from .pagina_pdf import PaginaPDFSerializer

__all__ = [
    'UserSerializer',
    'RolSerializer',
    'PerfilSerializer',
    'PalabraClaveSerializer',
    'LibroSerializer',
    'ConvocatoriaSerializer',
    'TrabajoInvestigacionSerializer',
    'TrabajoInvestigacionUploadSerializer',
    'HistorialVisualizacionSerializer',
    'HistorialEstadoConvocatoriaSerializer',
    'DocumentoAporteSerializer',
    'CreditoDescargaSerializer',
    'AccesoExternoSerializer',
    'SolicitudPrestamoSerializer',
    'NotificacionSerializer',
    'PaginaPDFSerializer',
]