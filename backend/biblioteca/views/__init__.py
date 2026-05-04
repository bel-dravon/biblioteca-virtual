from .roles import RolViewSet
from .perfiles import PerfilViewSet
from .palabras_clave import PalabraClaveViewSet
from .libros import LibroViewSet
from .trabajos import TrabajoInvestigacionViewSet
from .historial import HistorialVisualizacionViewSet
from .convocatorias import ConvocatoriaViewSet
from .users import UserViewSet
from .estadisticas import estadisticas_tendencias, trabajos_por_mes
from .pdf import serve_pdf

__all__ = [
    'RolViewSet',
    'PerfilViewSet',
    'PalabraClaveViewSet',
    'LibroViewSet',
    'TrabajoInvestigacionViewSet',
    'HistorialVisualizacionViewSet',
    'ConvocatoriaViewSet',
    'UserViewSet',
    'estadisticas_tendencias',
    'trabajos_por_mes',
    'serve_pdf',
]
