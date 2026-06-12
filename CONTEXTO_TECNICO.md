# Contexto Técnico del Sistema de Biblioteca Virtual (Módulo IA)

Este documento describe el estado actual de la arquitectura y la implementación del módulo de Inteligencia Artificial (IA) en el sistema de Biblioteca Virtual, con un enfoque en el enrutamiento, el almacenamiento vectorial y la integración frontend.

## 1. Estado del Enrutamiento (Routing) de la API de IA

Las rutas de la API de Inteligencia Artificial, definidas en `backend/ia_core/urls.py`, incluyen los siguientes endpoints:
- `/ia/search/` (para búsqueda semántica)
- `/ia/rag/` (para preguntas asistidas por IA/RAG)
- `/ia/analytics/trends/` (para análisis de tendencias)

**Diagnóstico Actual:**
Actualmente, el enrutador principal del backend (`backend/core/urls.py`) **NO incluye** las rutas definidas en `backend/ia_core/urls.py`. Esto significa que, a pesar de estar definidas, las APIs de IA no son accesibles desde el exterior del backend, incluyendo el frontend.

**Acción Requerida:**
Se debe agregar `path('ia/', include('ia_core.urls')),` al `urlpatterns` en `backend/core/urls.py` para habilitar el acceso a estas funcionalidades.

## 2. Almacenamiento Vectorial (Brecha Arquitectónica)

El sistema utiliza vectores para diversas funcionalidades de IA, pero actualmente no existe una estrategia unificada de almacenamiento vectorial, lo que representa una brecha arquitectónica.

**Diagnóstico Actual:**
Existen dos mecanismos de almacenamiento vectorial en uso:
1.  **PostgreSQL (con pgvector):** El modelo `ThesisEmbedding` (`backend/ia_core/models.py`) almacena embeddings directamente en PostgreSQL. Esta estrategia es utilizada por el servicio de análisis de tendencias (`backend/ia_core/services/analytics_service.py`) para realizar clustering y análisis basado en los embeddings de las tesis.
2.  **ChromaDB:** El servicio de búsqueda (`backend/ia_core/services/search_service.py`) utiliza una instancia persistente de ChromaDB para almacenar y recuperar fragmentos de tesis indexados. Este es el motor subyacente para la búsqueda semántica y la recuperación de contexto para el módulo RAG (Generación Aumentada por Recuperación).

**Conclusión:** La estrategia de almacenamiento vectorial **NO está unificada**. El sistema emplea PostgreSQL para embeddings analíticos y ChromaDB para embeddings de búsqueda/RAG. Esta dualidad podría llevar a inconsistencias si no se gestiona correctamente y requiere procesos de sincronización o indexación separados.

## 3. Estado del Frontend de IA (`SmartLibrarySearch.js`)

El componente `SmartLibrarySearch.js` es la interfaz de usuario para las funcionalidades de búsqueda semántica y preguntas asistidas por IA.

**Diagnóstico Actual:**
El componente `frontend/src/pages/SmartLibrarySearch.js` está diseñado para interactuar con los endpoints de la API de IA. Específicamente, realiza llamadas `POST` a `/ia/search/` para la búsqueda semántica y a `/ia/rag/` para el modo de pregunta IA. Además, el manejo de fuentes para las respuestas RAG espera un `trabajo_id` para enlazar a las páginas de detalles de las tesis (`/work/{id}`).

**Impacto y Acción Requerida:**
Debido a que las rutas del backend de IA (`/ia/search/`, `/ia/rag/`) no están conectadas en el archivo `backend/core/urls.py` (como se detalla en la sección 1), todas las llamadas a la API desde `SmartLibrarySearch.js` destinadas a las funcionalidades de IA **fallarán**.

**Acción inmediata:** Conectar las rutas de `ia_core` en `backend/core/urls.py` es crucial para que el frontend pueda interactuar correctamente con el backend de IA.
