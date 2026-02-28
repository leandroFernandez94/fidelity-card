# Tareas del Proyecto

## [1] Infra DB: Postgres en Docker (dev)
**Estado:** done
**Descripción:** (Refactor Supabase -> BE propio) Crear `docker-compose.yml` para Postgres 16 con volumen persistente y configuracion por variables de entorno. Incluir puertos para dev (idealmente bind a `127.0.0.1`) y dejar un ejemplo de `DATABASE_URL` para el BE en Bun.
**Criterios de aceptacion:** Postgres levanta con `docker compose up -d`, persistencia via volumen, healthcheck OK, `DATABASE_URL` documentada.
**Comentarios:** Completado: agregue `docker-compose.yml` con Postgres 16 + volumen y healthcheck. Actualice `.env.example` con variables de Postgres y `DATABASE_URL`. Smoke test OK con `psql` dentro del contenedor. Archivos: `docker-compose.yml`, `.env.example`, `.gitignore`.

---

## [2] Backend scaffold: Bun + Elysia base
**Estado:** done
**Descripción:** (Refactor Supabase -> BE propio) Crear el proyecto de API en una carpeta dedicada (ej. `apps/api/`) usando Bun + Elysia. Agregar servidor con `GET /api/health`, manejo basico de errores, lectura de env (`PORT`, `NODE_ENV`).
**Criterios de aceptacion:** API levanta en `PORT=3001` por defecto y responde `GET /api/health` con JSON `{ ok: true }`.
**Comentarios:** Completado: cree `apps/api/` con Elysia, env basico (`PORT`, `NODE_ENV`), handler de error y endpoint `GET /api/health`. Agregue scripts `api:dev`/`api:start` en `package.json`. Smoke test OK (curl a `/api/health`). Archivos: `apps/api/src/index.ts`, `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/bun.lock`.

---

## [3] DB schema + migraciones: Drizzle + Postgres
**Estado:** done
**Descripción:** (Refactor Supabase -> BE propio) Definir esquema Drizzle para `users`, `profiles`, `servicios`, `citas`, `referidos`, `premios`, `recordatorios` en Postgres Docker (MVP, sin RLS/policies, sin triggers y sin indices extra). Configurar migraciones y comando para aplicarlas.
**Contexto:** Hoy el FE asume las formas de `src/types/index.ts` y los services hacen CRUD directo en Supabase (`src/services/*.ts`). Queremos replicar esas tablas en Postgres local y que el BE exponga APIs equivalentes.
**Alcance MVP (decisiones):**
- UUIDs en PK como en Supabase.
- Mantener `created_at`/`fecha` como timestamp con timezone.
- Mantener `citas.servicio_ids` como array de UUID.
- Reemplazar `auth.users` (Supabase) por tabla `users` propia (email + password hash) y `profiles` referenciando `users`.
**Entregables:** schema Drizzle, folder de migraciones, script para generar y aplicar migraciones, `.env.example` con `DATABASE_URL`.
**Criterios de aceptacion:**
- `db:generate` crea una migracion con las 7 tablas.
- `db:migrate` aplica migraciones sobre el Postgres Docker sin errores.
- El esquema refleja los tipos de `src/types/index.ts` (campos y enums) sin depender de Supabase.
**Notas de migracion desde Supabase:** no traer triggers/RLS/indices del `supabase-setup.sql` (se dejan fuera por ahora).
**Comentarios:** Completado: agregue schema Drizzle para 7 tablas + enums (rol, cita_estado) y configure drizzle-kit con migraciones. Incluye scripts `db:generate`/`db:migrate` y smoke `db:smoke` usando `.env.example` (probado con `bun run ...`). Migraciones aplican OK contra Postgres Docker. Archivos: `drizzle.config.ts`, `apps/api/src/db/schema/*`, `apps/api/src/db/index.ts`, `apps/api/drizzle/*`, `scripts/smoke-db.mjs`, `package.json`, `BUN.md`.

---

## [4] Auth API: cookie httpOnly (JWT)
**Estado:** todo
**Descripción:** (Refactor Supabase Auth -> Auth propio) Implementar auth stateless con JWT guardado en cookie `httpOnly` (dev con Vite proxy, sin CORS). Endpoints: `POST /api/auth/signup`, `POST /api/auth/signin`, `POST /api/auth/signout`, `GET /api/auth/me`. Middleware `requireAuth` y `requireAdmin` (chequeo por `rol`).
**Contexto:** Hoy `src/contexts/AuthContext.tsx` usa `supabase.auth.*` y `profiles` para rol/puntos. El nuevo flow debe proveer lo mismo via `/api/auth/*`.
**Alcance MVP (decisiones):**
- Password hashing: bcrypt (o argon2) en el BE; nunca guardar password en claro.
- Cookie: `httpOnly`, `sameSite=lax`, `secure` solo en prod, `path=/`.
- JWT payload minimo: `sub` (userId) + `rol` (o se resuelve via DB en `me`).
- TTL: corto (ej. 7d) y rotacion simple opcional (se puede postergar).
**Entregables:** endpoints + middleware + manejo de 401/403 consistente.
**Criterios de aceptacion:**
- `POST /api/auth/signup` crea `users` + `profiles` (rol default `clienta`) y deja cookie seteada.
- `POST /api/auth/signin` valida credenciales, setea cookie.
- `POST /api/auth/signout` limpia cookie.
- `GET /api/auth/me` devuelve `{ user, profile }` o `401`.
- `requireAdmin` bloquea rutas admin con `403`.
**Comentarios:**

---

## [5] API de negocio: servicios
**Estado:** todo
**Descripción:** (Refactor FE -> API) Reemplazar el acceso directo a Supabase para `servicios` por endpoints del BE: `GET /api/servicios` (publico) y `POST/PATCH/DELETE /api/servicios/:id` (admin) conectados a Drizzle.
**Contexto:** Hoy `src/services/servicios.ts` hace CRUD en Supabase y las pantallas admin dependen de ese shape.
**Entregables:** handlers Elysia + queries Drizzle + validacion input.
**Criterios de aceptacion:**
- `GET /api/servicios` devuelve lista ordenada por `nombre`.
- Admin puede crear/editar/borrar; no-admin recibe `403`.
- Payloads compat con `Servicio` (`src/types/index.ts`).
**Comentarios:**

---

## [6] API de negocio: citas
**Estado:** todo
**Descripción:** (Refactor FE -> API) Reemplazar el acceso directo a Supabase para `citas` por endpoints del BE: `GET /api/citas`, `GET /api/citas?clienta_id=...` y `POST/PATCH/DELETE /api/citas/:id` (permisos simples). Soportar update de `estado` como lo usa el admin.
**Contexto:** Hoy `src/services/citas.ts` filtra por `clienta_id`, consulta pendientes/proximas y actualiza `estado`.
**Alcance MVP (permisos simples):**
- Admin: puede ver y editar todo.
- Clienta: puede ver/crear/editar solo sus citas (por `clienta_id = me`).
**Entregables:** endpoints + reglas de permisos + validacion de enum `estado`.
**Criterios de aceptacion:**
- `GET /api/citas` (admin) lista todas.
- `GET /api/citas?clienta_id=me|<uuid>` respeta permisos.
- `PATCH /api/citas/:id` permite cambiar `estado` y `notas`.
**Comentarios:**

---

## [7] API de negocio: profiles
**Estado:** todo
**Descripción:** (Refactor Supabase profiles -> API) Implementar `GET /api/profiles?rol=clienta` (admin) y `GET/PATCH /api/profiles/:id` (propio o admin). Mantener forma de datos compatible con `src/types/index.ts`.
**Contexto:** Hoy `src/services/profiles.ts` lista y actualiza perfiles; el admin ve clientas por rol.
**Entregables:** endpoints + permisos + validacion.
**Criterios de aceptacion:**
- Admin puede listar por rol.
- Usuario puede leer/editar su perfil (no puede auto-elevase a admin).
- Shape compat con `Profile`.
**Comentarios:**

---

## [8] API de negocio: referidos + puntos
**Estado:** todo
**Descripción:** (Refactor FE -> API) Implementar `GET /api/referidos?referente_id=...`, `POST /api/referidos` y endpoints de puntos necesarios (`/api/puntos/top`, `/api/puntos/sumar`, `/api/puntos/restar`) o equivalente integrado para reemplazar los services que hoy usan Supabase.
**Contexto:** Hoy `src/services/referidos.ts` y `src/services/puntos.ts` actualizan `profiles.puntos` directo y guardan `referidos`.
**Alcance MVP:** sin transacciones complejas al inicio, pero evitar inconsistencias obvias (ideal: transaccion al crear referido + sumar puntos).
**Entregables:** endpoints + logica de puntos.
**Criterios de aceptacion:**
- `GET /api/puntos/top` devuelve top clientas (rol=clienta) por puntos.
- `POST /api/referidos` crea referido y suma puntos al referente.
**Comentarios:**

---

## [9] Frontend: Vite proxy /api -> API
**Estado:** todo
**Descripción:** (Refactor con cookie httpOnly) Configurar `vite.config.ts` para proxyear `/api` a `http://localhost:3001` en dev. Objetivo: evitar CORS y permitir auth por cookie `httpOnly` via mismo origin.
**Entregables:** config proxy en `vite.config.ts`.
**Criterios de aceptacion:** llamadas a `/api/*` desde el FE funcionan en dev sin CORS y con cookies (`credentials: include`).
**Comentarios:**

---

## [10] Frontend: HTTP client base (fetch)
**Estado:** todo
**Descripción:** (Refactor FE -> API) Crear `src/services/api.ts` como wrapper de `fetch` para el nuevo BE, mandando `credentials: 'include'` (cookie httpOnly), manejando JSON y normalizando errores (especialmente 401).
**Entregables:** `api.ts` con helpers `get/post/patch/delete`.
**Criterios de aceptacion:**
- Todas las requests incluyen `credentials: 'include'`.
- Error handling consistente (throw con mensaje util; detectar `401` para flujo de logout).
**Comentarios:**

---

## [11] Frontend: AuthContext sin Supabase
**Estado:** todo
**Descripción:** (Refactor Supabase Auth -> Auth propio) Refactor de `src/contexts/AuthContext.tsx` para usar `/api/auth/*` y `GET /api/auth/me` con cookies `httpOnly`. Eliminar dependencias de `supabase.auth`.
**Entregables:** nuevo AuthContext usando `fetch` + `api.ts`, y tipos alineados con `Profile`.
**Criterios de aceptacion:**
- `signIn/signUp/signOut` llaman a endpoints del BE.
- `refreshProfile` se basa en `/api/auth/me` o `/api/profiles/:id`.
- Ningun import de `@supabase/supabase-js` queda en el contexto.
**Comentarios:**

---

## [12] Frontend: migrar services (profiles/servicios/citas/referidos/puntos)
**Estado:** todo
**Descripción:** (Refactor FE -> API) Reemplazar `src/services/*.ts` para llamar a la nueva API (usando `api.ts`) en lugar de Supabase. Ajustar paginas si cambia algun payload/respuesta.
**Contexto:** Files actuales a migrar: `src/services/profiles.ts`, `src/services/servicios.ts`, `src/services/citas.ts`, `src/services/referidos.ts`, `src/services/puntos.ts`.
**Entregables:** servicios reescritos apuntando al BE; actualizar paginas que dependan de querys especificas (pendientes/proximas/top).
**Criterios de aceptacion:** app funciona en dev sin `VITE_SUPABASE_*` y sin llamadas a Supabase.
**Comentarios:**

---

## [13] Limpieza: remover Supabase del frontend
**Estado:** todo
**Descripción:** (Refactor final) Eliminar integracion Supabase del frontend: borrar `src/services/supabase.ts` y `src/pages/TestSupabase.tsx` (o reemplazar por test API). Quitar `@supabase/supabase-js` del `package.json` cuando no haya imports.
**Entregables:** remover archivos + remover dependency + limpiar env vars Supabase.
**Criterios de aceptacion:** `bun run build` y `bun run lint` pasan sin Supabase.
**Comentarios:**

---

## [14] Docs: guia MVP para levantar FE+API+DB
**Estado:** todo
**Descripción:** (Refactor Supabase -> BE propio) Crear/actualizar doc (ej. `DEV.md`) con pasos para levantar Postgres (docker), correr migraciones (drizzle), correr API (bun/elysia) y correr FE (vite + proxy /api). Incluir variables de entorno de ejemplo.
**Entregables:** doc con comandos copy/paste + variables minimas.
**Criterios de aceptacion:** un dev nuevo puede levantar todo en <10 minutos siguiendo la guia.
**Comentarios:**

---
