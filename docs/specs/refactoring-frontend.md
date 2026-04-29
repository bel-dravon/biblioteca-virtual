---
last_updated: "2026-02-13 14:30"
version: "1.0"
status: draft
author: Discovery Architect
---

# Especificacion de Refactorizacion Frontend — Biblioteca Virtual

## 1. Problem Statement

Tras la reestructuracion de archivos (v1, `restructuring.md`), el frontend de `biblioteca-virtual` presenta problemas de calidad que afectan mantenibilidad, UX, rendimiento y accesibilidad:

- **Bugs funcionales**: `LoanRequestModal` usa `setTimeout` fake en vez de API real, `UserProfile.js` tiene fecha hardcodeada y boton sin handler, `SubirTrabajo.js` accede a `err.response.data` despues de que el interceptor ya extrajo `.data`.
- **Componentes duplicados**: `WorkCard.js` y `BookCard.js` son casi identicos.
- **Autorizacion fragil**: `Sidebar.js` verifica permisos comparando usernames hardcodeados (`comision_user`).
- **Token inconsistente**: Se usan dos keys de localStorage (`'token'` y `'authToken'`) en distintos archivos.
- **Sin optimizacion**: No hay code splitting (`React.lazy`), ni memoizacion (`useMemo`/`useCallback`), `FilterBar` filtra en cada keystroke sin debounce.
- **Patron repetido de data fetching**: Todas las paginas repiten `try/catch` + `useState(loading)` + `useState(error)`.
- **Accesibilidad nula**: Botones de icono sin `aria-label`, formularios sin labels, `ProtectedPDFViewer` bloquea `Ctrl+C` globalmente.
- **UI inconsistente**: `CrearConvocatoria` usa `alert()` nativo, dead props en `FilterBar`, items de menu no funcionales en `Header`.
- **Pagina huerfana**: `SmartLibrarySearch.js` existe pero no tiene ruta en `App.js`.
- **Zero tests**: No existe un solo test en el frontend.

## 2. Goals

1. Conectar `LoanRequestModal` al endpoint real de solicitudes.
2. Crear custom hook `useApiCall` para centralizar data fetching (loading, error, data).
3. Unificar `WorkCard`/`BookCard` en un unico componente con variantes.
4. Migrar autorizacion de `Sidebar` de username a rol de Perfil.
5. Unificar key de localStorage a `authToken` en toda la app.
6. Adaptar interceptor de axios al nuevo formato de respuesta backend `{success, data, message}`.
7. Implementar code splitting con `React.lazy` + `Suspense`.
8. Agregar memoizacion (`useMemo`/`useCallback`) en componentes pesados.
9. Agregar debounce en `FilterBar`.
10. Limpiar dead props de `FilterBar` y hacer fetch dinamico de opciones.
11. Corregir todos los problemas de `ProtectedPDFViewer` (Ctrl+C, zoom, a11y).
12. Implementar accesibilidad completa (aria-labels, roles semanticos, navegacion por teclado).
13. Estandarizar feedback de errores con MUI Snackbar (eliminar `alert()` nativos).
14. Registrar ruta de `SmartLibrarySearch` en `App.js`.
15. Implementar tests: componentes React con Testing Library y E2E con Playwright.

## 3. Non-Goals

- Migrar de CRA a Vite u otro bundler.
- Implementar TypeScript.
- Agregar Redux/Zustand (mantener Context API + local state).
- Crear paginas o features nuevos.
- Rediseño visual o cambio de tema MUI.

---

## 4. Fases de Ejecucion

### Fase 1: Infraestructura y Hooks

#### 1.1 Unificar key de token a `authToken`

**Archivos afectados**: Todos los que lean/escriban token en localStorage.

**Busqueda y reemplazo global**:
- `localStorage.getItem('token')` -> `localStorage.getItem('authToken')`
- `localStorage.setItem('token', ...)` -> `localStorage.setItem('authToken', ...)`
- `localStorage.removeItem('token')` -> `localStorage.removeItem('authToken')`

**Archivos conocidos a verificar**:
- `frontend/src/api/config.js` — interceptor de request.
- `frontend/src/context/AuthContext.js` — login, logout, inicializacion.
- `frontend/src/components/ProtectedPDFViewer.js` — si lee token directamente.
- Cualquier otro archivo que use `localStorage` para tokens.

**Criterio**: Despues del cambio, una busqueda global de `'token'` como key de localStorage debe dar CERO resultados (excepto la key `'authToken'` misma).

#### 1.2 Adaptar interceptor de axios

**Archivo**: `frontend/src/api/config.js`

**Estado actual**: El interceptor de response extrae `response.data` (quita el wrapper de axios).

**Nuevo comportamiento** (adaptado al formato backend `{success, data, message}`):

```javascript
// Interceptor de response
apiClient.interceptors.response.use(
  (response) => {
    // El backend ahora envuelve en {success, data, message}
    // Extraer .data.data para que los servicios reciban el payload directamente
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'success' in payload) {
      return payload.data;
    }
    // Fallback para respuestas que no sigan el formato (ej: file downloads)
    return response.data;
  },
  (error) => {
    // Extraer mensaje de error del formato estandar
    const serverResponse = error.response?.data;
    const message = serverResponse?.message || 'Error de conexion';
    const errors = serverResponse?.errors || null;
    
    const normalizedError = {
      message,
      errors,
      status: error.response?.status,
    };
    
    return Promise.reject(normalizedError);
  }
);
```

**Impacto**: Todos los servicios (`trabajosService.getAll()`, etc.) recibiran el payload directo, no el wrapper. Los errores tendran forma `{message, errors, status}` uniforme.

#### 1.3 Crear custom hook `useApiCall`

**Crear**: `frontend/src/hooks/useApiCall.js`

```javascript
import { useState, useCallback } from 'react';

/**
 * Hook reutilizable para llamadas a la API.
 * Centraliza el patron loading/error/data que se repite en todas las paginas.
 * 
 * @returns {Object} { data, loading, error, execute, reset }
 * 
 * Uso:
 *   const { data, loading, error, execute } = useApiCall();
 *   
 *   useEffect(() => {
 *     execute(() => trabajosService.getAll(params));
 *   }, [params]);
 */
export default function useApiCall(initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Error inesperado');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return { data, loading, error, execute, reset };
}
```

**Crear directorio**: `frontend/src/hooks/` (nueva carpeta).

**Migracion progresiva**: Aplicar `useApiCall` en todas las paginas que repiten el patron `try/catch` + `useState`. Las paginas prioritarias son:
- `Explorar.js` (busqueda principal)
- `HomePage.js` (carga inicial)
- `AdminDashboard.js` (multiples fetches)
- `TrendsDashboard.js` (estadisticas)
- `SubirTrabajo.js` (fix del bug de `err.response.data`)
- `Convocatorias.js`
- `MiBiblio.js`
- `UserProfile.js`
- `pages/trabajo/TrabajoDetalle.js`

**Fix especifico de SubirTrabajo.js**: El bug de acceder a `err.response.data` despues del interceptor se resuelve automaticamente al usar `useApiCall`, ya que los errores llegan normalizados como `{message, errors, status}`.

#### 1.4 Crear `frontend/src/hooks/index.js` (barrel export)

```javascript
export { default as useApiCall } from './useApiCall';
```

---

### Fase 2: Componentes

#### 2.1 Unificar WorkCard y BookCard

**Eliminar**: `frontend/src/components/BookCard.js`

**Refactorizar**: `frontend/src/components/WorkCard.js`

Agregar prop `variant` para diferenciar layouts:

```javascript
/**
 * Componente unificado para mostrar tarjetas de trabajos academicos.
 * 
 * Props:
 *   trabajo - Objeto con datos del trabajo
 *   variant - 'card' (grid, vertical) | 'list' (horizontal, compacto)
 *   onClick - Handler para click en la tarjeta
 */
export default function WorkCard({ trabajo, variant = 'card', onClick }) {
  if (variant === 'list') {
    return (
      // Layout horizontal: thumbnail izquierda, info derecha
      ...
    );
  }
  
  // Layout vertical por defecto (card)
  return (
    // Layout actual de WorkCard
    ...
  );
}
```

**Actualizar imports**: Buscar todos los archivos que importan `BookCard` y cambiar a `WorkCard` con prop `variant="list"` (o el variant correspondiente).

**Archivos a actualizar** (verificar cuales importan BookCard):
- Cualquier pagina que use `BookCard` debe cambiar a `<WorkCard variant="list" ... />`

#### 2.2 Conectar LoanRequestModal a API real

**Archivo**: `frontend/src/components/LoanRequestModal.js`

**Estado actual**: Usa `setTimeout` fake que simula delay y muestra exito sin hacer request.

**Correccion**: Conectar al endpoint real `POST /api/v1/solicitudes/`.

```javascript
import { solicitudesService } from '../api';

// En el handler de submit:
const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  try {
    await solicitudesService.create({
      trabajo: trabajoId,
      tipo_solicitud: tipoSolicitud,
    });
    onSuccess(); // callback del parent
    onClose();
  } catch (err) {
    setError(err.message || 'Error al crear la solicitud');
  } finally {
    setLoading(false);
  }
};
```

**Eliminar**: El `setTimeout` fake y la simulacion de exito.

#### 2.3 Migrar Sidebar de username a rol

**Archivo**: `frontend/src/components/Sidebar.js`

**Estado actual**: Compara `user.username === 'comision_user'` para mostrar/ocultar items del menu.

**Correccion**: Usar el campo `rol` del perfil del usuario (que viene del `AuthContext`):

```javascript
// Helper para verificar rol
const hasRole = (roleName) => {
  return user?.perfil?.rol?.nombre === roleName;
};

const isAdmin = hasRole('Administrador') || hasRole('Director');
const isBibliotecario = hasRole('Bibliotecario') || isAdmin;

// En el render, en vez de:
// {user.username === 'comision_user' && <MenuItem>...</MenuItem>}
// Usar:
// {isAdmin && <MenuItem>...</MenuItem>}
```

**Verificar AuthContext**: Asegurar que `AuthContext` provee los datos del perfil/rol del usuario. Si actualmente no los incluye, agregar un fetch al endpoint de perfil al hacer login o al inicializar.

> **Dependencia**: Si el backend no devuelve el perfil/rol en el login response, se necesita un endpoint adicional (ej: `GET /api/v1/perfiles/me/`) o anidar el perfil en la respuesta de autenticacion.

#### 2.4 Estandarizar feedback con MUI Snackbar

**Archivo principal**: `frontend/src/pages/CrearConvocatoria.js`

**Accion**: Reemplazar `alert()` por MUI Snackbar:

```javascript
import { Snackbar, Alert } from '@mui/material';

// State
const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

// En vez de alert('Error'):
setSnackbar({ open: true, message: 'Error al crear convocatoria', severity: 'error' });

// Render:
<Snackbar 
  open={snackbar.open} 
  autoHideDuration={6000} 
  onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
>
  <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
    {snackbar.message}
  </Alert>
</Snackbar>
```

**Aplicar patron en toda la app**: Verificar que ningun otro componente use `alert()`, `confirm()` o `prompt()` nativos. Estandarizar en MUI.

**Opcional**: Crear un hook `useSnackbar` o un componente `SnackbarProvider` con Context si el patron se repite en muchos archivos.

---

### Fase 3: Optimizacion de Rendimiento

#### 3.1 Code splitting con React.lazy

**Archivo**: `frontend/src/App.js`

Migrar los imports de paginas a lazy:

```javascript
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Loading fallback
const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
);

// Lazy imports
const HomePage = lazy(() => import('./pages/HomePage'));
const Explorar = lazy(() => import('./pages/Explorar'));
const TrabajoDetalle = lazy(() => import('./pages/trabajo/TrabajoDetalle'));
const SubirTrabajo = lazy(() => import('./pages/SubirTrabajo'));
const Login = lazy(() => import('./pages/Login'));
const Registro = lazy(() => import('./pages/Registro'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const MiBiblio = lazy(() => import('./pages/MiBiblio'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TrendsDashboard = lazy(() => import('./pages/TrendsDashboard'));
const Convocatorias = lazy(() => import('./pages/Convocatorias'));
const CrearConvocatoria = lazy(() => import('./pages/CrearConvocatoria'));
const SmartLibrarySearch = lazy(() => import('./pages/SmartLibrarySearch'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));

// En el Router:
<Suspense fallback={<PageLoader />}>
  <Routes>
    {/* ...rutas... */}
  </Routes>
</Suspense>
```

**NO hacer lazy**: Componentes de layout (`DashboardLayout`, `Header`, `Sidebar`, `Footer`) que se renderizan siempre.

#### 3.2 Agregar ruta de SmartLibrarySearch

**Archivo**: `frontend/src/App.js`

Agregar ruta dentro del `<Routes>`:

```jsx
<Route path="/busqueda-ia" element={<SmartLibrarySearch />} />
```

Tambien agregar link en `Sidebar.js` para que sea accesible desde la navegacion.

#### 3.3 Memoizacion en componentes pesados

**Componentes a memoizar**:

| Componente | Que memoizar | Razon |
|------------|-------------|-------|
| `Explorar.js` | Lista filtrada de trabajos con `useMemo` | Recalcula en cada render |
| `Explorar.js` | Handlers de filtro con `useCallback` | Se pasan como props a FilterBar |
| `AdminDashboard.js` | Datos de estadisticas con `useMemo` | Transformaciones de datos costosas |
| `TrendsDashboard.js` | Datos procesados con `useMemo` | Multiples transformaciones |
| `TrabajoDetalle.js` | Handlers de acciones con `useCallback` | Se pasan a subcomponentes |
| `FilterBar.js` | Opciones derivadas con `useMemo` | Listas de opciones que no cambian frecuentemente |

**Ejemplo para Explorar.js**:
```javascript
const filteredTrabajos = useMemo(() => {
  return trabajos.filter(/* logica de filtrado */);
}, [trabajos, filters]);

const handleFilterChange = useCallback((key, value) => {
  setFilters(prev => ({ ...prev, [key]: value }));
}, []);
```

#### 3.4 Debounce en FilterBar

**Archivo**: `frontend/src/components/FilterBar.js`

**Implementar debounce** para el campo de texto (titulo/busqueda):

```javascript
import { useState, useEffect, useRef } from 'react';

// Custom hook de debounce (agregar a hooks/)
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}
```

**O crear**: `frontend/src/hooks/useDebounce.js` y exportar desde el barrel.

**Aplicar en FilterBar**:
```javascript
const [searchText, setSearchText] = useState('');
const debouncedSearch = useDebounce(searchText, 300);

useEffect(() => {
  onFilterChange('titulo', debouncedSearch);
}, [debouncedSearch, onFilterChange]);
```

Los selects (tipo, carrera, etc.) NO necesitan debounce — aplican inmediatamente.

#### 3.5 Limpiar FilterBar: dead props y fetch dinamico

**Archivo**: `frontend/src/components/FilterBar.js`

**3.5.1 Eliminar dead props**:
- Eliminar props `autores` y `palabrasClave` de la firma del componente.
- Eliminar cualquier codigo que las referencie internamente.

**3.5.2 Fetch dinamico de opciones**:

Las opciones de carrera (y potencialmente autores y palabras clave) deben venir del backend:

```javascript
import { useEffect, useState } from 'react';
import { trabajosService } from '../api';

// Dentro del componente:
const [filterOptions, setFilterOptions] = useState({
  carreras: [],
  tipos: [],
  niveles: [],
});

useEffect(() => {
  const loadOptions = async () => {
    try {
      // Endpoint nuevo o derivar de datos existentes
      const options = await trabajosService.getFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      console.error('Error cargando opciones de filtro:', err);
    }
  };
  loadOptions();
}, []);
```

> **Dependencia backend**: Puede requerir un endpoint nuevo `GET /api/v1/trabajos/filter-options/` que retorne los valores distintos de carrera, tipo y nivel_academico. Alternativamente, derivar del listado de trabajos existente.

---

### Fase 4: Accesibilidad (a11y)

#### 4.1 Principios generales

Aplicar en TODOS los componentes:

| Regla | Ejemplo |
|-------|---------|
| Botones de icono necesitan `aria-label` | `<IconButton aria-label="Cerrar menu">` |
| Inputs de formulario necesitan `label` o `aria-label` | `<TextField label="Email" />` o `<input aria-label="Buscar" />` |
| Imagenes necesitan `alt` | `<img alt="Thumbnail de tesis" />` o `alt=""` si decorativa |
| Links con solo icono necesitan `aria-label` | `<Link aria-label="Ver detalle del trabajo">` |
| Tablas necesitan headers semanticos | `<TableHead>` con `<TableCell component="th" scope="col">` |
| Modales necesitan `aria-labelledby` | `<Dialog aria-labelledby="modal-title">` |
| Alertas/Snackbar necesitan `role="alert"` | MUI Alert ya lo incluye por defecto |
| Navegacion necesita `<nav>` o `role="navigation"` | Sidebar, Header nav links |

#### 4.2 ProtectedPDFViewer — fixes criticos

**Archivo**: `frontend/src/components/ProtectedPDFViewer.js`

**4.2.1 No bloquear Ctrl+C globalmente**:

**Estado actual**: Un event listener intercepta `keydown` globalmente y bloquea `Ctrl+C`, `Ctrl+S`, `Ctrl+P` en todo el documento.

**Correccion**: Restringir la prevencion SOLO al contenedor del visor PDF, y NO bloquear `Ctrl+C` (copiar):

```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    // Solo prevenir dentro del visor PDF
    if (!viewerRef.current?.contains(e.target)) return;
    
    // Bloquear solo Ctrl+S (guardar) y Ctrl+P (imprimir)
    if (e.ctrlKey && (e.key === 's' || e.key === 'p')) {
      e.preventDefault();
    }
    // NO bloquear Ctrl+C (copiar) — es funcionalidad basica del navegador
  };
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

**4.2.2 Fix zoom overflow**:

Agregar containment al contenedor del PDF:
```javascript
<Box
  ref={viewerRef}
  sx={{
    overflow: 'auto',
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 200px)',
    position: 'relative',
  }}
>
  {/* PDF content */}
</Box>
```

**4.2.3 Agregar a11y al visor**:

```javascript
// Botones de zoom
<IconButton aria-label="Aumentar zoom" onClick={handleZoomIn}>
  <ZoomInIcon />
</IconButton>
<IconButton aria-label="Reducir zoom" onClick={handleZoomOut}>
  <ZoomOutIcon />
</IconButton>

// Contenedor del PDF
<Box role="document" aria-label="Visor de documento PDF">
  ...
</Box>
```

#### 4.3 Componentes prioritarios para a11y

| Componente | Issues | Fixes |
|------------|--------|-------|
| `Header.js` | Menu items no funcionales, iconos sin label | Agregar `aria-label` a IconButtons, eliminar o implementar items de menu muertos |
| `Sidebar.js` | Sin `<nav>` semantico | Envolver menu en `<nav aria-label="Menu principal">` |
| `FilterBar.js` | Inputs sin labels explicitos | Agregar `label` prop a todos los `TextField` y `Select` |
| `WorkCard.js` | Tarjeta clickable sin role | Agregar `role="article"`, links con `aria-label` descriptivo |
| `LoanRequestModal.js` | Modal sin `aria-labelledby` | Agregar `aria-labelledby` al Dialog, `id` al titulo |
| `Login.js` / `Registro.js` | Formularios sin landmarks | Envolver en `<form>` con `aria-label` |
| `Explorar.js` | Lista de resultados sin landmark | Agregar `role="list"` o `<ul>` semantico |
| `AdminDashboard.js` | Tablas sin headers semanticos | Usar `<TableCell component="th" scope="col">` |
| `UserManagement.js` | Acciones sin labels | `aria-label` en botones de editar/eliminar |

#### 4.4 Navegacion por teclado

- Todos los elementos interactivos deben ser alcanzables con `Tab`.
- Modales deben atrapar el focus dentro (MUI Dialog ya lo hace por defecto).
- `Sidebar` debe ser navegable con `Tab` y `Enter`/`Space` para activar items.
- `FilterBar` debe permitir navegar entre filtros con `Tab`.
- `WorkCard` debe ser activable con `Enter` cuando tiene focus.

---

### Fase 5: Fixes de Bugs Restantes

#### 5.1 UserProfile.js

**Archivo**: `frontend/src/pages/UserProfile.js`

**Bug 1 — Fecha de registro hardcodeada**:
```javascript
// Actual:
const joinDate = new Date(); // Siempre la fecha actual

// Fix: Usar la fecha real del usuario
const joinDate = user?.date_joined ? new Date(user.date_joined) : null;
```

> **Dependencia**: Verificar que el endpoint de usuario devuelve `date_joined`. Si no, agregarlo al `UserSerializer` en el backend.

**Bug 2 — Boton "Editar perfil" sin handler**:

Implementar handler que navegue a una ruta de edicion o abra un modal:
```javascript
const handleEditProfile = () => {
  // Opcion A: Navegar a pagina de edicion
  navigate('/perfil/editar');
  
  // Opcion B: Abrir modal de edicion (si se prefiere inline)
  setEditModalOpen(true);
};
```

> **Nota**: Si la pagina de edicion no existe, crear un componente basico o al menos conectar el boton a un flujo real (ej: abrir un Dialog con formulario).

#### 5.2 Header.js — items no funcionales

**Archivo**: `frontend/src/components/Header.js`

**Problema**: Items de menu de ayuda que no hacen nada.

**Accion**: Eliminar items no funcionales del menu, o implementarlos. Si son placeholder para features futuras, ocultarlos y documentar.

#### 5.3 DashboardLayout.js — dead props

**Archivo**: `frontend/src/layouts/DashboardLayout.js`

**Accion**: Eliminar props y handlers que no se usan. Verificar con busqueda de referencias.

#### 5.4 TrendsDashboard.js — import no usado

**Archivo**: `frontend/src/pages/TrendsDashboard.js`

**Accion**: Eliminar import de `user` si no se usa. Limpiar los dos features combinados si es posible (o al menos documentar).

#### 5.5 AdminDashboard.js — duplicados

**Archivo**: `frontend/src/pages/AdminDashboard.js`

**Accion**: Eliminar `console.error` duplicado y componente Tabs innecesario si solo hay un tab.

#### 5.6 AIChatPanel.js — sin historial de conversacion

**Archivo**: `frontend/src/pages/trabajo/AIChatPanel.js`

**Estado actual**: No mantiene historial de mensajes entre preguntas.

**Mejora**: Mantener array de mensajes en state:
```javascript
const [messages, setMessages] = useState([]);

const handleSend = async (question) => {
  const userMessage = { role: 'user', content: question };
  setMessages(prev => [...prev, userMessage]);
  
  const response = await trabajosService.chatIA(trabajoId, question);
  
  const aiMessage = { role: 'assistant', content: response.respuesta };
  setMessages(prev => [...prev, aiMessage]);
};
```

---

### Fase 6: Tests

#### 6.1 Estructura de archivos

```
frontend/src/
    hooks/
        __tests__/
            useApiCall.test.js
            useDebounce.test.js
    components/
        __tests__/
            WorkCard.test.js
            FilterBar.test.js
            LoanRequestModal.test.js
            RoleGuard.test.js
            RoleRoute.test.js
            ProtectedPDFViewer.test.js
            Sidebar.test.js
    pages/
        __tests__/
            Login.test.js
            Registro.test.js
            Explorar.test.js
            HomePage.test.js
    context/
        __tests__/
            AuthContext.test.js
    e2e/                          # Tests E2E con Playwright
        login.spec.js
        registro.spec.js
        explorar.spec.js
        trabajo-crud.spec.js
        solicitud-prestamo.spec.js
        admin.spec.js
```

#### 6.2 Tests de componentes (React Testing Library)

**Prioridad**: Flujos criticos primero.

**6.2.1 Tests del hook useApiCall**:
```
- test_execute_sets_loading_and_returns_data
- test_execute_sets_error_on_failure
- test_reset_clears_state
- test_loading_is_false_after_completion
```

**6.2.2 Tests de AuthContext**:
```
- test_login_stores_token_as_authToken
- test_logout_removes_authToken
- test_initializes_from_stored_token
- test_provides_user_data_to_children
```

**6.2.3 Tests de WorkCard**:
```
- test_renders_card_variant_by_default
- test_renders_list_variant
- test_displays_trabajo_title_and_authors
- test_calls_onClick_handler
- test_has_accessible_aria_attributes
```

**6.2.4 Tests de FilterBar**:
```
- test_debounces_text_input
- test_selects_apply_immediately
- test_loads_filter_options_from_api
- test_all_inputs_have_labels
```

**6.2.5 Tests de LoanRequestModal**:
```
- test_calls_api_on_submit
- test_shows_error_on_api_failure
- test_closes_on_success
- test_shows_loading_state
- test_modal_has_aria_labelledby
```

**6.2.6 Tests de RoleGuard y RoleRoute**:
```
- test_renders_children_for_allowed_role
- test_renders_fallback_for_disallowed_role
- test_redirects_for_disallowed_role (RoleRoute)
```

**6.2.7 Tests de Sidebar**:
```
- test_shows_admin_items_for_director_role
- test_hides_admin_items_for_estudiante_role
- test_no_hardcoded_username_checks
```

**6.2.8 Tests de Login/Registro**:
```
- test_login_form_submits_credentials
- test_login_shows_error_on_failure
- test_registro_form_validates_required_fields
- test_registro_shows_success_message
```

#### 6.3 Tests E2E con Playwright

**Instalar**:
```bash
npm install -D @playwright/test
npx playwright install
```

**Configurar**: `frontend/playwright.config.js`
```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/e2e',
  baseURL: 'http://localhost:3000',
  use: {
    headless: true,
  },
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: true,
  },
});
```

> **Nota**: Los tests E2E requieren que el backend este corriendo en puerto 8000 con datos de prueba.

**Flujos E2E prioritarios**:

**6.3.1 Login y navegacion**:
```
- test_login_with_valid_credentials_redirects_to_home
- test_login_with_invalid_credentials_shows_error
- test_logout_redirects_to_login
- test_protected_route_redirects_unauthenticated_user
```

**6.3.2 Registro**:
```
- test_register_new_user_and_auto_login
- test_register_duplicate_email_shows_error
```

**6.3.3 Explorar y buscar**:
```
- test_explorar_loads_trabajos
- test_filter_by_tipo_updates_results
- test_search_by_titulo_with_debounce
- test_click_trabajo_navigates_to_detail
```

**6.3.4 CRUD de trabajo**:
```
- test_subir_trabajo_creates_new_entry
- test_trabajo_detail_shows_all_sections
- test_trabajo_recommendations_load
```

**6.3.5 Solicitud de prestamo**:
```
- test_request_loan_from_trabajo_detail
- test_loan_modal_calls_real_api
- test_loan_status_updates_after_approval
```

**6.3.6 Panel de administracion**:
```
- test_admin_dashboard_loads_for_director
- test_admin_dashboard_blocked_for_estudiante
- test_user_management_crud
```

---

## 5. Estructura Final Afectada

```
frontend/src/
    hooks/                          # NUEVO directorio
        index.js                    # Barrel export
        useApiCall.js               # NUEVO: hook centralizado de data fetching
        useDebounce.js              # NUEVO: hook de debounce
        __tests__/
            useApiCall.test.js
            useDebounce.test.js
    api/
        config.js                   # MODIFICADO: interceptor adaptado a {success,data,message}, token='authToken'
        index.js                    # Sin cambios
        trabajos.js                 # + getFilterOptions() si se necesita endpoint
        (resto sin cambios)
    context/
        AuthContext.js              # MODIFICADO: unificar a 'authToken', proveer perfil/rol
        __tests__/
            AuthContext.test.js     # NUEVO
    components/
        WorkCard.js                 # MODIFICADO: + prop variant='card'|'list', + a11y
        BookCard.js                 # ELIMINADO (unificado en WorkCard)
        FilterBar.js                # MODIFICADO: - dead props, + debounce, + fetch dinamico, + a11y
        LoanRequestModal.js         # MODIFICADO: conectado a API real, + a11y
        Sidebar.js                  # MODIFICADO: auth por rol en vez de username, + nav semantico
        Header.js                   # MODIFICADO: - items no funcionales, + aria-labels
        ProtectedPDFViewer.js       # MODIFICADO: - bloqueo Ctrl+C, + fix zoom, + a11y
        RoleGuard.js                # Sin cambios
        RoleRoute.js                # Sin cambios
        StatCard.js                 # + aria-labels
        Footer.js                   # + a11y basica
        LoanStatusNotification.js   # + a11y
        __tests__/                  # NUEVO directorio
            WorkCard.test.js
            FilterBar.test.js
            LoanRequestModal.test.js
            RoleGuard.test.js
            RoleRoute.test.js
            ProtectedPDFViewer.test.js
            Sidebar.test.js
    layouts/
        DashboardLayout.js          # MODIFICADO: - dead props/handlers
    pages/
        HomePage.js                 # MODIFICADO: usar useApiCall
        Login.js                    # MODIFICADO: + a11y, usar useApiCall
        Registro.js                 # MODIFICADO: + a11y, usar useApiCall
        Explorar.js                 # MODIFICADO: + useMemo, + useCallback, usar useApiCall
        SubirTrabajo.js             # MODIFICADO: fix error handling, usar useApiCall
        SmartLibrarySearch.js       # Sin cambios (agregar ruta en App.js)
        UserProfile.js              # MODIFICADO: fix fecha, fix boton editar
        MiBiblio.js                 # MODIFICADO: usar useApiCall
        TrendsDashboard.js          # MODIFICADO: - import no usado, + useMemo
        Convocatorias.js            # MODIFICADO: usar useApiCall
        CrearConvocatoria.js        # MODIFICADO: MUI Snackbar en vez de alert()
        AdminDashboard.js           # MODIFICADO: - duplicados, + useMemo, + a11y tablas
        About.js                    # + a11y basica
        NotFound.js                 # Sin cambios
        trabajo/
            TrabajoDetalle.js       # MODIFICADO: + useCallback para handlers, usar useApiCall
            AIChatPanel.js          # MODIFICADO: + historial de conversacion
            PDFSection.js           # Sin cambios mayores
            LoanSection.js          # Sin cambios mayores
            RecommendationsSection.js # Sin cambios mayores
        admin/
            UserManagement.js       # MODIFICADO: + a11y en botones de accion
        __tests__/                  # NUEVO directorio
            Login.test.js
            Registro.test.js
            Explorar.test.js
            HomePage.test.js
    theme/
        theme.js                    # Sin cambios
        themeConfig.js              # Sin cambios
    App.js                          # MODIFICADO: React.lazy + Suspense, + ruta SmartLibrarySearch
    e2e/                            # NUEVO directorio (Playwright)
        login.spec.js
        registro.spec.js
        explorar.spec.js
        trabajo-crud.spec.js
        solicitud-prestamo.spec.js
        admin.spec.js
    playwright.config.js            # NUEVO (o en raiz de frontend/)
```

---

## 6. Acceptance Criteria

### Fase 1: Infraestructura
- [ ] Busqueda global de `localStorage.getItem('token')` (sin 'auth' prefix) da CERO resultados.
- [ ] Toda la app usa `'authToken'` como key unica de localStorage.
- [ ] Interceptor de axios maneja formato `{success, data, message}` y extrae `data` automaticamente.
- [ ] Errores del interceptor tienen forma `{message, errors, status}`.
- [ ] `useApiCall` hook existe y funciona con loading/error/data.
- [ ] `useDebounce` hook existe.
- [ ] `frontend/src/hooks/index.js` exporta ambos hooks.

### Fase 2: Componentes
- [ ] `BookCard.js` eliminado.
- [ ] `WorkCard.js` acepta prop `variant='card'|'list'`.
- [ ] Todos los imports de `BookCard` migrados a `WorkCard`.
- [ ] `LoanRequestModal` llama a `solicitudesService.create()` en vez de `setTimeout`.
- [ ] `Sidebar` no contiene comparaciones de username hardcodeadas.
- [ ] `Sidebar` verifica permisos usando `user.perfil.rol`.
- [ ] `CrearConvocatoria` no usa `alert()` nativo; usa MUI Snackbar.

### Fase 3: Optimizacion
- [ ] Todas las paginas en `App.js` usan `React.lazy()` + `Suspense`.
- [ ] `SmartLibrarySearch` tiene ruta registrada en `App.js` y link en Sidebar.
- [ ] `Explorar.js` usa `useMemo` para lista filtrada y `useCallback` para handlers.
- [ ] `FilterBar` tiene debounce de 300ms en campo de texto.
- [ ] `FilterBar` no tiene props `autores` ni `palabrasClave` en su firma.
- [ ] `FilterBar` carga opciones de carrera del backend (o de datos existentes).
- [ ] `npm run build` completa sin warnings de bundle size criticos.

### Fase 4: Accesibilidad
- [ ] Todos los `IconButton` tienen `aria-label`.
- [ ] Todos los `TextField` tienen `label` o `aria-label`.
- [ ] Todos los `Dialog` tienen `aria-labelledby`.
- [ ] `Sidebar` esta envuelto en `<nav aria-label="...">`.
- [ ] `ProtectedPDFViewer` NO bloquea `Ctrl+C`.
- [ ] `ProtectedPDFViewer` zoom no causa overflow fuera del contenedor.
- [ ] `ProtectedPDFViewer` botones tienen `aria-label`.
- [ ] Tablas en `AdminDashboard` y `UserManagement` usan `<th scope="col">`.
- [ ] La app es navegable completamente con teclado (Tab, Enter, Escape).

### Fase 5: Bugs
- [ ] `UserProfile.js` muestra fecha de registro real del usuario.
- [ ] `UserProfile.js` boton "Editar" tiene handler funcional.
- [ ] `SubirTrabajo.js` maneja errores correctamente (sin acceder a `err.response.data` post-interceptor).
- [ ] `Header.js` no tiene items de menu no funcionales visibles.
- [ ] `DashboardLayout.js` no tiene dead props.
- [ ] `TrendsDashboard.js` no tiene imports no usados.
- [ ] `AdminDashboard.js` no tiene `console.error` duplicado.
- [ ] `AIChatPanel.js` mantiene historial de conversacion.

### Fase 6: Tests
- [ ] `frontend/src/hooks/__tests__/` contiene tests para `useApiCall` y `useDebounce`.
- [ ] `frontend/src/components/__tests__/` contiene tests para componentes criticos.
- [ ] `frontend/src/pages/__tests__/` contiene tests para paginas criticas.
- [ ] `frontend/src/context/__tests__/AuthContext.test.js` existe.
- [ ] `npm test -- --watchAll=false` ejecuta sin errores.
- [ ] Playwright instalado y configurado.
- [ ] Tests E2E de login, registro, explorar, CRUD trabajo, solicitud de prestamo y admin estan definidos.
- [ ] `npm run build` completa sin errores.

---

## 7. Decisions Log

| Fecha | Decision | Alternativas consideradas | Razon |
|-------|----------|--------------------------|-------|
| 2026-02-13 | Unificar WorkCard/BookCard en uno con variantes | Mantener ambos / compartir base | Eliminar duplicacion, un solo componente configurable |
| 2026-02-13 | Custom hook useApiCall | Estandarizar patron manual / fuera de alcance | Centraliza logica repetida en 10+ paginas |
| 2026-02-13 | Unificar token a 'authToken' | Unificar a 'token' | 'authToken' es mas descriptivo; actualizar interceptor para leer esta key |
| 2026-02-13 | Adaptar interceptor al formato {success,data,message} | Eliminar interceptor / mantener actual | Transparente para los servicios existentes |
| 2026-02-13 | Code splitting con React.lazy | Sin code splitting / React.lazy solo en rutas pesadas | Reduce bundle inicial, mejora First Contentful Paint |
| 2026-02-13 | Debounce de 300ms en FilterBar | Sin debounce / debounce de 500ms | 300ms es buen balance entre responsividad y rendimiento |
| 2026-02-13 | FilterBar fetch dinamico de opciones | Solo limpiar dead props / hardcoded limpio | Opciones reales del backend, no se desincronizan |
| 2026-02-13 | Conectar LoanRequestModal a API real | Solo documentar el fake | Es un bug funcional: el usuario cree que creo una solicitud pero no |
| 2026-02-13 | Sidebar migrar a rol de Perfil | Usar RoleGuard / mantener username | Consistente con el sistema de roles existente |
| 2026-02-13 | ProtectedPDFViewer: no bloquear Ctrl+C | Mantener bloqueo global | Ctrl+C es funcionalidad basica del navegador, no debe bloquearse |
| 2026-02-13 | MUI Snackbar en vez de alert() | Mantener alert() | Consistencia visual con el resto de la app |
| 2026-02-13 | A11y completa | A11y basica / fuera de alcance | Buena practica, mejora UX para todos los usuarios |
| 2026-02-13 | Agregar ruta SmartLibrarySearch | Eliminar pagina | La pagina ya esta implementada, solo falta la ruta |
| 2026-02-13 | Historial de conversacion en AIChatPanel | Mantener sin historial | Mejora UX significativa, contexto de la conversacion |
| 2026-02-13 | Playwright para E2E | Cypress / sin decidir | Moderno, rapido, buena DX |
| 2026-02-13 | Tests con prioridad flujos criticos | Cobertura pareja | Maximo impacto con minimo esfuerzo inicial |

---

## 8. Dependencias con Backend

Las siguientes tareas del frontend dependen de cambios en el backend (documentados en `refactoring-backend.md`):

| Tarea Frontend | Dependencia Backend |
|---------------|---------------------|
| Adaptar interceptor axios | Renderer global `{success, data, message}` activo |
| Actualizar baseURL de axios | API versioning `/api/v1/` aplicado |
| Sidebar auth por rol | Endpoint que devuelva perfil/rol del usuario autenticado |
| FilterBar fetch dinamico | Endpoint de filter-options o datos accesibles desde listado |
| UserProfile fecha real | `UserSerializer` devuelve `date_joined` |
| LoanRequestModal API real | Endpoint `POST /api/v1/solicitudes/` funcionando correctamente |
| useApiCall: formato de errores | Formato de errores estandarizado en backend |

> **Recomendacion de orden**: Completar las fases 1-3 del backend primero (seguridad, arquitectura, modelo de datos), luego las fases del frontend, ya que el frontend depende del formato de respuesta estandarizado.

---

## 9. Observaciones y Decisiones Diferidas

### Deuda tecnica documentada (fuera de scope)

1. **Migracion de CRA a Vite**: CRA esta deprecated. Se recomienda migrar en una fase futura.
2. **TypeScript**: No se agrega en esta fase. Evaluar para una iteracion futura de hardening.
3. **Error boundaries**: No existen. Se recomienda agregar `ErrorBoundary` components alrededor de secciones criticas en una fase futura.
4. **PWA/Service Worker**: `serviceWorker` esta desregistrado. Evaluar si la app necesita capacidades offline.
5. **Internacionalizacion (i18n)**: La app esta solo en espanol. Si se necesita multi-idioma, evaluar `react-intl` o `i18next`.

### Notas tecnicas

- Los tests E2E con Playwright requieren que backend (puerto 8000) y frontend (puerto 3000) esten corriendo simultaneamente.
- `React.lazy` solo funciona con `export default`. Verificar que todas las paginas usen default export.
- El debounce hook crea un timeout nuevo en cada cambio de valor; se limpia con el cleanup del `useEffect`.
- La unificacion de token key (`authToken`) requiere que los usuarios existentes re-logueen (su token guardado con la key vieja no sera leido).
