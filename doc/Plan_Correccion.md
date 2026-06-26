# Plan de Acción para la Corrección de Discrepancias

El siguiente plan detalla los pasos a seguir para alinear el sistema actual con la especificación funcional descrita en `Correccion.txt`. Cada sección aborda una discrepancia identificada, proponiendo soluciones y métodos de verificación.

---

## 1. Catálogo Bibliográfico: Visualización de TrabajoInvestigacion

*   **Problema:** Falta la lógica de visualización de `TrabajoInvestigacion` con límites de página para usuarios externos y vista completa sin descarga para internos. El campo `contenido` actual no es adecuado.

*   **Pasos Propuestos:**
    1.  **Análisis de Solución de Visualización:**
        *   Investigar la mejor estrategia para servir y visualizar archivos PDF de forma paginada o parcial sin permitir descarga directa. Esto probablemente requerirá una librería de procesamiento de PDF en el backend (ej. `PyPDF2`, `fitz`/`PyMuPDF`) y un componente de visualización en el frontend.
    2.  **Modificar Modelo `TrabajoInvestigacion` (`backend/biblioteca/models/catalogo.py`):**
        *   Eliminar el campo `contenido` de `TrabajoInvestigacion`, ya que el contenido principal será el archivo PDF referenciado por `archivo_ruta`.
        *   Asegurar que `archivo_ruta` sea el único campo para el contenido del documento.
    3.  **Crear/Modificar Endpoint de Visualización (`backend/biblioteca/views/trabajos.py`):**
        *   Desarrollar un nuevo `@action` o modificar un endpoint existente en `TrabajoInvestigacionViewSet` (ej. `/api/trabajos/{id}/visualizar/`).
        *   Implementar la lógica para:
            *   Verificar el rol del usuario (`request.user.perfil.es_administrador()` o similar).
            *   Si es usuario interno: servir el archivo PDF completo desde `archivo_ruta` en un formato que impida la descarga directa (ej. streaming de bytes con `Content-Disposition: inline`).
            *   Si es usuario externo y `trabajo.permite_preview_publico` es `True`: extraer y servir solo las primeras 15 páginas del PDF.
            *   Manejar la seguridad y los headers HTTP para controlar la visualización en el navegador y evitar la descarga.
    4.  **Actualizar Serializadores (`backend/biblioteca/serializers/trabajos.py`):**
        *   Ajustar `TrabajoInvestigacionSerializer` para reflejar la eliminación del campo `contenido`.
        *   Agregar un campo de `url_visualizacion` de solo lectura que apunte al nuevo endpoint.
    5.  **Ajustar Permisos:**
        *   Revisar `biblioteca/permissions.py` para asegurar que los permisos de visualización estén correctamente definidos y aplicados en el nuevo endpoint.

*   **Verificación:**
    *   **Unit Tests:** Crear nuevos tests unitarios que cubran los escenarios de visualización para usuarios internos y externos, verificando el contenido y los headers de la respuesta.
    *   **Pruebas de Integración:** Si el frontend lo permite, probar la visualización en la interfaz con diferentes tipos de usuarios.
    *   **Comandos:** `python manage.py test biblioteca.tests.trabajos.TestVisualizacionTrabajo` (o similar).
    *   **Linting/Tipo:** Ejecutar las herramientas de análisis de código para asegurar la calidad.

---

## 2. Aportes y Acceso: Consumo de CreditoDescarga

*   **Problema:** No se marca el `CreditoDescarga` como `usado` ni se registran `usado_en` y `usado_para_id` al realizar una descarga.

*   **Pasos Propuestos:**
    1.  **Identificar/Crear Endpoint de Descarga:**
        *   Actualmente, `TrabajoInvestigacionViewSet.puede_descargar` solo verifica la elegibilidad. Se necesita un endpoint (ej. `/api/trabajos/{id}/descargar/`) que realmente sirva el archivo para descarga.
    2.  **Implementar Lógica de Consumo (`backend/biblioteca/views/trabajos.py`):**
        *   En el nuevo endpoint de descarga:
            *   Una vez que se ha verificado que el usuario (interno o externo con token) puede descargar el `TrabajoInvestigacion`.
            *   Obtener la instancia de `CreditoDescarga` relevante.
            *   Dentro de una transacción atómica (`@transaction.atomic`):
                *   Marcar `credito.usado = True`.
                *   Asignar `credito.usado_en = timezone.now()`.
                *   Asignar `credito.usado_para = trabajo.materialbibliografico_ptr`.
                *   Guardar `credito.save()`.
            *   Servir el archivo PDF para descarga.
    3.  **Manejo de Errores:**
        *   Asegurar que si no hay créditos disponibles o si la actualización del crédito falla, la descarga no se realice y se devuelva una respuesta de error apropiada.

*   **Verificación:**
    *   **Unit Tests:** Crear tests unitarios para el endpoint de descarga, verificando que el `CreditoDescarga` se actualiza correctamente y que los escenarios de sin crédito/token inválido se manejan apropiadamente.
    *   **Pruebas de Integración:** Probar descargas con diferentes usuarios y tokens, confirmando las actualizaciones en la base de datos.
    *   **Comandos:** `python manage.py test biblioteca.tests.trabajos.TestDescargaTrabajo`.
    *   **Linting/Tipo:** Ejecutar las herramientas de análisis de código para asegurar la calidad.

---

## 3. Operaciones: Recálculo de Estado de Convocatoria

*   **Problema:** El campo `estado` en `Convocatoria` es almacenado y no se recalcula dinámicamente.

*   **Pasos Propuestos:**
    1.  **Modificar Modelo `Convocatoria` (`backend/biblioteca/models/convocatorias.py`):**
        *   **Eliminar Campo `estado`:** Remover el campo `estado` del modelo `Convocatoria` (requerirá una migración de base de datos).
        *   **Implementar Propiedad `estado_calculado`:** Crear una `@property` en el modelo `Convocatoria` (ej. `estado_actual`) que calcule el estado basado en `fecha_inicio`, `fecha_fin` y la fecha actual (`timezone.now()`) según las reglas:
            *   `vigente`: `fecha_inicio <= today <= fecha_fin`
            *   `en_gracia`: `fecha_fin < today <= fecha_fin + timedelta(days=7)`
            *   `oculta`: `today > fecha_fin + timedelta(days=7)`
    2.  **Actualizar Serializadores y Vistas:**
        *   Ajustar `ConvocatoriaSerializer` para incluir `estado_actual` como un campo de solo lectura.
        *   Modificar cualquier vista o filtro que use el campo `estado` directamente para que use la nueva propiedad calculada.
    3.  **Ajustar `HistorialEstadoConvocatoria`:**
        *   Si se decide mantener `HistorialEstadoConvocatoria`, la lógica para registrar los cambios deberá ser disparada por un proceso periódico (ej. un cron job de Django o una tarea `celery` si se introduce) que detecte cambios en el estado calculado y los registre. La implementación actual que guarda `estado_anterior` y `estado_nuevo` directamente en la vista deberá ser revisada.

*   **Verificación:**
    *   **Migraciones:** Ejecutar `python manage.py makemigrations` y `python manage.py migrate`.
    *   **Unit Tests:** Crear tests unitarios para la propiedad `estado_actual` en el modelo `Convocatoria`, cubriendo todos los rangos de fechas posibles.
    *   **Pruebas de Integración:** Verificar a través de la API que el estado se muestra correctamente y que no puede ser manipulado directamente.
    *   **Comandos:** `python manage.py test biblioteca.tests.convocatorias.TestEstadoConvocatoria`.
    *   **Linting/Tipo:** Ejecutar las herramientas de análisis de código para asegurar la calidad.

---

## 4. Operaciones: Gestión de Stock en SolicitudPrestamo

*   **Problema:** El `stock` de `Libro` no se actualiza al aprobar o devolver un `SolicitudPrestamo`.

*   **Pasos Propuestos:**
    1.  **Modificar Modelo `SolicitudPrestamo` (`backend/biblioteca/models/operaciones.py`):**
        *   **Sobrescribir `save()`:** Implementar lógica en el método `save()` del modelo `SolicitudPrestamo` para manejar los cambios de stock:
            *   **Al Aprobar (`estado` cambia a `aprobada`):**
                *   Verificar que `self.libro.stock > 0`. Si no, lanzar una `ValidationError`.
                *   `self.libro.stock -= 1`.
                *   `self.libro.save()`.
            *   **Al Devolver (`estado` cambia a `devuelta`):**
                *   `self.libro.stock += 1`.
                *   `self.libro.save()`.
        *   **Transacciones Atómicas:** Asegurar que las actualizaciones de stock y el guardado de la solicitud de préstamo se realicen dentro de una transacción atómica (`django.db.transaction.atomic`) para garantizar la consistencia.
    2.  **Actualizar Vistas y Serializadores:**
        *   Asegurar que las vistas y serializadores que gestionan `SolicitudPrestamo` disparen el método `save()` del modelo para activar la lógica de stock.

*   **Verificación:**
    *   **Unit Tests:** Crear tests unitarios para el método `save()` de `SolicitudPrestamo`, probando los escenarios de aprobación (incluyendo stock cero) y devolución, y verificando el `stock` del `Libro` antes y después.
    *   **Pruebas de Integración:** Simular solicitudes de préstamo, aprobación y devolución a través de la API para confirmar el comportamiento.
    *   **Comandos:** `python manage.py test biblioteca.tests.operaciones.TestSolicitudPrestamoStock`.
    *   **Linting/Tipo:** Ejecutar las herramientas de análisis de código para asegurar la calidad.

---

## 5. Operaciones: Disparo de Notificaciones

*   **Problema:** No se disparan notificaciones en los eventos clave especificados.

*   **Pasos Propuestos:**
    1.  **Crear Servicio de Notificaciones (`backend/biblioteca/services/notificaciones.py` - nuevo archivo):**
        *   Crear un nuevo módulo `notificaciones.py` dentro de `backend/biblioteca/services/`.
        *   Definir una función (ej. `crear_notificacion(destinatario_tipo, destinatario_id, origen_tipo, origen_id, mensaje)`) que encapsule la lógica de creación de instancias de `Notificacion`.
    2.  **Integrar Disparadores de Notificaciones:**
        *   **Aporte Nuevo (`backend/biblioteca/models/contribuciones.py` o vista):**
            *   En el método `save()` de `DocumentoAporte`, o en la vista que crea el aporte: si es un aporte nuevo, llamar a `crear_notificacion` para notificar al `Administrador`.
        *   **Aporte Resuelto (`backend/biblioteca/models/contribuciones.py` o vista):**
            *   En el método `save()` de `DocumentoAporte` o en la vista que cambia el estado: si el estado cambia a `aceptado` o `rechazado`, llamar a `crear_notificacion` para notificar al `aportante` (usando `usuario_interno` o `email`).
        *   **Solicitud de Préstamo Nueva (`backend/biblioteca/models/operaciones.py` o vista):**
            *   En el método `save()` de `SolicitudPrestamo` o en la vista que crea la solicitud: si es una solicitud nueva, llamar a `crear_notificacion` para notificar al `Administrador`.
        *   **Préstamo Resuelto (`backend/biblioteca/models/operaciones.py` o vista):**
            *   En el método `save()` de `SolicitudPrestamo` o en la vista que cambia el estado: si el estado cambia a `aprobada` o `devuelta`, llamar a `crear_notificacion` para notificar al `solicitante` (`usuario`).
    3.  **Consideraciones Adicionales:**
        *   Asegurar que los `destinatario_id` y `origen_id` sean los `pk` de las instancias de usuario/rol/aporte/préstamo.

*   **Verificación:**
    *   **Unit Tests:** Crear tests unitarios para el servicio de notificaciones y para los disparadores en los modelos/vistas, verificando que las notificaciones se crean correctamente con los datos esperados.
    *   **Pruebas de Integración:** Realizar flujos completos de aportes y préstamos, y verificar en la base de datos la creación de las `Notificacion` esperadas.
    *   **Comandos:** `python manage.py test biblioteca.tests.operaciones.TestNotificaciones`.
    *   **Linting/Tipo:** Ejecutar las herramientas de análisis de código para asegurar la calidad.

---
