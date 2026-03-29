# AGENTS.md

Guia para agentes de codigo en este repositorio. Resume comandos, estilo y reglas del proyecto.

## Comandos principales

- Instalar dependencias: `bun install`
- Desarrollo (unificado): `bun run dev` (inicia frontend + backend)
- Desarrollo frontend solo: `bun --cwd frontend run dev`
- Desarrollo backend solo: `bun --cwd backend run dev`
- Build de produccion: `bun run build`
- Preview build: `bun --cwd frontend run preview`
- Lint: `bun run lint`
- DB migraciones: `bun run db:generate` y `bun run db:migrate`
- Seed datos: `bun run seed:all` (o scripts individuales)

## Tests

- Playwright configurado para E2E tests (root `e2e/`)
- Vitest configurado para backend tests (`backend/src/__tests__/`)
- No hay framework de tests para frontend unit tests

## Scripts disponibles (package.json)

- `dev`: inicia frontend (Vite) + backend (Bun) en paralelo con `concurrently`
- `build`: compila frontend
- `lint`: ESLint sobre todo el repo
- `api:dev`: inicia solo backend
- `db:generate`: genera migraciones Drizzle
- `db:migrate`: ejecuta migraciones Drizzle
- `seed:all`: ejecuta todos los scripts de seed
- `seed:admin`, `seed:servicios`, `seed:clientas`, `seed:premios`: scripts individuales
- `e2e`: ejecuta tests E2E con Playwright
- `e2e:ui`: abre la UI de Playwright para ejecutar tests interactivamente
- `e2e:headed`: ejecuta tests con navegador visible

## Estructura del proyecto (Monorepo Bun Workspaces)

```
fidelity-card/
├── frontend/                 # Workspace: @fidelity-card/frontend
│   ├── src/
│   │   ├── components/       # UI reutilizable
│   │   ├── pages/            # Paginas (clienta + admin)
│   │   │   └── admin/        # Vistas de administracion
│   │   ├── services/         # Cliente HTTP al backend
│   │   ├── contexts/         # Estado global (Auth)
│   │   └── utils/            # Helpers
│   ├── public/               # Activos estaticos
│   ├── index.html            # Entry point Vite
│   ├── vite.config.ts        # Config Vite (proxy /api -> :3001)
│   ├── package.json          # Deps frontend
│   └── tsconfig.json         # TS config con referencias
├── backend/                  # Workspace: @fidelity-card/backend
│   ├── src/
│   │   ├── modules/          # Rutas y handlers API
│   │   ├── domain/           # Logica de negocio y transformers
│   │   ├── db/               # Drizzle ORM y esquemas
│   │   └── __tests__/        # Tests backend (Vitest)
│   ├── drizzle/              # Migraciones SQL
│   ├── scripts/              # Scripts de seed
│   ├── package.json          # Deps backend
│   ├── tsconfig.json         # TS config con referencias
│   └── drizzle.config.ts     # Config Drizzle Kit
├── packages/shared/          # Workspace: @fidelity-card/shared
│   ├── src/
│   │   └── types/            # Tipos compartidos (Profile, Servicio, etc.)
│   ├── package.json          # Sin deps (solo tipos)
│   └── tsconfig.json         # TS config composite
├── e2e/                      # Tests E2E Playwright
├── docker-compose.yml        # Postgres local para dev
├── package.json              # Root workspace config
├── tsconfig.json             # Workspace coordinator
└── tsconfig.base.json        # Shared TS config
```

## Estilo de codigo (TypeScript/React)

- TypeScript estricto (`strict: true`). No uses `any`.
- Usa `type`/`interface` explicitamente para props y entidades.
- Mantener consistencia con imports actuales:
  - React primero
  - luego imports internos
  - luego imports de tipos (con `type`)
- Modulos ES con comillas simples y punto y coma.
- Preferir funciones nombradas en componentes:
  - `export default function Nombre()`
- Hooks con `use` prefijo. No llamar hooks condicionalmente.
- Para estado async:
  - `loading`, `error` en estado
  - `try/catch/finally` como en `AuthContext`

## Convenciones de nombres

- Componentes: `PascalCase` (ej. `AdminDashboard`)
- Archivos de componentes: `PascalCase.tsx`
- Hooks: `useAlgo`
- Servicios: `*_service` en nombre exportado (ej. `serviciosService`)
- Utilidades: funciones en `camelCase`
- Tipos: `PascalCase` (`Profile`, `Servicio`)

## React y rutas

- Router: React Router v7
- Layout con navbar: `LayoutWithNav`
- Rutas admin viven en `/admin/*`
- No agregar rutas sin incluir en `src/App.tsx`

## Estilos y UI

- Tailwind CSS v4.
- Preferir clases utilitarias sobre CSS adicional.
- Mantener coherencia de colores actuales:
  - `primary`, `secondary`, `accent` definidos en `src/index.css`
- Respetar estilos responsive existentes (usar `md`, `lg` en grid).

## Acceso a datos (API)

- Cliente HTTP en `src/services/api.ts`.
- Servicios CRUD en `src/services/*`.
- Manejo de errores:
  - lanzar error en servicios
  - capturar en componentes con `try/catch`

## Autenticacion

- Contexto: `AuthContext`.
- `signUp` crea usuario y luego inserta profile.
- `signOut` limpia estado local.
- Siempre validar `user` y `profile` antes de mostrar UI.

## Manejo de errores

- Preferir `try/catch` en efectos y acciones async.
- Mostrar mensajes de error al usuario si corresponde.
- Log de errores con `console.error` (consistente con el codigo actual).

## Formateo

- Mantener comillas simples.
- Mantener punto y coma.
- JSX con props en multiples lineas cuando sea largo.
- Evitar comentarios innecesarios.

## Linting

- ESLint con:
  - `@eslint/js`
  - `typescript-eslint`
  - `eslint-plugin-react-hooks`
  - `eslint-plugin-react-refresh`
- Respetar reglas de hooks.
- No introducir variables sin uso.

## Configuracion TS

- `tsconfig.app.json` con:
  - `strict: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noUncheckedSideEffectImports: true`
- No desactivar estas opciones.

## Archivos y datos sensibles

- `.env` no se versiona.
- No commitear credenciales.
- Usar `.env.example` para documentar variables.

## Base de datos

- Postgres local via `docker-compose.yml`
- Migraciones en `apps/api/drizzle/`

## MCPs disponibles

- `context7`: documentacion tecnica
- `filesystem`: operaciones en `/home/leandro` y `/mnt/storage`
- `docker`: gestion de contenedores
- `torrents-explorer`: busqueda de torrents (no usar aqui)

## Reglas adicionales

- No hay reglas de Cursor (`.cursor/rules/` o `.cursorrules`).
- No hay reglas de Copilot (`.github/copilot-instructions.md`).
- Si se agregan, actualizar este archivo.

## Notas de operacion

- Usar `bun run dev` para verificar UI.
- Si cambias `.env`, reinicia Vite.
- Preferir cambios pequenos y atomicos.
- Mantener consistencia con archivos ya existentes.

## Actualizacion de esta guia

- Si agregas tests, actualiza la seccion de tests.
- Si agregas nuevas convenciones, reflejarlas aqui.
- Mantener longitud aproximada y claridad.
