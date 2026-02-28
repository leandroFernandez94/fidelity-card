# AGENTS.md

Guia para agentes de codigo en este repositorio. Resume comandos, estilo y reglas del proyecto.

## Comandos principales

- Instalar dependencias: `bun install`
- Desarrollo (Vite): `bun run dev`
- Build de produccion: `bun run build`
- Preview build: `bun run preview`
- Lint: `bun run lint`

## Tests

- No hay framework de tests configurado actualmente.
- No existe comando para ejecutar un test individual.
- Si se agrega testing, actualizar esta seccion con:
  - comando general
  - comando de un solo test
  - patron de archivos de tests

## Scripts disponibles (package.json)

- `dev`: inicia Vite
- `build`: `tsc -b` + `vite build`
- `preview`: servidor del build
- `lint`: ESLint sobre todo el repo

## Estructura del proyecto

- `src/`
  - `components/`: UI reutilizable
  - `pages/`: paginas principales (clienta + admin)
  - `pages/admin/`: vistas de administracion
  - `services/`: acceso a Supabase
  - `contexts/`: estado global (Auth)
  - `utils/`: helpers
  - `types/`: tipos TS
- `supabase-setup.sql`: setup completo de DB
- `SETUP_SUPABASE.md`: guia paso a paso
- `opencode.json`: MCP Supabase en read-only

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

## Acceso a datos (Supabase)

- Cliente en `src/services/supabase.ts`.
- Servicios CRUD en `src/services/*`.
- Manejo de errores:
  - lanzar error en servicios
  - capturar en componentes con `try/catch`
- No usar `service_role` en frontend.

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

- Script principal: `supabase-setup.sql`
- Verificacion: `verify-setup.sql`
- Comandos utiles: `sql-commands.sql`
- Crear admin: `create-admin-safe.sql`

## MCPs disponibles

- `supabase` (remote, read_only): configurado en `opencode.json`
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
