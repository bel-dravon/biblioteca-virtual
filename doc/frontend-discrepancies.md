# Discrepancias del Frontend con el Backend Propuesto

Basado en el `api-endpoints.json` y la estructura del frontend, estas son las principales áreas que requieren ajuste en el frontend para una comunicación correcta con el backend:

---

## 1. `TrabajoInvestigacion` (Trabajos de Investigación) - Visualización

*   **Endpoint Faltante:** El frontend necesita implementar llamadas y componentes para el endpoint de visualización de PDFs:
    *   **Método:** `GET`
    *   **Ruta:** `/api/documentos/{material_id}/paginas/`
    *   **Acción Requerida en Frontend:**
        *   Modificar o crear una nueva función en `frontend/src/api/trabajos.js` para realizar una petición GET a este endpoint, aceptando `material_id` y posiblemente un parámetro `page` si el backend lo implementa para la visualización paginada.
        *   Desarrollar componentes de UI capaces de incrustar o mostrar las imágenes de las páginas PDF recibidas, manejando la lógica de vista completa para internos y el límite de 15 páginas para externos.

---

## 2. `TrabajoInvestigacion` (Trabajos de Investigación) - Descarga

*   **Endpoint Faltante:** Si bien existe la verificación de `puede_descargar`, falta la acción explícita de descarga que consuma el crédito.
    *   **Método:** `GET` (asumiendo que el backend implementará un endpoint como `/api/trabajos/{id}/descargar/`)
    *   **Ruta:** `/api/trabajos/{id}/descargar/` (ruta hipotética, a confirmar con la implementación backend)
    *   **Acción Requerida en Frontend:**
        *   Crear una función en `frontend/src/api/trabajos.js` que realice la petición GET a este endpoint y maneje la descarga del archivo (ej. utilizando `responseType: 'blob'` con Axios).
        *   Integrar esta función en la UI para el botón/acción de descarga, asegurando que se consuma el crédito de descarga.

---

## 3. `Convocatoria` (Convocatorias) - Estado Calculado

*   **Impacto de Cambio en Backend:** Si el campo `estado` en el backend se convierte en una propiedad calculada (`estado_actual`) y se elimina el campo directo.
    *   **Acción Requerida en Frontend:**
        *   Actualizar `frontend/src/api/convocatorias.js` y todos los componentes de UI (`pages`, `components`) que muestren o filtren por el estado de las convocatorias para que utilicen la nueva propiedad `estado_actual`.
        *   Asegurarse de que el frontend no intente enviar el campo `estado` al crear o actualizar convocatorias, ya que será de solo lectura.

---

## 4. `SolicitudPrestamo` (Solicitudes de Préstamo) - Gestión de Stock

*   **Manejo de Errores:** Aunque no es un cambio de endpoint, la nueva lógica de gestión de stock en el backend puede generar errores de validación si no hay stock disponible.
    *   **Acción Requerida en Frontend:**
        *   Mejorar el manejo de errores en `frontend/src/api/prestamos.js` y en los formularios de UI (`pages`, `components`) relacionados con la creación/actualización de solicitudes de préstamo, para mostrar mensajes amigables al usuario si la solicitud falla debido a la falta de stock.

---

## 5. `Notificacion` (Notificaciones) - Interacción con UI

*   **Integración UI/UX:** El backend ya expone los endpoints para notificaciones, pero el frontend necesita la implementación de la UI para interactuar con ellas.
    *   **Acción Requerida en Frontend:**
        *   Desarrollar componentes de UI (ej. un icono de campana con contador, un listado de notificaciones) para mostrar las notificaciones de un usuario autenticado.
        *   Utilizar los endpoints `GET /api/notificaciones/` y `PATCH /api/notificaciones/{id}/` (para marcar como leída) en `frontend/src/api/notificaciones.js`.

---

Este análisis cubre las principales áreas que requieren atención. Se recomienda una revisión detallada de cada archivo de servicio (`frontend/src/api/*.js`) y los componentes de UI que interactúan con estos datos para asegurar una integración completa y robusta.
