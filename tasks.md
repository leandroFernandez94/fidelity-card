# Tareas del Proyecto

## [1] Infra DB: Postgres en Docker (dev)
**Estado:** done
**Descripción:** Crear `docker-compose.yml` para Postgres 16 con volumen persistente y configuracion por variables de entorno. Incluir puertos para dev (idealmente bind a `127.0.0.1`) y dejar un ejemplo de `DATABASE_URL` para el BE.
**Comentarios:** Completado: agregue `docker-compose.yml` con Postgres 16 + volumen y healthcheck. Actualice `.env.example` con variables de Postgres y `DATABASE_URL`. Smoke test OK con `psql` dentro del contenedor. Archivos: `docker-compose.yml`, `.env.example`, `.gitignore`.

---

## [2] Backend scaffold: Bun + Elysia base
**Estado:** done
**Descripción:** Crear el proyecto de API en una carpeta dedicada (ej. `apps/api/`). Agregar servidor Elysia con `GET /api/health`, manejo basico de errores, lectura de env (`PORT`, `NODE_ENV`).
**Comentarios:** Completado: cree `apps/api/` con Elysia, env basico (`PORT`, `NODE_ENV`), handler de error y endpoint `GET /api/health`. Agregue scripts `api:dev`/`api:start` en `package.json`. Smoke test OK (curl a `/api/health`). Archivos: `apps/api/src/index.ts`, `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/bun.lock`.

---

## [3] DB schema + migraciones: Drizzle + Postgres
**Estado:** todo
**Descripción:** Definir esquema Drizzle para `users`, `profiles`, `servicios`, `citas`, `referidos`, `premios`, `recordatorios` (MVP, sin RLS/triggers/indices extra). Configurar migraciones y comando para aplicarlas contra la DB docker.
**Comentarios:**

---

## [4] Auth API: cookie httpOnly (JWT)
**Estado:** todo
**Descripción:** Implementar auth stateless con JWT guardado en cookie `httpOnly`. Endpoints: `POST /api/auth/signup`, `POST /api/auth/signin`, `POST /api/auth/signout`, `GET /api/auth/me`. Middleware `requireAuth` y `requireAdmin` (chequeo por `rol`).
**Comentarios:**

---

## [5] API de negocio: servicios
**Estado:** todo
**Descripción:** Implementar endpoints `GET /api/servicios` (publico) y `POST/PATCH/DELETE /api/servicios/:id` (admin) conectados a Drizzle.
**Comentarios:**

---

## [6] API de negocio: citas
**Estado:** todo
**Descripción:** Implementar `GET /api/citas`, `GET /api/citas?clienta_id=...` y `POST/PATCH/DELETE /api/citas/:id` (con permisos simples). Soportar update de `estado` como lo usa el admin.
**Comentarios:**

---

## [7] API de negocio: profiles
**Estado:** todo
**Descripción:** Implementar `GET /api/profiles?rol=clienta` (admin) y `GET/PATCH /api/profiles/:id` (propio o admin). Mantener forma de datos compatible con `src/types/index.ts`.
**Comentarios:**

---

## [8] API de negocio: referidos + puntos
**Estado:** todo
**Descripción:** Implementar `GET /api/referidos?referente_id=...`, `POST /api/referidos` y endpoints de puntos necesarios (`/api/puntos/top`, `/api/puntos/sumar`, `/api/puntos/restar`) o equivalente integrado.
**Comentarios:**

---

## [9] Frontend: Vite proxy /api -> API
**Estado:** todo
**Descripción:** Configurar `vite.config.ts` para proxyear `/api` a `http://localhost:3001` en dev. El objetivo es evitar CORS y permitir cookies.
**Comentarios:**

---

## [10] Frontend: HTTP client base (fetch)
**Estado:** todo
**Descripción:** Crear `src/services/api.ts` como wrapper de `fetch` que mande `credentials: 'include'`, maneje JSON y normalice errores (especialmente 401).
**Comentarios:**

---

## [11] Frontend: AuthContext sin Supabase
**Estado:** todo
**Descripción:** Refactor de `src/contexts/AuthContext.tsx` para usar `/api/auth/*` y `GET /api/auth/me`. Eliminar dependencias de `supabase.auth`.
**Comentarios:**

---

## [12] Frontend: migrar services (profiles/servicios/citas/referidos/puntos)
**Estado:** todo
**Descripción:** Reemplazar `src/services/*.ts` para llamar a la nueva API (usando `api.ts`). Ajustar paginas si cambia algun payload/respuesta.
**Comentarios:**

---

## [13] Limpieza: remover Supabase del frontend
**Estado:** todo
**Descripción:** Eliminar `src/services/supabase.ts` y `src/pages/TestSupabase.tsx` (o reemplazar por test API). Quitar `@supabase/supabase-js` del `package.json` cuando no haya imports.
**Comentarios:**

---

## [14] Docs: guia MVP para levantar FE+API+DB
**Estado:** todo
**Descripción:** Crear/actualizar doc (ej. `DEV.md`) con pasos para levantar Postgres (docker), correr migraciones, correr API (bun) y correr FE (vite). Incluir variables de entorno de ejemplo.
**Comentarios:**

---
