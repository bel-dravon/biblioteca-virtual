# Documento de Contexto Tecnico - Biblioteca Virtual

## 1. Stack Tecnologico Principal

- **Backend:** Django `5.2.6`, Django REST Framework `3.16.1`, `drf-yasg` para Swagger/Redoc.
- **Frontend:** React `19.1.1`, React Router DOM `7.9.6`, MUI `7.3.5`, Axios `1.12.1`.
- **Tailwind:** `3.4.17` esta instalado junto con PostCSS/Autoprefixer, pero el frontend visible se apoya principalmente en MUI y no en una capa Tailwind dominante.
- **Base de datos:** PostgreSQL mediante `django.db.backends.postgresql` y `psycopg2-binary 2.9.10`.
- **Configuracion PostgreSQL:** se resuelve por variables de entorno en `backend/core/settings.py`:
  - `DB_NAME` (default: `bibliotecadb`)
  - `DB_USER` (default: `postgres`)
  - `DB_PASSWORD` (default vacio)
  - `DB_HOST` (default: `localhost`)
  - `DB_PORT` (default: `5432`)
- **Modulo IA:** Gemini (`google-generativeai`), ChromaDB persistente, scikit-learn, pytesseract, pdf2image y PyMuPDF.
- **Observacion IA/vector store:** el modelo `ThesisEmbedding` soporta `pgvector` si la libreria existe, pero `pgvector` no aparece en `backend/requirements.txt`; en la practica, el flujo de busqueda actual depende de **ChromaDB** en `backend/chroma_db/`.

## 2. Estructura de Directorios

```text
biblioteca-virtual/
├── backend/
│   ├── biblioteca/
│   │   ├── management/
│   │   ├── models/
│   │   ├── serializers/
│   │   ├── views/
│   │   ├── permissions.py
│   │   └── urls.py
│   ├── core/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── ia_core/
│   │   ├── management/commands/
│   │   ├── services/
│   │   ├── models.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── shared/
│   │   ├── constants.py
│   │   └── response_helpers.py
│   ├── chroma_db/
│   ├── documentos_para_procesar/
│   ├── media/
│   ├── manage.py
│   └── requirements.txt
├── docs/
├── frontend/
│   ├── e2e/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── constants/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       │   ├── admin/
│       │   └── trabajo/
│       ├── theme/
│       ├── App.js
│       └── index.js
├── AGENTS.md
└── prop.txt
```

## 3. Modelos de Base de Datos (Django)

### App `biblioteca`

- **`Rol`**
  - Catalogo de roles de usuario.
  - Contiene permisos booleanos de negocio: gestionar usuarios, eliminar contenido, ver estadisticas, aprobar prestamos.

- **`Perfil`**
  - Extension de `django.contrib.auth.models.User`.
  - Relacion `OneToOne` con `User`.
  - Relacion `ForeignKey` hacia `Rol`.
  - Es la pieza que conecta autenticacion base de Django con autorizacion del dominio.

- **`PalabraClave`**
  - Descriptor tematico reutilizable para clasificar libros y trabajos.

- **`Libro`**
  - Inventario de libros fisicos.
  - Relacion `ManyToMany` con `PalabraClave`.
  - Incluye stock y metadatos bibliograficos clasicos.

- **`TrabajoInvestigacion`**
  - Entidad central del sistema.
  - Representa tesis, monografias, proyectos de grado, trabajos dirigidos y libros digitales.
  - Relacion `ManyToMany` con `PalabraClave`.
  - Guarda PDF (`archivo_ruta`), thumbnail, resumen, contenido OCR/indexado y metadatos academicos.
  - Es el nodo principal usado por catalogo, historial, prestamos y busqueda inteligente.

- **`SolicitudPrestamo`**
  - Relacion `ForeignKey` hacia `TrabajoInvestigacion`.
  - Relacion `ForeignKey` hacia `User`.
  - Modela el flujo de solicitud/aprobacion/rechazo/devolucion.

- **`HistorialVisualizacion`**
  - Relacion `ForeignKey` hacia `TrabajoInvestigacion`.
  - Relacion `ForeignKey` opcional hacia `User`.
  - Guarda fecha e IP de acceso para auditoria y estadisticas.

- **`Convocatoria`**
  - Publica convocatorias academicas con fechas, estado y adjuntos.
  - No tiene relaciones directas con otros modelos del dominio principal.

### App `ia_core`

- **`ThesisEmbedding`**
  - Relacion `OneToOne` con `TrabajoInvestigacion`.
  - Guarda embedding, texto indexado y metadata JSON.
  - El campo vectorial usa `pgvector` si esta disponible; si no, cae a `ArrayField` de PostgreSQL.
  - Sirve como base para analytics semanticos, aunque el flujo activo de recuperacion usa ChromaDB.

### Relaciones principales resumidas

```text
User 1---1 Perfil n---1 Rol
TrabajoInvestigacion n---n PalabraClave
Libro n---n PalabraClave
SolicitudPrestamo n---1 TrabajoInvestigacion
SolicitudPrestamo n---1 User
HistorialVisualizacion n---1 TrabajoInvestigacion
HistorialVisualizacion n---0..1 User
TrabajoInvestigacion 1---1 ThesisEmbedding
```

## 4. Rutas y Endpoints Clave

### Backend expuesto hoy desde `biblioteca.urls`

Base real del frontend: `http://127.0.0.1:8000/api/` (definida en `frontend/src/api/config.js`).

- **Autenticacion**
  - `POST /api/api-token-auth/` -> login por token DRF.

- **Usuarios, perfiles y roles**
  - `GET/POST/PATCH/DELETE /api/users/`
  - `GET/PATCH /api/perfiles/`
  - `GET /api/roles/`

- **Catalogo academico**
  - `GET/POST/PATCH/DELETE /api/trabajos/`
  - `POST /api/trabajos/subir_trabajo/`
  - `GET /api/libros/`
  - `GET/POST/PATCH/DELETE /api/palabras-clave/`
  - `GET/POST/PATCH/DELETE /api/convocatorias/`

- **Operacion y seguimiento**
  - `GET/POST /api/solicitudes/`
  - `PATCH /api/solicitudes/{id}/aprobar/`
  - `PATCH /api/solicitudes/{id}/rechazar/`
  - `GET/POST /api/historial/`

- **Estadisticas clasicas**
  - `GET /api/estadisticas/tendencias/`
  - `GET /api/estadisticas/trabajos-mes/`

- **Documentacion/soporte**
  - `GET /swagger/`
  - `GET /redoc/`
  - `GET /media/<archivo>.pdf` -> servido con vista especial para iframe en desarrollo.

### Conexion frontend-backend mas visible

- `frontend/src/api/trabajos.js` consume `/trabajos/` para exploracion, detalle, alta y edicion.
- `frontend/src/api/solicitudes.js` consume `/solicitudes/` y acciones `aprobar/rechazar`.
- `frontend/src/api/estadisticas.js` consume `/estadisticas/*`.
- `frontend/src/context/AuthContext.js` y `frontend/src/api/auth.js` consumen `/api-token-auth/`, `/perfiles/` y `/users/`.
- `frontend/src/pages/trabajo/TrabajoDetalle.js`, `frontend/src/components/ProtectedPDFViewer.js` y vistas de exploracion giran alrededor de `TrabajoInvestigacion`.

### Hallazgo importante de integracion

- El frontend ya intenta llamar a:
  - `POST /api/ia/search/`
  - `POST /api/ia/rag/`
- Esas rutas existen en `backend/ia_core/urls.py` como:
  - `search/`
  - `rag/`
  - `analytics/trends/`
- **Pero `backend/core/urls.py` actualmente no incluye `ia_core.urls`.**
- Con el estado actual del codigo, los endpoints IA parecen **implementados pero no montados** en el enrutador principal.

## 5. Estado Actual del Flujo de Busqueda

### Busqueda tradicional

- La busqueda clasica del catalogo ya esta implementada en `TrabajoInvestigacionViewSet.get_queryset()` en `backend/biblioteca/views/trabajos.py`.
- Permite filtrar por:
  - `titulo`
  - `resumen`
  - `autor`
  - `tipo`
  - `anio`
  - `palabra_clave`
- El frontend consume este flujo principalmente desde `frontend/src/api/trabajos.js` y las paginas de exploracion/detalle.

### Busqueda inteligente / RAG

Si, **ya existe una base de RAG y busqueda semantica**, aunque su integracion esta incompleta.

- **Archivos clave del flujo IA**
  - `backend/ia_core/services/search_service.py`
    - Genera embeddings de consulta con Gemini.
    - Consulta `ChromaDB` persistente en `backend/chroma_db/`.
    - Aplica filtros por metadata (`tipo`, `anio`).
    - Construye prompts RAG y respuestas en espanol.
    - Tiene tambien un flujo de preguntas sobre PDF usando Gemini + fallback a extraccion local con PyMuPDF.
  - `backend/ia_core/views.py`
    - `RagSearchView`: devuelve resultados semanticos.
    - `RagAnswerView`: recupera contexto y genera respuesta RAG.
    - `TrendAnalyticsView`: analytics semantico para administradores.
  - `backend/ia_core/urls.py`
    - Declara `search/`, `rag/` y `analytics/trends/`.
  - `backend/ia_core/management/commands/import_legacy_thesis.py`
    - Importa PDFs legacy.
    - Ejecuta OCR con `pdf2image` + `pytesseract`.
    - Crea `TrabajoInvestigacion`.
    - Parte el contenido en chunks y los inserta en ChromaDB con embeddings Gemini.
  - `frontend/src/pages/SmartLibrarySearch.js`
    - UI ya preparada para busqueda semantica y preguntas RAG.

### Estado real del flujo IA

- **Existe indexacion semantica en ChromaDB.**
- **Existe generacion RAG con Gemini.**
- **Existe UI frontend para consumirlo.**
- **Pero faltaria conectar `ia_core.urls` al `core/urls.py` para exponer realmente esos endpoints.**
- Ademas, hay una inconsistencia de arquitectura:
  - `ThesisEmbedding` existe para guardar embeddings en PostgreSQL.
  - `analytics_service.py` depende de `ThesisEmbedding`.
  - `import_legacy_thesis.py` actualmente indexa en **ChromaDB**, pero no crea registros `ThesisEmbedding`.
  - Por tanto, la parte de analytics basada en `ThesisEmbedding` podria quedar sin datos aunque la busqueda semantica en Chroma funcione.

## 6. Lectura Arquitectonica Rapida

- El **centro funcional** del sistema es `TrabajoInvestigacion`.
- El backend REST ya cubre autenticacion, catalogo, prestamos, historial y convocatorias.
- El frontend ya tiene servicios Axios alineados con esos recursos y rutas de interfaz para administracion y consulta.
- El modulo IA no esta en cero: ya hay OCR, embeddings, ChromaDB, prompts RAG y pantalla de busqueda inteligente.
- La brecha principal no es de concepto sino de **integracion final**: montar URLs IA y unificar la estrategia entre `ChromaDB` y `ThesisEmbedding`.
