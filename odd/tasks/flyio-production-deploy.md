# Feature: flyio-production-deploy

Issue: #69 (Deployment: producción en Fly.io). Continúa #65 (Docker + staging, ya mergeado en master).

## Objective

Deploy de producción en Fly.io: 2 apps Docker (backend Elysia + frontend nginx SPA) + Postgres managed, single-origin (nginx proxéa /api/ a backend via DNS interno de Fly).

## Problem / Why

El proyecto no tiene ambiente de producción. Plataforma decidida (memoria `architecture/production-deploy`): Fly.io ganó el balance costo/ops vs Railway/Hetzner/home-server. La auth usa cookies same-origin (`credentials: 'include'`) → el patrón proxy nginx single-origin debe preservarse.

## Decisions (user-locked 2026-10-10)

- App names: `fidelity-card-backend` / `fidelity-card-frontend` (DNS interno: `http://fidelity-card-backend.internal:3001`).
- Dominio: hostnames `.fly.dev` gratuitos ahora; dominio propio via `fly certs` después.
- Región: España o cerca → `mad` (Madrid); verificar disponibilidad con CLI, fallback `cdg` (París).
- flyctl NO estaba instalado (verificado): instalar en esta sesión.

## Constraints

- Dockerfiles requieren build context = repo root → configs fly en root (`fly.backend.toml`, `fly.frontend.toml`), deploy siempre con `-c`.
- Migraciones Drizzle corren al boot (CMD del backend) → healthcheck con grace_period amplio (~30s+).
- Backend escucha `PORT` (default 3001); healthcheck `GET /api/health`.
- Frontend nginx: `PORT=80` default, `API_UPSTREAM` via envsubst template.
- Secrets backend: `DATABASE_URL` (attach de fly postgres), `JWT_SECRET` (openssl rand). Frontend: `API_UPSTREAM` en [env] (no secret).
- Presupuesto objetivo: ~US$10/mes (2 machines 256MB + PG smallest).

## Tasks

- [ ] T1: Rama `feat/flyio-production-deploy` desde origin/master
- [ ] T2: `fly.backend.toml` + `fly.frontend.toml` (region mad, machines shared-cpu-1x 256MB, healthchecks, grace para migraciones)
- [ ] T3: DEPLOY.md — reemplazar sección Railway por Fly.io como ruta principal (mantener Coolify/VPS alternativa + smoke local)
- [ ] T4: Instalar flyctl + `fly auth login` (usuario completa browser auth)
- [ ] T5: `fly postgres create` (region mad) + attach a backend → DATABASE_URL
- [ ] T6: `fly apps create` x2 + `fly secrets set JWT_SECRET` + deploy x2
- [ ] T7: Smoke test: SPA en frontend.fly.dev + `GET /api/health` via proxy + login
- [ ] T8: Commit(s) work-unit + PR + comentario en issue #69

## Verification

- `fly config validate -c fly.backend.toml` / `fly.frontend.toml` (post-installo CLI)
- `bun run lint` sin errores nuevos
- Post-deploy: `curl <frontend-url>` (200 SPA) y `curl .../api/health` ({"ok":true})
- Login con credenciales de prueba

## Progress

- T1 done: rama creada desde origin/master (74e44c0).

## Route evidence

- T2+T3: delegated writer (3 archivos no triviales, trigger writer).
- T4-T7: inline bash (per-action, estado remoto autorizado por el usuario via issue + respuestas).
