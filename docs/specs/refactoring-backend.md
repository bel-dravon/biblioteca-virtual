---
last_updated: "2026-02-13 14:30"
version: "1.0"
status: draft
author: Discovery Architect
---

# Especificacion de Refactorizacion Backend — Biblioteca Virtual

## 1. Problem Statement

Tras la reestructuracion de archivos (v1, `restructuring.md`), el backend de `biblioteca-virtual` presenta problemas de calidad profunda que afectan seguridad, rendimiento, mantenibilidad y correctitud:

- **Seguridad critica**: `serve_pdf` vulnerable a path traversal, CORS abierto con credenciales, `DEBUG=True` hardcodeado, `X_FRAME_OPTIONS='ALLOWALL'`, `ALLOWED_HOSTS=[]`.
- **Zero tests**: No existe un solo test en todo el backend.
- **God Model**: `TrabajoInvestigacion` (18+ campos) con logica de I/O (thumbnails) embebida en `save()`.
- **Views fat sin service layer**: `estadisticas_tendencias` (100+ lineas), `TrabajoInvestigacionViewSet` con filtrado inline de 9 parametros, `chat_ia` con validacion inline.
- **N+1 queries**: `TrabajoInvestigacionSerializer.to_representation` ejecuta queries extras por cada autor y palabra clave; serializers anidados en Solicitud e Historial.
- **Rendimiento**: `ml_service.py` carga TODOS los trabajos en memoria y recalcula TF-IDF en cada request.
- **Bugs funcionales**: `UserSerializer` con validate_email roto en updates, password update sin hashear, sin auto-creacion de Perfil.
- **Inconsistencias**: 3 formatos de respuesta API distintos, permisos por string en vez de booleanos, codigo muerto en permissions.py, `datetime.now()` en vez de `timezone.now()`.

## 2. Goals

1. Corregir las 5 vulnerabilidades de seguridad criticas (documentar config de produccion).
2. Crear service layer para `biblioteca/` (espejando el patron de `ia_core/services/`).
3. Extraer logica de I/O del God Model a un servicio dedicado.
4. Resolver N+1 queries con `select_related`/`prefetch_related` y optimizar serializers.
5. Pre-computar y persistir la matriz TF-IDF de `ml_service` (solo trabajos academicos).
6. Estandarizar formato de respuesta API con renderer global DRF `{success, data, message}`.
7. Corregir todos los bugs de `UserSerializer` y agregar auto-creacion de Perfil.
8. Migrar sistema de permisos a usar campos booleanos del modelo `Rol`.
9. Instalar `django-filter` y crear FilterSets declarativos.
10. Configurar logging formal en `settings.py`.
11. Eliminar codigo muerto y corregir inconsistencias menores.
12. Implementar tests: unitarios, integracion API y E2E (con prioridad en flujos criticos).
13. Agregar API versioning (`/api/v1/`).

## 3. Non-Goals

- Migrar de base de datos o cambiar ORM.
- Reescribir `ia_core/services/` (ya tiene buena arquitectura).
- Implementar funcionalidades nuevas (nuevos endpoints, nuevas entidades).
- Configuracion de CI/CD o Docker.
- Relacion Convocatoria<->TrabajoInvestigacion (las convocatorias son informativas, decision explicita).

---

## 4. Fases de Ejecucion

### Fase 1: Seguridad y Configuracion

#### 1.1 Corregir `core/settings.py`

| Item | Estado actual | Accion |
|------|--------------|--------|
| `DEBUG` | `True` hardcodeado (linea 27) | Leer de env: `DEBUG = os.environ.get('DEBUG', 'True') == 'True'` |
| `ALLOWED_HOSTS` | `[]` (linea 29) | Leer de env: `ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')` |
| `CORS_ALLOW_ALL_ORIGINS` | `True` (linea 140) | Cambiar a `False`. Descomentar `CORS_ALLOWED_ORIGINS` con valores de env var |
| `CORS_ALLOW_CREDENTIALS` | `True` (linea 141) | Mantener `True` solo si `CORS_ALLOWED_ORIGINS` esta restringido |
| `X_FRAME_OPTIONS` | `'ALLOWALL'` (linea 179) | Cambiar a `'DENY'`. Usar `@xframe_options_sameorigin` solo en `serve_pdf` |
| `SECRET_KEY` | Fallback inseguro | Documentar que el fallback es solo para dev; en produccion DEBE estar en env |
| `LANGUAGE_CODE` | `'en-us'` (linea 121) | Cambiar a `'es'` |

> **Nota**: Estas configuraciones mantienen compatibilidad con desarrollo local. Documentar en el `.env.example` los valores seguros para produccion.

#### 1.2 Corregir vulnerabilidad path traversal en `serve_pdf`

**Archivo**: `backend/biblioteca/views/pdf.py`

**Problema**: El parametro `path` de la URL no se sanitiza. Un path malicioso puede leer archivos fuera de `MEDIA_ROOT`.

**Correccion**:
```python
import os
from pathlib import Path
from django.conf import settings
from django.http import FileResponse, Http404
from django.views.decorators.clickjacking import xframe_options_sameorigin

@xframe_options_sameorigin
def serve_pdf(request, path):
    """Sirve archivos PDF de forma segura desde MEDIA_ROOT."""
    if not request.user.is_authenticated:
        raise Http404
    
    media_root = Path(settings.MEDIA_ROOT).resolve()
    file_path = (media_root / path).resolve()
    
    # Verificar que el path resuelto esta dentro de MEDIA_ROOT
    if not str(file_path).startswith(str(media_root)):
        raise Http404
    
    if not file_path.exists() or not file_path.suffix == '.pdf':
        raise Http404
    
    response = FileResponse(
        open(file_path, 'rb'),
        content_type='application/pdf'
    )
    response['Content-Disposition'] = f'inline; filename="{file_path.name}"'
    return response
```

**Cambios clave**:
- Sanitizacion con `Path.resolve()` para prevenir traversal.
- Autenticacion requerida.
- `@xframe_options_sameorigin` en vez del global `ALLOWALL`.
- Manejo explicito de errores.

#### 1.3 Configurar LOGGING

**Archivo**: `backend/core/settings.py`

Agregar configuracion `LOGGING`:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'biblioteca': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'ia_core': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}
```

**Ademas**: Reemplazar todos los `print()` por `logger.error()` / `logger.warning()` (especificamente en `TrabajoInvestigacion.generate_thumbnail()`).

#### 1.4 Actualizar `.env.example`

Agregar las nuevas variables:
```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

### Fase 2: Arquitectura — Service Layer y Renderer

#### 2.1 Crear `biblioteca/services/`

**Estructura**:
```
backend/biblioteca/services/
    __init__.py
    thumbnail_service.py    # Logica extraida de TrabajoInvestigacion
    trabajo_service.py      # Logica de negocio de trabajos (chat_ia validacion, etc.)
    estadisticas_service.py # Logica extraida de estadisticas_tendencias FBV
    solicitud_service.py    # Logica de aprobar/rechazar solicitudes
```

#### 2.2 Extraer logica del God Model

**Origen**: `TrabajoInvestigacion.generate_thumbnail()` y logica de `save()` override en `backend/biblioteca/models/catalogo.py`.

**Destino**: `backend/biblioteca/services/thumbnail_service.py`

```python
"""Servicio para generacion de thumbnails de trabajos de investigacion."""
import logging
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)

def generate_thumbnail(trabajo):
    """
    Genera thumbnail para un TrabajoInvestigacion.
    
    Args:
        trabajo: Instancia de TrabajoInvestigacion con archivo_ruta.
    
    Returns:
        str: Ruta relativa del thumbnail generado, o None si falla.
    """
    # Mover aqui TODA la logica de generate_thumbnail() y save() override
    ...
```

**Cambios en el modelo**:
- Eliminar `generate_thumbnail()` del modelo.
- Eliminar logica de auto-generacion de `save()`.
- El servicio se invoca desde la view (en `create()` del ViewSet) o via signal `post_save`, no desde el modelo.

#### 2.3 Extraer logica de estadisticas

**Origen**: `backend/biblioteca/views/estadisticas.py` — funcion `estadisticas_tendencias` (100+ lineas).

**Destino**: `backend/biblioteca/services/estadisticas_service.py`

Extraer:
- Las 9 queries de estadisticas a metodos individuales del servicio.
- La funcion `_extraer_tecnologias()` al servicio (con la lista de tecnologias movida a `shared/constants.py`).
- La logica de calculo de porcentajes y saturacion.

La view queda como wrapper delgado:
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_tendencias(request):
    data = estadisticas_service.obtener_tendencias()
    return Response(data)
```

#### 2.4 Extraer logica de trabajo_service

**Origen**: Acciones custom de `TrabajoInvestigacionViewSet` — `chat_ia` (validacion inline), `recomendaciones` (manejo de errores inconsistente).

**Destino**: `backend/biblioteca/services/trabajo_service.py`

#### 2.5 Unificar `subir_trabajo` en `create()`

**Archivo**: `backend/biblioteca/views/trabajos.py`

**Accion**: Eliminar la action custom `subir_trabajo`. Sobrecargar `create()` del ViewSet para agregar `transaction.atomic()`:

```python
def create(self, request, *args, **kwargs):
    with transaction.atomic():
        return super().create(request, *args, **kwargs)
```

Esto elimina el endpoint duplicado `POST /api/trabajos/subir_trabajo/` y unifica en `POST /api/trabajos/`.

> **Impacto frontend**: Actualizar `SubirTrabajo.js` para usar el endpoint estandar.

#### 2.6 Renderer global para formato unificado

**Crear**: `backend/shared/renderers.py`

```python
"""Custom DRF renderer para formato de respuesta estandarizado."""
from rest_framework.renderers import JSONRenderer

class StandardResponseRenderer(JSONRenderer):
    """
    Envuelve todas las respuestas en formato:
    {
        "success": true/false,
        "data": <payload>,
        "message": <string o null>
    }
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response')
        
        if response is not None and response.status_code >= 400:
            wrapped = {
                'success': False,
                'data': None,
                'message': data.get('detail', str(data)) if isinstance(data, dict) else str(data),
                'errors': data if isinstance(data, dict) else None,
            }
        else:
            wrapped = {
                'success': True,
                'data': data,
                'message': None,
            }
        
        return super().render(wrapped, accepted_media_type, renderer_context)
```

**Registrar en `settings.py`**:
```python
REST_FRAMEWORK = {
    ...
    'DEFAULT_RENDERER_CLASSES': [
        'shared.renderers.StandardResponseRenderer',
    ],
}
```

**Excluir de Swagger/ReDoc**: Swagger y ReDoc tienen sus propios renderers, no se ven afectados si se configuran con `renderer_classes` propios en la schema_view.

**Eliminar**: `api_success_response()` y `api_error_response()` de `shared/response_helpers.py` una vez migrado (ya no son necesarios con el renderer global).

---

### Fase 3: Modelo de Datos y Validaciones

#### 3.1 Corregir `UserSerializer`

**Archivo**: `backend/biblioteca/serializers/users.py`

**Bug 1 — validate_email rechaza propio email en update**:
```python
def validate_email(self, value):
    qs = User.objects.filter(email__iexact=value)
    if self.instance:
        qs = qs.exclude(pk=self.instance.pk)
    if qs.exists():
        raise serializers.ValidationError('Este correo ya esta registrado.')
    return value.lower()
```

**Bug 2 — password update sin hashear**:
```python
def update(self, instance, validated_data):
    password = validated_data.pop('password', None)
    instance = super().update(instance, validated_data)
    if password:
        instance.set_password(password)
        instance.save(update_fields=['password'])
    return instance
```

**Bug 3 — Auto-crear Perfil al registrar**:

Opcion preferida: signal `post_save` en `User`:

**Crear**: `backend/biblioteca/signals.py`
```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from biblioteca.models import Perfil, Rol

@receiver(post_save, sender=User)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        rol_default = Rol.objects.filter(nombre='Estudiante').first()
        Perfil.objects.get_or_create(
            usuario=instance,
            defaults={'rol': rol_default}
        )
```

**Registrar** en `backend/biblioteca/apps.py`:
```python
class BibliotecaConfig(AppConfig):
    ...
    def ready(self):
        import biblioteca.signals  # noqa: F401
```

#### 3.2 Unique constraint en User.email

**Crear migracion custom**:
```python
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('biblioteca', '0007_...'),  # ultima migracion existente
    ]
    
    operations = [
        migrations.RunSQL(
            sql='ALTER TABLE auth_user ADD CONSTRAINT unique_user_email UNIQUE (email);',
            reverse_sql='ALTER TABLE auth_user DROP CONSTRAINT IF EXISTS unique_user_email;',
        ),
    ]
```

> **Precaucion**: Verificar que no existan emails duplicados en la BD antes de aplicar.

#### 3.3 Mover `tipo_solicitud` choices al modelo

**Archivo**: `backend/biblioteca/models/operaciones.py`

```python
class SolicitudPrestamo(models.Model):
    class TipoSolicitud(models.TextChoices):
        CONSULTA = 'consulta', 'Consulta'
        PRESTAMO = 'prestamo', 'Prestamo'
        DESCARGA = 'descarga', 'Descarga'
    
    tipo_solicitud = models.CharField(
        max_length=20,
        choices=TipoSolicitud.choices,
    )
    ...
```

**Eliminar** la validacion hardcodeada en `SolicitudPrestamoSerializer.validate_tipo_solicitud`.

#### 3.4 Corregir inconsistencias de modelo

| Item | Archivo | Accion |
|------|---------|--------|
| `blank=True, null=True` en TextFields | `catalogo.py` | Cambiar a `blank=True, default=""` (eliminar `null=True` de TextFields) |
| `unique_together` deprecado | `catalogo.py` linea 206 | Migrar a `constraints = [UniqueConstraint(fields=['trabajo', 'autor'], name='unique_autor_trabajo')]` |
| Falta `__str__` | `operaciones.py` | Agregar `__str__` a `SolicitudPrestamo` y `HistorialVisualizacion` |
| `datetime.now()` | `estadisticas.py` lineas 86, 159 | Cambiar a `timezone.now()` |

> Cada cambio de modelo requiere migracion. Agrupar en una sola migracion.

#### 3.5 Clasificacion: fix `trabajo` read_only

**Archivo**: `backend/biblioteca/serializers/clasificaciones.py`

**Problema**: `trabajo` es `read_only`, haciendo imposible crear clasificaciones via API.

**Solucion**: Usar `PrimaryKeyRelatedField` para escritura, mantener representacion expandida para lectura:

```python
class ClasificacionSerializer(serializers.ModelSerializer):
    trabajo = serializers.PrimaryKeyRelatedField(
        queryset=TrabajoInvestigacion.objects.all()
    )
    
    class Meta:
        model = Clasificacion
        fields = '__all__'
```

---

### Fase 4: Rendimiento

#### 4.1 Resolver N+1 queries

**4.1.1 TrabajoInvestigacionViewSet** (`trabajos.py`):

Agregar al `get_queryset()`:
```python
def get_queryset(self):
    return TrabajoInvestigacion.objects.select_related(
        'asesor__usuario',  # FK a Autor (que tiene FK a User via Perfil)
        'clasificacion',     # OneToOne reverse
    ).prefetch_related(
        'autores',
        'palabras_clave',
    )
```

**4.1.2 SolicitudPrestamoViewSet** (`solicitudes.py`):

```python
def get_queryset(self):
    return SolicitudPrestamo.objects.select_related(
        'trabajo',
        'usuario',
    ).prefetch_related(
        'trabajo__autores',
        'trabajo__palabras_clave',
    )
```

**4.1.3 HistorialVisualizacionViewSet** (`historial.py`):

```python
def get_queryset(self):
    return HistorialVisualizacion.objects.select_related(
        'trabajo',
        'usuario',
    ).prefetch_related(
        'trabajo__autores',
        'trabajo__palabras_clave',
    )
```

**4.1.4 Serializers**: Evaluar reemplazar la representacion completa anidada de `TrabajoInvestigacionSerializer` en `SolicitudPrestamoSerializer` e `HistorialVisualizacionSerializer` por un serializer ligero (`TrabajoListSerializer`) que solo incluya `id`, `titulo`, `thumbnail`, `tipo`, para endpoints de listado.

#### 4.2 Instalar y configurar `django-filter`

**Instalar**: Agregar `django-filter` a `requirements.txt`.

**Configurar en `settings.py`**:
```python
INSTALLED_APPS = [
    ...
    'django_filters',
]

REST_FRAMEWORK = {
    ...
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
}
```

**Crear**: `backend/biblioteca/filters.py`

```python
"""FilterSets declarativos para los ViewSets de biblioteca."""
import django_filters
from biblioteca.models import TrabajoInvestigacion

class TrabajoFilter(django_filters.FilterSet):
    tipo = django_filters.CharFilter(field_name='tipo')
    carrera = django_filters.CharFilter(field_name='carrera', lookup_expr='icontains')
    autor = django_filters.CharFilter(method='filter_por_autor')
    palabra_clave = django_filters.CharFilter(method='filter_por_palabra_clave')
    anio = django_filters.NumberFilter(field_name='anio_publicacion')
    titulo = django_filters.CharFilter(field_name='titulo', lookup_expr='icontains')
    fecha_desde = django_filters.DateFilter(field_name='fecha_publicacion', lookup_expr='gte')
    fecha_hasta = django_filters.DateFilter(field_name='fecha_publicacion', lookup_expr='lte')
    nivel_academico = django_filters.CharFilter(field_name='nivel_academico')
    
    class Meta:
        model = TrabajoInvestigacion
        fields = []
    
    def filter_por_autor(self, queryset, name, value):
        return queryset.filter(autores__nombre__icontains=value)
    
    def filter_por_palabra_clave(self, queryset, name, value):
        return queryset.filter(palabras_clave__nombre__icontains=value)
```

**Actualizar ViewSet**:
```python
class TrabajoInvestigacionViewSet(ModelViewSet):
    filterset_class = TrabajoFilter
    ...
```

**Eliminar**: Toda la logica de filtrado inline de `get_queryset()` (lineas ~48-81 de `trabajos.py`).

**Actualizar `search_service.py`**: Reutilizar `TrabajoFilter` donde `_apply_metadata_filters()` duplica la logica, o al menos importar las mismas definiciones de filtros.

#### 4.3 Pre-computar TF-IDF para ml_service

**Archivo**: `backend/ia_core/services/ml_service.py`

**Estrategia**:
1. Crear modelo `TrabajoSimilitud` o tabla para persistir la matriz de similitudes pre-computada.
2. Filtrar solo trabajos academicos (tesis, proyectos de grado, trabajo practico) — ignorar otros tipos.
3. Usar solo metadatos disponibles (`titulo`, `resumen`, texto procesado) — no leer archivos PDF.
4. Re-computar solo cuando se agrega/modifica un trabajo (signal o management command).

**Nuevo modelo** en `ia_core/models.py`:
```python
class TrabajoSimilitud(models.Model):
    """
    Almacena similitudes pre-computadas entre trabajos academicos.
    
    Attributes:
        trabajo_origen: Trabajo de referencia.
        trabajo_destino: Trabajo similar.
        score: Puntuacion de similitud coseno (0-1).
        updated_at: Ultima actualizacion del calculo.
    """
    trabajo_origen = models.ForeignKey(
        'biblioteca.TrabajoInvestigacion',
        on_delete=models.CASCADE,
        related_name='similitudes_origen',
    )
    trabajo_destino = models.ForeignKey(
        'biblioteca.TrabajoInvestigacion',
        on_delete=models.CASCADE,
        related_name='similitudes_destino',
    )
    score = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['trabajo_origen', 'trabajo_destino']
        indexes = [
            models.Index(fields=['trabajo_origen', '-score']),
        ]
```

**Management command**: `python manage.py compute_similarities`
- Filtra trabajos por tipo academico.
- Construye matriz TF-IDF una vez.
- Persiste top-N similitudes por trabajo.
- Se ejecuta manualmente o via cron.

**Actualizar `obtener_recomendaciones()`**:
```python
def obtener_recomendaciones(trabajo_id, limit=5):
    return TrabajoSimilitud.objects.filter(
        trabajo_origen_id=trabajo_id,
    ).select_related(
        'trabajo_destino'
    ).order_by('-score')[:limit]
```

**Signal para invalidar** cuando se crea/modifica un trabajo:
- Marcar similitudes como stale o recalcular solo para ese trabajo.

#### 4.4 Agregar `db_index` a campos consultados frecuentemente

**Migracion**:
- `SolicitudPrestamo.estado`: agregar `db_index=True`
- `Convocatoria.estado`: agregar `db_index=True`

---

### Fase 5: Permisos

#### 5.1 Migrar permisos a campos booleanos del Rol

**Archivos afectados**: `backend/biblioteca/permissions.py`

**Estado actual**: Todas las clases comparan `rol.nombre` como string:
```python
# Ejemplo actual
def _is_bibliotecario(self, user):
    rol = self._get_user_role(user)
    return rol and rol.nombre == 'Bibliotecario'
```

**Migracion**: Cambiar a usar los campos booleanos existentes en `Rol`:
```python
# Nuevo
class CanManageUsers(BaseRolePermission):
    message = 'Se requiere permiso de gestion de usuarios.'
    
    def has_permission(self, request, view):
        rol = self._get_user_role(request.user)
        return rol is not None and rol.puede_gestionar_usuarios

class CanManageLoans(BaseRolePermission):
    message = 'Se requiere permiso de gestion de prestamos.'
    
    def has_permission(self, request, view):
        rol = self._get_user_role(request.user)
        return rol is not None and rol.puede_aprobar_prestamos

class CanDeleteContent(BaseRolePermission):
    message = 'Se requiere permiso de eliminacion de contenido.'
    
    def has_permission(self, request, view):
        if request.method != 'DELETE':
            return True
        rol = self._get_user_role(request.user)
        return rol is not None and rol.puede_eliminar_contenido

class CanViewStats(BaseRolePermission):
    message = 'Se requiere permiso para ver estadisticas.'
    
    def has_permission(self, request, view):
        rol = self._get_user_role(request.user)
        return rol is not None and rol.puede_ver_estadisticas
```

**Actualizar `setup_roles` management command**: Asegurar que los roles por defecto tengan los booleanos correctos:

| Rol | puede_gestionar_usuarios | puede_eliminar_contenido | puede_ver_estadisticas | puede_aprobar_prestamos |
|-----|--------------------------|--------------------------|------------------------|-------------------------|
| Estudiante | False | False | False | False |
| Bibliotecario | False | True | True | True |
| Director | True | True | True | True |
| Administrador | True | True | True | True |

**Mantener `_is_director` y `_is_bibliotecario`** como helpers de conveniencia para logica no cubierta por los booleanos (ej: queryset filtering), pero la logica de permisos principal usa los booleanos.

#### 5.2 Eliminar codigo muerto de permisos

| Clase | Razon | Accion |
|-------|-------|--------|
| `IsOwnerOrStaff` | Definida pero nunca usada en ninguna view | Eliminar |
| `IsAuthenticatedForChat` | Duplica `IsAuthenticated` de DRF | Reemplazar por `IsAuthenticated` en la view que la usa, eliminar clase |

#### 5.3 Extraer mixin de queryset por rol

**Crear**: `backend/biblioteca/mixins.py`

```python
"""Mixins reutilizables para ViewSets de biblioteca."""

class RoleFilteredQuerysetMixin:
    """
    Mixin que filtra el queryset segun el rol del usuario.
    
    - Superusers, staff, directores y bibliotecarios ven todo.
    - El resto solo ve sus propios registros (filtrado por campo `user_field`).
    """
    user_field = 'usuario'  # Override en subclases si el campo se llama distinto
    
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        if user.is_superuser or user.is_staff:
            return qs
        
        if hasattr(user, 'perfil') and user.perfil.rol:
            rol = user.perfil.rol
            if rol.puede_gestionar_usuarios or rol.puede_ver_estadisticas:
                return qs
        
        return qs.filter(**{self.user_field: user})
```

**Aplicar en**: `SolicitudPrestamoViewSet`, `HistorialVisualizacionViewSet`, `PerfilViewSet` — eliminando la logica duplicada en cada `get_queryset()`.

---

### Fase 6: API Versioning

#### 6.1 Agregar prefijo `/api/v1/`

**Archivo**: `backend/core/urls.py`

Cambiar:
```python
# Antes
path('', include('biblioteca.urls')),
path('api/ia/', include('ia_core.urls')),

# Despues
path('api/v1/', include('biblioteca.urls')),
path('api/v1/ia/', include('ia_core.urls')),
```

**Archivo**: `backend/biblioteca/urls.py`

Eliminar el prefijo `api/` interno ya que ahora viene del root:
```python
# Antes
path('api/', include(router.urls)),

# Despues
path('', include(router.urls)),
```

**Impacto frontend**: Actualizar `API_URL` base o la baseURL del axios client para incluir `/api/v1/`.

> **Nota**: Mantener temporalmente las rutas antiguas sin version como redirect o alias durante la transicion si hay consumidores externos. Si el unico consumidor es el frontend propio, cambiar directamente.

---

### Fase 7: Tests

#### 7.1 Estrategia general

**Prioridad**: Flujos criticos primero.

**Estructura de archivos**:
```
backend/biblioteca/tests/
    __init__.py
    test_models.py
    test_serializers.py
    test_views.py
    test_permissions.py
    test_services.py
    test_filters.py
backend/ia_core/tests/
    __init__.py
    test_services.py
    test_views.py
```

**Eliminar**: `backend/biblioteca/tests.py` (stub vacio). Reemplazar por paquete `tests/`.

#### 7.2 Tests prioritarios — Flujos criticos

**7.2.1 Flujo de autenticacion y registro**:
```
- test_register_creates_user_and_perfil
- test_register_duplicate_email_fails
- test_register_returns_token
- test_login_valid_credentials
- test_login_invalid_credentials
- test_update_user_password_hashes_correctly
- test_update_user_email_excludes_self
```

**7.2.2 Flujo de trabajos de investigacion**:
```
- test_create_trabajo_authenticated
- test_create_trabajo_unauthenticated_fails
- test_create_trabajo_with_transaction_rollback
- test_list_trabajos_with_filters
- test_retrieve_trabajo_includes_autores_palabras
- test_delete_trabajo_requires_permission
- test_recomendaciones_endpoint
```

**7.2.3 Flujo de solicitudes de prestamo**:
```
- test_create_solicitud
- test_aprobar_solicitud_requires_permission
- test_rechazar_solicitud_requires_permission
- test_user_sees_only_own_solicitudes
- test_bibliotecario_sees_all_solicitudes
```

#### 7.3 Tests unitarios

**7.3.1 Modelos**:
```
- test_perfil_auto_created_on_user_creation (signal)
- test_trabajo_str_representation
- test_solicitud_tipo_choices_validation
- test_unique_email_constraint
- test_unique_autor_trabajo_constraint
```

**7.3.2 Serializers**:
```
- test_user_serializer_validate_email_update
- test_user_serializer_password_hashing
- test_trabajo_serializer_nested_representation
- test_clasificacion_serializer_accepts_trabajo_id
- test_solicitud_serializer_tipo_validation
```

**7.3.3 Permisos**:
```
- test_can_manage_users_with_boolean_true
- test_can_manage_users_with_boolean_false
- test_can_manage_loans_bibliotecario
- test_can_delete_content_non_delete_method_passes
- test_role_filtered_queryset_mixin_student_sees_own
- test_role_filtered_queryset_mixin_director_sees_all
```

**7.3.4 Services**:
```
- test_thumbnail_service_generates_thumbnail
- test_thumbnail_service_handles_missing_file
- test_estadisticas_service_returns_expected_shape
- test_ml_service_recomendaciones_from_precomputed
- test_ml_service_verificar_originalidad
```

#### 7.4 Tests de integracion API

Tests que hacen requests HTTP completos a los endpoints:
```
- test_full_trabajo_crud_lifecycle
- test_full_solicitud_lifecycle (crear -> aprobar/rechazar)
- test_api_response_format_is_standard (verificar {success, data, message})
- test_cors_headers_present
- test_serve_pdf_requires_auth
- test_serve_pdf_blocks_path_traversal
- test_filter_trabajos_by_multiple_params
```

#### 7.5 Tests E2E con Playwright

**Instalar**: `pip install playwright pytest-playwright`

**Flujos a cubrir**:
```
- test_e2e_login_and_redirect
- test_e2e_register_and_auto_login
- test_e2e_crear_trabajo_completo
- test_e2e_explorar_con_filtros
- test_e2e_solicitar_prestamo
- test_e2e_admin_manage_users
```

> **Nota**: Los tests E2E requieren que tanto backend como frontend esten corriendo. Documentar instrucciones de setup.

---

## 5. Estructura Final Afectada

```
backend/
    core/
        settings.py              # LOGGING, CORS seguro, DEBUG env, renderer global
    shared/
        __init__.py
        constants.py             # + TECNOLOGIAS_CONOCIDAS (extraido de estadisticas)
        response_helpers.py      # DEPRECADO -> eliminado (reemplazado por renderer)
        renderers.py             # NUEVO: StandardResponseRenderer
    biblioteca/
        models/
            operaciones.py       # + TipoSolicitud choices, + __str__, + db_index
            catalogo.py          # - generate_thumbnail(), - save() override, + fixes TextField
        views/
            trabajos.py          # - subir_trabajo action, - filtrado inline, + create() override
            estadisticas.py      # Wrapper delgado -> delega a service
            solicitudes.py       # - logica duplicada queryset
            historial.py         # - logica duplicada queryset
            perfiles.py          # - logica duplicada queryset
            pdf.py               # + sanitizacion path, + auth required
        serializers/
            users.py             # + validate_email fix, + update(), + password hashing
            clasificaciones.py   # + trabajo writable
            solicitudes.py       # - validate_tipo_solicitud hardcodeado
        services/                # NUEVO paquete
            __init__.py
            thumbnail_service.py
            trabajo_service.py
            estadisticas_service.py
            solicitud_service.py
        signals.py               # NUEVO: auto-crear Perfil
        permissions.py           # Migrado a booleanos, - codigo muerto
        mixins.py                # NUEVO: RoleFilteredQuerysetMixin
        filters.py               # NUEVO: django-filter FilterSets
        tests/                   # NUEVO paquete (reemplaza tests.py stub)
            __init__.py
            test_models.py
            test_serializers.py
            test_views.py
            test_permissions.py
            test_services.py
            test_filters.py
    ia_core/
        models.py                # + TrabajoSimilitud
        services/
            ml_service.py        # Refactored: usa TrabajoSimilitud pre-computado
        management/commands/
            compute_similarities.py  # NUEVO
        tests/                   # NUEVO paquete
            __init__.py
            test_services.py
            test_views.py
```

---

## 6. Acceptance Criteria

### Fase 1: Seguridad
- [ ] `DEBUG` se lee de variable de entorno, no hardcodeado.
- [ ] `ALLOWED_HOSTS` se lee de variable de entorno.
- [ ] `CORS_ALLOW_ALL_ORIGINS` es `False`; `CORS_ALLOWED_ORIGINS` esta configurado.
- [ ] `X_FRAME_OPTIONS` es `'DENY'`; `serve_pdf` usa `@xframe_options_sameorigin`.
- [ ] `serve_pdf` sanitiza paths con `Path.resolve()` y requiere autenticacion.
- [ ] `serve_pdf` responde 404 para paths que escapan de `MEDIA_ROOT`.
- [ ] `LOGGING` dict existe en settings con handlers para `biblioteca` e `ia_core`.
- [ ] No hay llamadas `print()` en el codigo de produccion.
- [ ] `LANGUAGE_CODE` es `'es'`.
- [ ] `.env.example` documenta todas las variables con valores seguros sugeridos para produccion.

### Fase 2: Arquitectura
- [ ] `biblioteca/services/` existe con 4 archivos de servicio.
- [ ] `TrabajoInvestigacion` no contiene `generate_thumbnail()` ni logica en `save()`.
- [ ] `estadisticas_tendencias` view es < 15 lineas; logica esta en `estadisticas_service.py`.
- [ ] `subir_trabajo` action no existe; `create()` esta sobrecargado con `transaction.atomic()`.
- [ ] `StandardResponseRenderer` esta registrado en `REST_FRAMEWORK`.
- [ ] TODAS las respuestas API (excluyendo Swagger) tienen formato `{success, data, message}`.
- [ ] `api_success_response` y `api_error_response` estan eliminados de `response_helpers.py`.

### Fase 3: Modelo de Datos
- [ ] `UserSerializer.validate_email` excluye instancia actual en updates.
- [ ] `UserSerializer.update()` hashea passwords correctamente.
- [ ] Signal `post_save` crea `Perfil` automaticamente al crear `User`.
- [ ] Constraint `UNIQUE` existe en `User.email` a nivel BD.
- [ ] `SolicitudPrestamo.tipo_solicitud` usa `TextChoices`.
- [ ] TextFields no combinan `blank=True` con `null=True`.
- [ ] `unique_together` migrado a `UniqueConstraint`.
- [ ] `SolicitudPrestamo` y `HistorialVisualizacion` tienen `__str__`.
- [ ] `ClasificacionSerializer.trabajo` es writable.
- [ ] `estadisticas.py` usa `timezone.now()`, no `datetime.now()`.

### Fase 4: Rendimiento
- [ ] `TrabajoInvestigacionViewSet.get_queryset()` usa `select_related` y `prefetch_related`.
- [ ] `SolicitudPrestamoViewSet.get_queryset()` usa `select_related` y `prefetch_related`.
- [ ] `HistorialVisualizacionViewSet.get_queryset()` usa `select_related` y `prefetch_related`.
- [ ] `django-filter` instalado y `TrabajoFilter` registrado.
- [ ] `TrabajoSimilitud` modelo existe con index por `(trabajo_origen, -score)`.
- [ ] `compute_similarities` management command funciona correctamente.
- [ ] `obtener_recomendaciones()` lee de `TrabajoSimilitud`, no recalcula TF-IDF.
- [ ] `SolicitudPrestamo.estado` tiene `db_index=True`.

### Fase 5: Permisos
- [ ] `CanManageUsers` verifica `rol.puede_gestionar_usuarios`.
- [ ] `CanManageLoans` verifica `rol.puede_aprobar_prestamos`.
- [ ] `CanDeleteContent` verifica `rol.puede_eliminar_contenido`.
- [ ] `IsOwnerOrStaff` eliminado.
- [ ] `IsAuthenticatedForChat` eliminado y reemplazado por `IsAuthenticated`.
- [ ] `RoleFilteredQuerysetMixin` aplicado en solicitudes, historial y perfiles.
- [ ] Logica de queryset duplicada eliminada de los 3 viewsets.

### Fase 6: API Versioning
- [ ] Todos los endpoints responden bajo `/api/v1/`.
- [ ] No existe doble prefijo `/api/api/`.

### Fase 7: Tests
- [ ] `biblioteca/tests/` es un paquete con 6 archivos de test.
- [ ] `ia_core/tests/` es un paquete con 2 archivos de test.
- [ ] `python manage.py test` ejecuta sin errores.
- [ ] Tests de flujos criticos pasan (auth, trabajos, solicitudes).
- [ ] Test de path traversal en `serve_pdf` pasa.
- [ ] Test de formato de respuesta estandar pasa.

---

## 7. Decisions Log

| Fecha | Decision | Alternativas consideradas | Razon |
|-------|----------|--------------------------|-------|
| 2026-02-13 | Extraer generate_thumbnail a servicio | Mantener en modelo | SRP: modelos no deben hacer I/O |
| 2026-02-13 | Migrar permisos a booleanos del Rol | Eliminar booleanos / mantener strings | Mas flexible, permite roles custom sin cambiar codigo |
| 2026-02-13 | Formato unico {success, data, message} | DRF estandar / mantener mixto | Frontend uniforme, un solo patron de consumo |
| 2026-02-13 | Renderer global DRF | Middleware / mixin por ViewSet | Automatico, cero codigo repetido en views |
| 2026-02-13 | Corregir los 4 bugs de UserSerializer | Corregir parcialmente | Todos son criticos para la integridad de datos |
| 2026-02-13 | django-filter para filtrado | Filtrado manual limpio | Declarativo, menos codigo, estandar de la industria |
| 2026-02-13 | Pre-computar TF-IDF en BD | Cache en memoria / mantener actual | Persistente, no depende del proceso, solo datos academicos |
| 2026-02-13 | N+1 con ORM Django | Libreria auto-prefetch | Control explicito, sin dependencia extra |
| 2026-02-13 | Unificar subir_trabajo en create() | Mantener separado | Elimina endpoint duplicado y codigo redundante |
| 2026-02-13 | API versioning /api/v1/ | Sin versioning / header-based | Previene breaking changes, estandar REST |
| 2026-02-13 | Signal post_save para Perfil | Crear en serializer / manual | Automatico para cualquier forma de crear User |
| 2026-02-13 | Convocatorias independientes | Agregar FK a Trabajo | Son informativas, decision explicita del usuario |
| 2026-02-13 | Seguridad: configurar solo dev | Hardening produccion completo | Proyecto aun en desarrollo local |
| 2026-02-13 | Configurar LOGGING formal | Solo reemplazar prints | Infraestructura necesaria, ya hay loggers sin config |
| 2026-02-13 | Eliminar permisos muertos | Mantener por si se usan | IsOwnerOrStaff no se usa, IsAuthenticatedForChat duplica built-in |
| 2026-02-13 | tipo_solicitud como TextChoices | Mantener hardcodeado en serializer | Source of truth en modelo, DRY |
| 2026-02-13 | datetime.now() -> timezone.now() | Mantener sin timezone | USE_TZ=True en settings, consistencia |
| 2026-02-13 | Tests con prioridad flujos criticos | Cobertura pareja | Maximo impacto con minimo esfuerzo inicial |
| 2026-02-13 | Playwright para E2E | Cypress / sin decidir | Moderno, rapido, buena DX |

---

## 8. Observaciones y Decisiones Diferidas

### Documentar para produccion (no implementar ahora)

1. **SECRET_KEY**: Generar key unica para produccion, nunca usar el fallback.
2. **CORS**: Restringir `CORS_ALLOWED_ORIGINS` al dominio de produccion.
3. **DEBUG**: Debe ser `False` en produccion (ya lee de env var).
4. **ALLOWED_HOSTS**: Configurar con dominio real.
5. **HTTPS**: Activar `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`.
6. **Rate limiting**: Agregar throttling en endpoints de registro y login.
7. **Email verification**: Implementar verificacion de email en registro.

### Notas tecnicas

- La migracion de unique constraint en email requiere verificar duplicados existentes antes de aplicar.
- El API versioning impacta al frontend: actualizar `baseURL` del axios client.
- El renderer global excluye Swagger/ReDoc automaticamente si estos configuran sus propios renderers.
- Los tests E2E con Playwright requieren que ambos servidores (backend:8000 + frontend:3000) esten corriendo.
- `TrabajoSimilitud` puede crecer cuadraticamente (N*top_K registros). Con 10k trabajos y top-10, son 100k registros — manejable.
