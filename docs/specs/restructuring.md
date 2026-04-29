---
last_updated: "2026-02-10 12:00"
version: "1.0"
status: draft
author: Discovery Architect
---

# Especificación de Reestructuración — Biblioteca Virtual

## 1. Problem Statement

El proyecto `biblioteca-virtual` es un sistema universitario de biblioteca digital (Django REST + React) que ha crecido orgánicamente. Presenta problemas de:

- **Archivos monolíticos**: `views.py` (835 líneas), `TrabajoDetalle.js` (651 líneas), `serializers.py` (438 líneas), `models.py` (480 líneas) — dificultan navegación, revisión y mantenimiento.
- **Código muerto y artefactos**: archivos no usados (`Navigation.js`, `TempGraph.js`, `rag_utils.py`), código comentado (~145 líneas en `HomePage.js`), archivo `nul` de Windows.
- **Seguridad expuesta**: SECRET_KEY y credenciales de BD hardcodeadas en `settings.py`, credenciales reales en `api.http`.
- **Inconsistencias técnicas**: doble `AuthProvider` (index.js + App.js), cliente HTTP mixto (fetch + axios), rutas JWT registradas sin uso real, `.gitignore` incompleto, `requirements.txt` con solo 2 de ~15+ dependencias.
- **Estructura plana**: no hay carpeta `backend/`; manage.py, apps y scripts sueltos en la raíz.
- **Duplicación**: `STOP_WORDS_ES` y helpers de respuesta API duplicados entre `biblioteca` e `ia_core`.

## 2. Goals

1. Reorganizar el proyecto en una estructura `backend/` + `frontend/` + `docs/` clara.
2. Dividir módulos monolíticos en paquetes por dominio (backend) y subfolder por feature (frontend).
3. Eliminar todo código muerto, artefactos y dependencias sin uso.
4. Extraer secretos a variables de entorno (`.env`).
5. Unificar el cliente HTTP del frontend en axios.
6. Corregir bugs conocidos (doble AuthProvider, doble API call, `__init.py__.py` mal nombrado).
7. Preparar infraestructura de guardias de rol (RoleRoute/RoleGuard) y ruta 404.
8. Crear `.gitignore` apropiado y `requirements.txt` completo.

## 3. Non-Goals

- Implementar funcionalidades nuevas (nuevos endpoints, nuevas páginas).
- Migrar de CRA a Vite u otro bundler.
- Cambiar de base de datos o de ORM.
- Reescribir lógica de negocio existente.
- Agregar tests (se documenta como deuda técnica, no se implementa en este scope).
- Actualizar CLAUDE.md o AGENTS.md (decisión explícita del usuario).

## 4. Fases de Ejecución

### Fase 1: Cleanup (eliminar basura + código muerto + corregir bugs)

#### 1.1 Archivos a eliminar

| Archivo | Razón |
|---------|-------|
| `nul` (raíz) | Artefacto Windows, archivo vacío |
| `frontend/src/components/Navigation.js` | Reemplazado por `Sidebar.js`, sin imports activos |
| `frontend/src/components/TempGraph.js` | Snippet roto, no es componente funcional, chart.js no instalado |
| `frontend/src/App.css` | CSS default de CRA, no importado |
| `frontend/src/logo.svg` | SVG default de CRA, no referenciado |
| `frontend/src/App.test.js` | Test default de CRA, roto (busca "learn react link" que no existe) |
| `frontend/src/components/TrabajosRecientes.js` | Solo usado en ruta comentada, no funcional |
| `biblioteca/rag_utils.py` | Wrapper muerto, funciones nunca llamadas |
| `task_refactor_ia.md` (raíz) | Tarea completada, documento temporal obsoleto |
| `package.json` (raíz) | No pertenece al backend, es artefacto de npm init accidental |
| `package-lock.json` (raíz) | Asociado al package.json raíz |
| `node_modules/` (raíz) | Asociado al package.json raíz |

> **Mantener**: `frontend/src/frontend.zip` — decisión explícita del usuario.

#### 1.2 Código muerto a limpiar (sin eliminar archivo)

| Archivo | Acción |
|---------|--------|
| `frontend/src/pages/HomePage.js` | Eliminar líneas ~78-220 (código comentado, ~145 líneas) |
| `frontend/src/App.js` | Eliminar import de `TrabajosRecientes` (componente eliminado) |
| `frontend/src/App.js` | Eliminar ruta comentada de `TrabajosRecientes` si existe |

#### 1.3 Bugs a corregir

| Bug | Archivo | Corrección |
|-----|---------|------------|
| Doble `AuthProvider` | `frontend/src/index.js` | Eliminar `<AuthProvider>` de `index.js`. Mantener SOLO en `App.js` (dentro de `<Router>`) |
| Nombre de archivo roto | `biblioteca/management/__init.py__.py` | Renombrar a `__init__.py` |
| Directivas `"use client"` | `FilterBar.js`, `LoanRequestModal.js`, `LoanStatusNotification.js` | Eliminar `"use client"` (es directiva Next.js, no aplica en CRA) |
| Doble API call | `frontend/src/pages/TrabajoDetalle.js` | Eliminar la segunda llamada duplicada a `getById` |
| Import muerto | `frontend/src/App.js` | Eliminar import de `TrabajosRecientes` |

#### 1.4 Fixes menores

| Item | Archivo | Acción |
|------|---------|--------|
| manifest.json | `frontend/public/manifest.json` | Cambiar `short_name` y `name` de "Create React App Sample" a "Biblioteca Virtual" |
| Extensión inconsistente | `SmartLibrarySearch.jsx` | Renombrar a `SmartLibrarySearch.js` (consistencia con el resto del proyecto) |

---

### Fase 2: Seguridad

#### 2.1 Variables de entorno — backend

**Crear `backend/.env`** (después del move en Fase 3, pero preparar ahora en raíz):

```env
# Django
SECRET_KEY=django-insecure-yc76@$zp5uj+habxy8nd7+@r+1_jj3#004o*&bdv-(e9d4tjv^
DEBUG=True

# Database
DB_NAME=bibliotecadb
DB_USER=postgres
DB_PASSWORD=SherlockMoriarty21
DB_HOST=localhost
DB_PORT=5432

# IA Services
GOOGLE_API_KEY=
IA_PDF_MODEL=

# OCR/PDF tools (Windows)
POPPLER_PATH=
TESSERACT_CMD=
```

**Modificar `core/settings.py`**:

```python
# Antes:
SECRET_KEY = 'django-insecure-yc76@$zp5uj+habxy8nd7+@r+1_jj3#004o*&bdv-(e9d4tjv^'

# Después:
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-CHANGE-ME-IN-PRODUCTION')

# Antes:
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'bibliotecadb',
        'USER': 'postgres',
        'PASSWORD': 'SherlockMoriarty21',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Después:
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'bibliotecadb'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

> Nota: `load_dotenv()` ya existe en settings.py (línea 18), por lo que `.env` se cargará automáticamente.

#### 2.2 Sanitizar `api.http`

Reemplazar credenciales hardcodeadas con placeholders:

```
# Variables
@username = {{username}}
@password = {{password}}
@token = {{token}}
```

#### 2.3 Crear `.gitignore` completo

Reemplazar el `.gitignore` actual (template CRA) por uno que cubra Django + Node:

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
*.egg-info/
dist/
build/
*.egg

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
media/

# Environment
.env
*.env.local
backend-env/
venv/
.venv/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build
frontend/build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
nul

# Test coverage
htmlcov/
.coverage
.coverage.*
.pytest_cache/
```

#### 2.4 Generar `requirements.txt` completo

Ejecutar `pip freeze` dentro del venv `backend-env` y guardar resultado. El actual solo tiene:

```
pytesseract
pdf2image
```

Dependencias conocidas que faltan (por imports en el código):
- `django` (~5.2.6)
- `djangorestframework`
- `django-cors-headers`
- `djangorestframework-simplejwt` (eliminar después de Fase 3)
- `drf-yasg`
- `psycopg2` o `psycopg2-binary`
- `python-dotenv`
- `google-generativeai`
- `numpy`
- `scikit-learn`
- `Pillow`
- `pdf2image`
- `pytesseract`

#### 2.5 Variables de entorno — frontend

**Crear `frontend/.env.example`**:

```env
# API base URL (sin trailing slash)
REACT_APP_API_URL=http://127.0.0.1:8000
```

---

### Fase 3: Reestructuración Backend

#### 3.1 Crear estructura `backend/`

Mover los siguientes elementos de la raíz a `backend/`:

```
manage.py          → backend/manage.py
core/              → backend/core/
biblioteca/        → backend/biblioteca/
ia_core/           → backend/ia_core/
media/             → backend/media/
.env               → backend/.env
requirements.txt   → backend/requirements.txt
api.http           → backend/api.http
```

**Scripts raíz a eliminar** (se reemplazan por management command combinado):
- `asignar_director.py` → lógica se mueve a `setup_roles`
- `crear_roles.py` → lógica se mueve a `setup_roles`

**Ajustes en `core/settings.py` tras el move**:

```python
# BASE_DIR apunta a backend/ (parent de core/)
# Esto ya funciona correctamente porque:
# BASE_DIR = Path(__file__).resolve().parent.parent
# Antes: raíz del proyecto → ahora: backend/
# MEDIA_ROOT = BASE_DIR / 'media' → backend/media/ ✓
```

> **Importante**: `load_dotenv()` buscará `.env` relativo al working directory. Asegurarse de que el `.env` esté en `backend/` y que el servidor se ejecute desde `backend/`.

#### 3.2 Crear módulo `backend/shared/`

```
backend/shared/
├── __init__.py
├── constants.py         # STOP_WORDS_ES (eliminar duplicados de biblioteca y ia_core)
└── response_helpers.py  # api_error_response, api_success_response
```

**`constants.py`**: Extraer `STOP_WORDS_ES` que actualmente está duplicado en:
- `biblioteca/ml_utils.py`
- `ia_core/services/search_service.py`

**`response_helpers.py`**: Extraer helpers de respuesta API que están duplicados entre apps.

Después de crear `shared/`, actualizar imports en todos los archivos que usaban las versiones locales.

#### 3.3 Split `biblioteca/models.py` → paquete `models/`

**Estructura**:

```
biblioteca/models/
├── __init__.py          # Re-exporta todos los modelos
├── auth.py              # Rol, Perfil
├── catalogo.py          # Autor, PalabraClave, TrabajoInvestigacion, AutorTrabajo, Clasificacion
├── operaciones.py       # SolicitudPrestamo, HistorialVisualizacion
└── convocatorias.py     # Convocatoria
```

**`__init__.py`** (barrel export):

```python
from .auth import Rol, Perfil
from .catalogo import (
    Autor, PalabraClave, TrabajoInvestigacion, 
    AutorTrabajo, Clasificacion
)
from .operaciones import SolicitudPrestamo, HistorialVisualizacion
from .convocatorias import Convocatoria

__all__ = [
    'Rol', 'Perfil',
    'Autor', 'PalabraClave', 'TrabajoInvestigacion',
    'AutorTrabajo', 'Clasificacion',
    'SolicitudPrestamo', 'HistorialVisualizacion',
    'Convocatoria',
]
```

**⚠ Precaución con migraciones**: Cada modelo debe mantener su `class Meta: app_label = 'biblioteca'` implícito (no necesita ser explícito si el módulo está dentro de `biblioteca/`). Django resuelve los modelos por `app_label`, no por ubicación del archivo. Las migraciones existentes seguirán funcionando siempre que los imports en `__init__.py` expongan los mismos modelos.

**Patrón de dependencias entre archivos del paquete**:
- `auth.py`: sin dependencias internas (Rol y Perfil son independientes, Perfil usa `settings.AUTH_USER_MODEL` y `Rol` que está en el mismo archivo).
- `catalogo.py`: importa `Perfil` desde `.auth` para el campo `asesor` de `TrabajoInvestigacion`.
- `operaciones.py`: importa desde `.catalogo` (`TrabajoInvestigacion`) y usa `settings.AUTH_USER_MODEL`.
- `convocatorias.py`: sin dependencias internas.

#### 3.4 Split `biblioteca/views.py` → paquete `views/`

**Estructura**:

```
biblioteca/views/
├── __init__.py           # Re-exporta todos los viewsets y vistas
├── roles.py              # RolViewSet
├── perfiles.py           # PerfilViewSet
├── autores.py            # AutorViewSet
├── palabras_clave.py     # PalabraClave ViewSet
├── trabajos.py           # TrabajoInvestigacionViewSet + custom actions (recomendar, verificar_originalidad, etc.)
├── clasificaciones.py    # ClasificacionViewSet
├── solicitudes.py        # SolicitudPrestamoViewSet
├── historial.py          # HistorialVisualizacionViewSet
├── convocatorias.py      # ConvocatoriaViewSet
├── users.py              # UserViewSet
├── estadisticas.py       # estadisticas_tendencias, trabajos_por_mes (function-based views)
└── pdf.py                # serve_pdf (movido desde core/urls.py)
```

**`__init__.py`**: Importar y re-exportar todo para que `biblioteca/urls.py` siga funcionando sin cambios:

```python
from .roles import RolViewSet
from .perfiles import PerfilViewSet
from .autores import AutorViewSet
from .palabras_clave import PalabraClaveViewSet
from .trabajos import TrabajoInvestigacionViewSet
from .clasificaciones import ClasificacionViewSet
from .solicitudes import SolicitudPrestamoViewSet
from .historial import HistorialVisualizacionViewSet
from .convocatorias import ConvocatoriaViewSet
from .users import UserViewSet
from .estadisticas import estadisticas_tendencias, trabajos_por_mes
from .pdf import serve_pdf
```

#### 3.5 Split `biblioteca/serializers.py` → paquete `serializers/`

**Estructura** (espeja views):

```
biblioteca/serializers/
├── __init__.py
├── roles.py
├── perfiles.py
├── autores.py
├── palabras_clave.py
├── trabajos.py
├── clasificaciones.py
├── solicitudes.py
├── historial.py
├── convocatorias.py
└── users.py
```

**`__init__.py`**: Barrel export de todos los serializers.

#### 3.6 Mantener como archivo único

- `biblioteca/permissions.py` — 317 líneas, bien organizado, no necesita split.
- `biblioteca/urls.py` — 26 líneas, solo registra routers. Actualizar imports desde `views/` package (que gracias al barrel export no requiere cambios).

#### 3.7 Mover `ml_utils.py` a `ia_core`

- **Origen**: `biblioteca/ml_utils.py`
- **Destino**: `backend/ia_core/services/ml_service.py`
- **Contenido**: funciones de TF-IDF (recomendaciones) y verificación de originalidad.
- **Actualizar imports**: en `biblioteca/views/trabajos.py` (las custom actions que usan estas funciones).
- **Actualizar imports de STOP_WORDS_ES**: ahora desde `shared.constants`.

#### 3.8 Mover `serve_pdf` de `core/urls.py`

- **Origen**: función `serve_pdf` definida inline en `core/urls.py` (líneas 14-22).
- **Destino**: `backend/biblioteca/views/pdf.py`.
- **En `core/urls.py`**: reemplazar la definición inline por import desde biblioteca:

```python
# Antes (en core/urls.py):
@xframe_options_exempt
def serve_pdf(request, path):
    ...

# Después:
from biblioteca.views import serve_pdf
```

#### 3.9 Registrar ThesisEmbedding en admin

**Crear/actualizar `ia_core/admin.py`**:

```python
from django.contrib import admin
from .models import ThesisEmbedding

@admin.register(ThesisEmbedding)
class ThesisEmbeddingAdmin(admin.ModelAdmin):
    list_display = ('trabajo', 'created_at')
    search_fields = ('trabajo__titulo',)
    readonly_fields = ('embedding_vector', 'created_at')
```

#### 3.10 Combinar scripts en management command

**Combinar** `asignar_director.py` + `crear_roles.py` → `biblioteca/management/commands/setup_roles.py`:

```python
# Funcionalidad:
# - Crea los roles por defecto (Estudiante, Bibliotecario, Director, Administrador)
# - Opcionalmente asigna el rol Director a un usuario especificado
# Uso: python manage.py setup_roles [--assign-director username]
```

**Eliminar** los scripts raíz originales después del merge.

#### 3.11 Eliminar JWT

**Archivos/líneas a modificar**:

1. `core/urls.py`: Eliminar las 2 rutas JWT:
   ```python
   # ELIMINAR:
   path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
   path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
   ```
2. `core/urls.py`: Eliminar import:
   ```python
   # ELIMINAR:
   from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
   ```
3. `core/settings.py`: No hay config de JWT en `REST_FRAMEWORK` (ya usa solo `TokenAuthentication`). ✓
4. `requirements.txt`: Eliminar `djangorestframework-simplejwt` de las dependencias.
5. Ejecutar `pip uninstall djangorestframework-simplejwt`.

> El frontend ya usa Token Authentication exclusivamente (header `Authorization: Token xxx`). No hay impacto.

#### 3.12 Eliminar `rag_utils.py`

Ya listado en Fase 1 eliminación. Solo confirmar que ningún import lo referencia (verificado: no hay imports).

---

### Fase 4: Reestructuración Frontend

#### 4.1 Unificar cliente HTTP en axios

**Reescribir `frontend/src/api/config.js`**:

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: inyectar token en cada request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default apiClient;
export { API_URL };
```

**Actualizar `AuthContext.js`**: Reemplazar llamadas `fetch()` directas por `apiClient` de axios. Actualmente usa `fetch` para login/register/logout.

**Impacto**: Todos los archivos en `api/` que ya usan `apiClient` seguirán funcionando (la interfaz de axios es compatible con los patrones existentes de `.get()`, `.post()`, etc.). Los que usaban fetch directo necesitan migración.

#### 4.2 Arreglar doble AuthProvider

Ya detallado en Fase 1 (bug fix). Recordar que `AuthProvider` debe estar **dentro** de `<BrowserRouter>` en `App.js` porque usa `useNavigate`.

#### 4.3 Split `api/services.js` → archivos por dominio

**Origen**: `frontend/src/api/services.js` (8 servicios en un archivo).

**Destino**:

```
frontend/src/api/
├── config.js           # (ya existe, reescrito en 4.1)
├── index.js            # Barrel export actualizado
├── auth.js             # (ya existe)
├── trabajos.js         # (ya existe)
├── convocatorias.js    # (ya existe)
├── solicitudes.js      # NEW — extraído de services.js
├── estadisticas.js     # NEW — extraído de services.js
├── users.js            # NEW — extraído de services.js
├── roles.js            # NEW — extraído de services.js
├── perfiles.js         # NEW — extraído de services.js
├── historial.js        # NEW — extraído de services.js
├── palabrasClave.js    # NEW — extraído de services.js
└── autores.js          # NEW — extraído de services.js
```

**Actualizar `api/index.js`**: Barrel export de todos los módulos nuevos.

**Actualizar imports en páginas**: Cada página que importaba desde `services.js` debe actualizar su import al módulo específico.

#### 4.4 Split `TrabajoDetalle.js` → subfolder

**Origen**: `frontend/src/pages/TrabajoDetalle.js` (651 líneas).

**Destino**:

```
frontend/src/pages/trabajo/
├── TrabajoDetalle.js            # Orquestador: state, data fetching, layout
├── AIChatPanel.js               # Panel de chat con IA (Gemini)
├── PDFSection.js                # Visor PDF + controles
├── LoanSection.js               # Solicitud de préstamo + estado
└── RecommendationsSection.js    # Recomendaciones IA + similares
```

**Patrón**: `TrabajoDetalle.js` mantiene el state y pasa props a los subcomponentes. Los subcomponentes son presentacionales con lógica local mínima.

**Actualizar imports en `App.js`**:

```javascript
// Antes:
import TrabajoDetalle from './pages/TrabajoDetalle';
// Después:
import TrabajoDetalle from './pages/trabajo/TrabajoDetalle';
```

#### 4.5 Componentes de protección por rol

**Crear `frontend/src/components/RoleRoute.js`**:

```javascript
// Wrapper para <Route> que verifica rol del usuario
// Props: allowedRoles (array de strings), children
// Usa AuthContext para obtener el rol actual
// Si no tiene permiso: redirect a home o muestra mensaje
```

**Crear `frontend/src/components/RoleGuard.js`**:

```javascript
// Wrapper para UI condicional por rol
// Props: allowedRoles (array), children, fallback (optional)
// Renderiza children solo si el usuario tiene el rol requerido
// Renderiza fallback (o null) si no
```

**Uso en `App.js`**:

```jsx
<Route path="/admin/*" element={
  <RoleRoute allowedRoles={['Administrador', 'Director']}>
    <AdminDashboard />
  </RoleRoute>
} />
```

#### 4.6 Ruta 404 catch-all

**Crear `frontend/src/pages/NotFound.js`**: Página simple con mensaje "Página no encontrada" y link a home.

**Registrar en `App.js`**:

```jsx
<Route path="*" element={<NotFound />} />
```

#### 4.7 Sincronizar temas

**`theme/themeConfig.js`** debe importar colores desde **`theme/theme.js`** (source of truth):

```javascript
// themeConfig.js
import { colors } from './theme';
// Usar colors.primary, colors.secondary, etc. en lugar de hardcodear hex values
```

Esto evita que los colores se desincronicen entre ambos archivos.

#### 4.8 Configurar URL de API desde env var

**En `frontend/src/api/config.js`** (ya cubierto en 4.1):

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
```

**En `ProtectedPDFViewer.js`**: Si tiene URLs hardcodeadas a `localhost:8000`, reemplazar por `API_URL` importado.

**En `AuthContext.js`**: Reemplazar `http://127.0.0.1:8000` hardcodeado por `API_URL` o usar `apiClient`.

---

## 5. Estructura Final del Proyecto

```
biblioteca-virtual/
├── docs/
│   ├── specs/
│   │   └── restructuring.md
│   ├── thesis-chapters/              ← PDFs de capítulos de tesis (movidos)
│   ├── requirements_ia.md
│   └── requerimientos-ia.md
├── backend/
│   ├── manage.py
│   ├── .env
│   ├── requirements.txt              ← Completo (pip freeze)
│   ├── api.http                      ← Sanitizado
│   ├── core/
│   │   ├── __init__.py
│   │   ├── settings.py               ← Usa os.environ para secretos
│   │   ├── urls.py                   ← Sin rutas JWT, serve_pdf importado
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── shared/
│   │   ├── __init__.py
│   │   ├── constants.py              ← STOP_WORDS_ES
│   │   └── response_helpers.py       ← api_error_response, api_success_response
│   ├── biblioteca/
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── __init__.py           ← Re-exporta todos los modelos
│   │   │   ├── auth.py               ← Rol, Perfil
│   │   │   ├── catalogo.py           ← Autor, PalabraClave, TrabajoInvestigacion, AutorTrabajo, Clasificacion
│   │   │   ├── operaciones.py        ← SolicitudPrestamo, HistorialVisualizacion
│   │   │   └── convocatorias.py      ← Convocatoria
│   │   ├── views/
│   │   │   ├── __init__.py
│   │   │   ├── roles.py
│   │   │   ├── perfiles.py
│   │   │   ├── autores.py
│   │   │   ├── palabras_clave.py
│   │   │   ├── trabajos.py
│   │   │   ├── clasificaciones.py
│   │   │   ├── solicitudes.py
│   │   │   ├── historial.py
│   │   │   ├── convocatorias.py
│   │   │   ├── users.py
│   │   │   ├── estadisticas.py
│   │   │   └── pdf.py
│   │   ├── serializers/
│   │   │   ├── __init__.py
│   │   │   ├── roles.py
│   │   │   ├── perfiles.py
│   │   │   ├── autores.py
│   │   │   ├── palabras_clave.py
│   │   │   ├── trabajos.py
│   │   │   ├── clasificaciones.py
│   │   │   ├── solicitudes.py
│   │   │   ├── historial.py
│   │   │   ├── convocatorias.py
│   │   │   └── users.py
│   │   ├── permissions.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── tests.py
│   │   ├── management/
│   │   │   ├── __init__.py           ← Nombre corregido
│   │   │   └── commands/
│   │   │       ├── __init__.py
│   │   │       ├── setup_roles.py    ← Combinado de crear_roles + asignar_director
│   │   │       └── generate_thumbnail.py
│   │   └── migrations/
│   │       └── (sin cambios)
│   ├── ia_core/
│   │   ├── __init__.py
│   │   ├── admin.py                  ← NUEVO: registra ThesisEmbedding
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── gemini_client.py
│   │   │   ├── search_service.py
│   │   │   ├── analytics_service.py
│   │   │   ├── ml_service.py         ← Movido desde biblioteca/ml_utils.py
│   │   │   └── exceptions.py
│   │   ├── management/
│   │   │   ├── __init__.py
│   │   │   └── commands/
│   │   │       ├── __init__.py
│   │   │       └── import_legacy_thesis.py
│   │   └── migrations/
│   │       └── (sin cambios)
│   └── media/
│       ├── tesis/
│       ├── thumbnails/
│       └── trabajos/
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── node_modules/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json             ← Nombre actualizado
│   └── src/
│       ├── index.js                  ← AuthProvider ELIMINADO de aquí
│       ├── App.js                    ← AuthProvider se mantiene aquí
│       ├── setupTests.js
│       ├── reportWebVitals.js
│       ├── api/
│       │   ├── config.js             ← Reescrito: axios + env var
│       │   ├── index.js              ← Barrel exports actualizado
│       │   ├── auth.js
│       │   ├── trabajos.js
│       │   ├── convocatorias.js
│       │   ├── solicitudes.js        ← NUEVO
│       │   ├── estadisticas.js       ← NUEVO
│       │   ├── users.js              ← NUEVO
│       │   ├── roles.js              ← NUEVO
│       │   ├── perfiles.js           ← NUEVO
│       │   ├── historial.js          ← NUEVO
│       │   ├── palabrasClave.js      ← NUEVO
│       │   └── autores.js            ← NUEVO
│       ├── components/
│       │   ├── RoleRoute.js          ← NUEVO
│       │   ├── RoleGuard.js          ← NUEVO
│       │   ├── Sidebar.js
│       │   ├── Header.js
│       │   ├── Footer.js
│       │   ├── BookCard.js
│       │   ├── WorkCard.js
│       │   ├── FilterBar.js
│       │   ├── StatCard.js
│       │   ├── ProtectedPDFViewer.js
│       │   ├── LoanRequestModal.js
│       │   └── LoanStatusNotification.js
│       ├── context/
│       │   └── AuthContext.js        ← Reescrito: usa apiClient (axios)
│       ├── layouts/
│       │   └── DashboardLayout.js
│       ├── pages/
│       │   ├── trabajo/              ← NUEVO subfolder
│       │   │   ├── TrabajoDetalle.js
│       │   │   ├── AIChatPanel.js
│       │   │   ├── PDFSection.js
│       │   │   ├── LoanSection.js
│       │   │   └── RecommendationsSection.js
│       │   ├── HomePage.js
│       │   ├── Login.js
│       │   ├── Registro.js
│       │   ├── Explorar.js
│       │   ├── SmartLibrarySearch.js  ← Renombrado de .jsx
│       │   ├── SubirTrabajo.js
│       │   ├── MiBiblio.js
│       │   ├── UserProfile.js
│       │   ├── TrendsDashboard.js
│       │   ├── Convocatorias.js
│       │   ├── CrearConvocatoria.js
│       │   ├── AdminDashboard.js
│       │   ├── About.js
│       │   ├── NotFound.js           ← NUEVO: 404
│       │   └── admin/
│       │       └── UserManagement.js
│       ├── theme/
│       │   ├── theme.js              ← Source of truth para colores
│       │   └── themeConfig.js        ← Importa desde theme.js
│       └── frontend.zip              ← Se mantiene (decisión usuario)
├── .gitignore                        ← Reescrito para Django+Node
├── CLAUDE.md
├── AGENTS.md
└── .agents/
```

---

## 6. Notas Técnicas y Precauciones

### 6.1 Migraciones Django al dividir models.py

- **No se necesitan nuevas migraciones** si los modelos mantienen el mismo `app_label` (implícito por estar dentro de `biblioteca/`).
- El `__init__.py` del paquete `models/` debe re-exportar TODOS los modelos para que Django los descubra.
- Verificar con `python manage.py makemigrations --check` que no se generan migraciones espurias.
- Si Django genera migraciones de "rename" o "delete+create", es señal de que el barrel export está incompleto.

### 6.2 Orden de ejecución dentro de cada fase

**Fase 1**: Eliminar archivos → limpiar código muerto → corregir bugs → fixes menores.

**Fase 2**: Crear `.env` → modificar `settings.py` → sanitizar `api.http` → crear `.gitignore` → generar `requirements.txt` → crear `frontend/.env.example`.

**Fase 3**: Crear `backend/` y mover archivos → crear `shared/` → split models → split serializers → split views → mover `ml_utils.py` → mover `serve_pdf` → crear admin ia_core → combinar scripts → eliminar JWT → eliminar `rag_utils.py`.

**Fase 4**: Reescribir `api/config.js` → actualizar `AuthContext.js` → split `services.js` → split `TrabajoDetalle.js` → crear RoleRoute/RoleGuard → crear NotFound + registrar ruta → sincronizar temas → actualizar URL hardcodeadas.

### 6.3 Riesgo: mover a `backend/`

- `ROOT_URLCONF`, `WSGI_APPLICATION` usan `'core.urls'` y `'core.wsgi.application'`. Estos NO cambian porque son relativos al paquete Python, no al filesystem.
- `INSTALLED_APPS` usa `'biblioteca'` e `'ia_core'` — tampoco cambian.
- `manage.py` tiene `os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')` — no cambia.
- **Lo que SÍ cambia**: el working directory para ejecutar el servidor. Ahora es `cd backend && python manage.py runserver`.

### 6.4 UserProfile.js — bugs documentados (no se corrigen en este scope)

1. **Botón "Editar perfil"**: tiene `onClick` sin handler implementado (no hace nada).
2. **Fecha de registro**: hardcodeada como `new Date()` en lugar de usar la fecha real del usuario.

Estos se documentan como deuda técnica para una iteración futura.

### 6.5 Ausencia de tests

No existen tests en el proyecto (ni backend ni frontend, excepto `App.test.js` que es default CRA y está roto). Se documenta como deuda técnica significativa. Se recomienda agregar tests como siguiente fase después de la reestructuración.

---

## 7. Acceptance Criteria

### Fase 1: Cleanup
- [ ] Todos los archivos listados en 1.1 están eliminados.
- [ ] `HomePage.js` no contiene código comentado después de la línea ~77.
- [ ] `App.js` no importa `TrabajosRecientes`.
- [ ] Solo existe UN `<AuthProvider>` en toda la app (en `App.js`).
- [ ] `biblioteca/management/__init__.py` tiene nombre correcto.
- [ ] Ningún archivo `.js` contiene `"use client"`.
- [ ] `TrabajoDetalle.js` no tiene llamada duplicada a `getById`.
- [ ] `manifest.json` dice "Biblioteca Virtual".
- [ ] `SmartLibrarySearch.js` existe (no `.jsx`).

### Fase 2: Seguridad
- [ ] `settings.py` no contiene SECRET_KEY ni contraseñas en texto plano.
- [ ] `.env` existe con todas las variables necesarias.
- [ ] `api.http` usa placeholders `{{variable}}` en lugar de credenciales reales.
- [ ] `.gitignore` incluye reglas para `__pycache__/`, `*.pyc`, `media/`, `.env`, `node_modules/`, `db.sqlite3`.
- [ ] `requirements.txt` incluye todas las dependencias instaladas del proyecto.
- [ ] `frontend/.env.example` existe con `REACT_APP_API_URL`.

### Fase 3: Backend
- [ ] Estructura `backend/` existe con manage.py, core/, biblioteca/, ia_core/, shared/, media/.
- [ ] `python manage.py check` no reporta errores.
- [ ] `python manage.py makemigrations --check` no genera migraciones nuevas.
- [ ] `shared/constants.py` contiene `STOP_WORDS_ES` y es importado (no duplicado) en biblioteca e ia_core.
- [ ] `biblioteca/models/` es un paquete Python con barrel export de los 9 modelos.
- [ ] `biblioteca/views/` es un paquete Python con barrel export de todos los viewsets.
- [ ] `biblioteca/serializers/` es un paquete Python con barrel export.
- [ ] `ia_core/services/ml_service.py` existe con el contenido de `ml_utils.py`.
- [ ] `ia_core/admin.py` registra `ThesisEmbedding`.
- [ ] `management/commands/setup_roles.py` existe y combina funcionalidad de los 2 scripts.
- [ ] No existen rutas JWT en `core/urls.py`.
- [ ] `djangorestframework-simplejwt` no está en `requirements.txt`.
- [ ] `rag_utils.py` no existe.
- [ ] `asignar_director.py` y `crear_roles.py` no existen en la raíz.
- [ ] Todos los endpoints API existentes siguen funcionando sin cambios en URLs.

### Fase 4: Frontend
- [ ] `api/config.js` usa axios y `REACT_APP_API_URL`.
- [ ] `AuthContext.js` usa `apiClient` (axios), no `fetch`.
- [ ] `api/services.js` ya no existe; su contenido está en archivos individuales.
- [ ] `api/index.js` exporta todos los nuevos módulos.
- [ ] `pages/trabajo/TrabajoDetalle.js` existe como orquestador slim.
- [ ] `AIChatPanel.js`, `PDFSection.js`, `LoanSection.js`, `RecommendationsSection.js` existen en `pages/trabajo/`.
- [ ] `components/RoleRoute.js` y `components/RoleGuard.js` existen.
- [ ] `pages/NotFound.js` existe y está registrado como ruta catch-all en `App.js`.
- [ ] `themeConfig.js` importa colores desde `theme.js`.
- [ ] No hay URLs `localhost:8000` hardcodeadas en el frontend (excepto como fallback en config.js).
- [ ] `npm run build` completa sin errores.

---

## 8. Decisions Log

| Fecha | Decisión | Alternativas consideradas | Razón |
|-------|----------|--------------------------|-------|
| 2026-02-10 | Crear carpeta `backend/` y mover todo | Mantener estructura plana | Separación clara backend/frontend/docs |
| 2026-02-10 | Split models en 4 archivos por dominio | Un archivo por modelo (9 archivos) | Balance entre granularidad y navegación |
| 2026-02-10 | Split views: un archivo por ViewSet | Por dominio (menos archivos) | Máxima claridad, cada archivo tiene una responsabilidad |
| 2026-02-10 | Mantener `permissions.py` como archivo único | Dividir por modelo | Ya está bien organizado a 317 líneas |
| 2026-02-10 | Mover `ml_utils.py` a `ia_core/services/` | Mantener en biblioteca | Pertenece conceptualmente a IA, no a biblioteca |
| 2026-02-10 | Eliminar JWT completamente | Mantener como alternativa | No se usa, el frontend usa Token Auth exclusivamente |
| 2026-02-10 | Unificar HTTP client en axios | Mantener fetch + axios mixto | axios ya instalado, eliminar duplicación |
| 2026-02-10 | Mantener `frontend.zip` | Eliminar | Decisión explícita del usuario |
| 2026-02-10 | NO actualizar CLAUDE.md/AGENTS.md | Actualizar con nueva estructura | Decisión explícita del usuario |
| 2026-02-10 | Renombrar `.jsx` → `.js` | Mantener `.jsx` | Consistencia con todo el resto del proyecto |
| 2026-02-10 | Combinar scripts en management command | Mantener scripts separados | Un solo punto de entrada, mejor descubrimiento |

---

## 9. Observaciones y Decisiones Diferidas

### Deuda técnica documentada (fuera de scope)

1. **Tests inexistentes**: No hay tests en backend ni frontend. Se recomienda como siguiente fase post-reestructuración.
2. **UserProfile.js bugs**: Botón editar sin handler, fecha de registro hardcodeada. Corregir en iteración futura.
3. **CORS abierto**: `CORS_ALLOW_ALL_ORIGINS = True` está configurado. Aceptable para desarrollo, revisar antes de producción.
4. **Swagger contact email**: `tu_correo@universidad.edu` placeholder en `core/urls.py` schema_view.

### Notas informativas

- El proyecto usa Django 5.2.6, React 19.1.1, MUI 7.3.5 (versiones actuales al momento del análisis).
- La base de datos es PostgreSQL (`bibliotecadb`).
- El sistema de autenticación usa Token Authentication de DRF (no JWT, no sessions para API).
- Hay 7 migraciones existentes en `biblioteca` y 1 en `ia_core`.
