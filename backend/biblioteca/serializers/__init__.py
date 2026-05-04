from .users import UserSerializer
from .roles import RolSerializer
from .perfiles import PerfilSerializer
from .palabras_clave import PalabraClaveSerializer
from .libros import LibroSerializer
from .convocatorias import ConvocatoriaSerializer
from .trabajos import TrabajoInvestigacionSerializer
from .historial import HistorialVisualizacionSerializer

__all__ = [
    'UserSerializer',
    'RolSerializer',
    'PerfilSerializer',
    'PalabraClaveSerializer',
    'LibroSerializer',
    'ConvocatoriaSerializer',
    'TrabajoInvestigacionSerializer',
    'HistorialVisualizacionSerializer',
]
