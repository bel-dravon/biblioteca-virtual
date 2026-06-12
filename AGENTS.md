# AGENTS.md -- Coding Agent Guidelines for biblioteca-virtual

## Purpose
This file is for coding agents working in this repository. It documents validated
build/test commands and code conventions used in this codebase.

## Rule Files (Cursor / Copilot)
- Checked for `.cursorrules`, `.cursor/rules/`, and `.github/copilot-instructions.md`.
- None are present in this repository at the time of writing.
- If these files are added later, treat them as higher-priority local instructions.

## Project Snapshot
- Monorepo with two app stacks plus an AI module.
- Backend: Python 3.13, Django 5.2, DRF 3.16, PostgreSQL.
- Frontend: React 19 (CRA), React Router 7, MUI 7, Axios.
- AI module (`backend/ia_core`): Gemini API, scikit-learn, pytesseract.

## Repository Layout
```text
backend/{
  "name": "remove_ia_app",
  "arguments": {
    "paths": [
      "backend/ia_core",
      "frontend/src/api/config.js"
    ]
  }
}{
  "name": "clean_model_chromadb",
  "arguments": {}
}
  core/                    # settings.py, urls.py
  biblioteca/              # main domain app (models/views/serializers split into packages)
  ia_core/                 # AI app (views.py/models.py files + services/ package)
  shared/                  # shared helpers (response format, constants)
  manage.py
  requirements.txt
frontend/
  src/
    api/                   # axios client + service objects + barrel exports
    components/            # reusable UI and guards
    context/               # AuthContext (single global context)
    hooks/                 # custom hooks
    layouts/               # dashboard shell
    pages/                 # route pages (includes admin/ and trabajo/)
    theme/                 # MUI theme and design config
  e2e/                     # Playwright specs
  playwright.config.js
  package.json
docs/
```

## Build, Lint, and Test Commands
Run commands from the matching stack directory.

### Frontend (`frontend/`)
- Install dependencies: `npm install`
- Start dev server: `npm start`
- Build production bundle: `npm run build`
- Run all unit/integration tests: `npm test -- --watchAll=false`
- Run one Jest file: `npm test -- --watchAll=false --testPathPattern="src/components/__tests__/WorkCard.test.js"`
- Run one Jest test name: `npm test -- --watchAll=false -t "renders"`
- Run all Playwright specs: `npm run test:e2e`
- Run one Playwright spec: `npm run test:e2e -- e2e/login.spec.js`
- Lint: no standalone script; CRA lint runs in `npm start` and `npm run build`

### Backend (`backend/`)
- Activate venv on Windows: `backend-env\Scripts\activate`
- Install dependencies: `pip install -r requirements.txt`
- Run dev server: `python manage.py runserver`
- Run all tests: `python manage.py test`
- Run tests for one app: `python manage.py test biblioteca`
- Run one test class: `python manage.py test biblioteca.tests.TestClassName`
- Run one test method: `python manage.py test biblioteca.tests.TestClassName.test_method`
- Create migrations: `python manage.py makemigrations`
- Apply migrations: `python manage.py migrate`
- Seed default roles: `python manage.py setup_roles`
- Generate thumbnails: `python manage.py generate_thumbnail`
- Import legacy theses: `python manage.py import_legacy_thesis --input-dir <path>`

### Testing Reality Check
- Frontend has active Jest coverage under `src/**/__tests__/`.
- Frontend also has Playwright E2E specs under `frontend/e2e/`.
- Backend test coverage is minimal; `backend/biblioteca/tests.py` is still the default stub.
- Backend has no configured lint/format toolchain (no ruff/flake8/black/isort/pyproject).

## Frontend Coding Conventions (JavaScript)

### Language and Modules
- Use plain JavaScript (`.js`), not TypeScript.
- Use ES modules for app code (`import`/`export`).
- Tooling config may use CommonJS (for example `playwright.config.js`).
- PropTypes and strict type annotations are not currently enforced.

### Imports and Organization
- Preferred import order: React/hooks -> third-party libraries -> router -> local modules.
- Use relative imports; no path alias configuration exists.
- API calls should go through service modules in `src/api/`, usually via barrel import.

### Components, State, Routing
- Use functional components.
- Route-level pages are lazy-loaded in `src/App.js` with `React.lazy` + `Suspense`.
- Global auth state lives in `AuthContext`; avoid adding Redux/Zustand.
- Typical data flow: `useState` + `useEffect` with explicit loading and error states.
- Persist auth data in `localStorage` keys `authToken` and `userData`.

### Styling and UI
- MUI is the primary UI system (`@mui/material`, theme, `sx`).
- Tailwind utilities are also present and used in parts of the app.
- Preserve the style approach already used in the file you are editing.
- Avoid broad restyles unless explicitly requested.

### Naming and Formatting
- Components/files: PascalCase (`WorkCard.js`, `DashboardLayout.js`).
- Service files/objects: camelCase and `Service` suffix (`trabajos.js`, `trabajosService`).
- Variables/functions: camelCase.
- Constants: UPPER_SNAKE_CASE.
- Semicolons and quote style are mixed; match local file style.

### Frontend Error Handling
- Axios client in `src/api/config.js` normalizes server errors.
- Use `try/catch` around async UI actions.
- Keep user-facing error messages clear; follow local patterns (`console.error`, `console.warn`, UI alerts).

## Backend Coding Conventions (Python/Django)

### Architecture and Boundaries
- `biblioteca` uses package-based modules (`models/`, `views/`, `serializers/`).
- Package barrels (`__init__.py`) expose public symbols via `__all__`.
- `ia_core` keeps `views.py` and `models.py` as files; core logic belongs in `services/`.
- Keep views thin and move heavier business logic into services.

### Imports, Types, and Docstrings
- Import order: stdlib -> third-party -> local.
- Type hints are common in `ia_core`; keep adding them in new service logic.
- Use concise docstrings where already practiced (module/class/function).

### Naming
- Classes: PascalCase.
- Functions/methods/variables: snake_case.
- Private helpers: leading underscore (`_parse_limit`).
- Constants: UPPER_SNAKE_CASE.
- Files/modules: snake_case.

### API, Permissions, Authentication
- Use DRF Token auth (`Authorization: Token <token>`).
- Default DRF permission is `IsAuthenticatedOrReadOnly`.
- Pagination default is page size 20.
- Role permissions are centralized in `backend/biblioteca/permissions.py`.
- Keep role/domain names in Spanish (Director de Carrera, Bibliotecario).

### Backend Error Handling
- Prefer standardized helpers from `shared/response_helpers.py`:
  `api_success_response()` and `api_error_response()`.
- In `ia_core`, catch `IAServiceError` for expected domain failures.
- For defensive branches, log unexpected errors with `logger.exception(...)`.

## Domain Language and Naming
- Spanish dominates domain entities and user-facing text.
- English appears more in technical internals and AI/service code.
- Follow the language style of the module you are editing.

## Operational Guardrails
- Never commit or modify secrets in `backend/.env`.
- Database is PostgreSQL and configured via environment variables.
- Media assets are under `backend/media/` (`tesis/`, `trabajos/`, `thumbnails/`).
- Keep `frontend/src/frontend.zip` (legacy archive) unless explicitly asked to remove it.
- No CI/CD or Docker workflow is configured at repository level.
