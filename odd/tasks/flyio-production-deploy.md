# Feature: flyio-production-deploy

Issue: #69 (Deployment: producción en Fly.io). Continúa #65 (Docker + staging, ya mergeado en master).

## Objective

Deploy de producción en Fly.io: 2 apps Docker (backend Elysia + frontend nginx SPA) + Postgres managed, single-origin (nginx proxéa /api/ a backend via DNS interno de Fly).

## Problem / Why

El proyecto no tiene ambiente de producción. Plataforma decidida (memoria `architecture/production-deploy`): Fly.io ganó el balance costo/ops vs Railway/Hetzner/home-server. La auth usa cookies same-origin (`credentials: 'include'`) → el patrón proxy nginx single-origin debe preservarse.

## Decisions (user-locked 2026-10-10)

- App names: `fidelity-card-backend` / `fidelity-card-frontend` (DNS interno: `http://fidelity-card-backend.internal:3001`).
- Dominio: hostnames `.fly.dev` gratuitos ahora; dominio propio via `fly certs` después.
- Región: España o cerca → `cdg` (París, la región Fly más cercana a España; `mad` no existe en Fly).
- flyctl NO estaba instalado (verificado): instalar en esta sesión.

## Constraints

- Dockerfiles requieren build context = repo root → configs fly en root (`fly.backend.toml`, `fly.frontend.toml`), deploy siempre con `-c`.
- Migraciones Drizzle corren al boot (CMD del backend) → healthcheck con grace_period amplio (~30s+).
- Backend escucha `PORT` (default 3001); healthcheck `GET /api/health`.
- Frontend nginx: `PORT=80` default, `API_UPSTREAM` via envsubst template.
- Secrets backend: `DATABASE_URL` (attach de fly postgres), `JWT_SECRET` (openssl rand). Frontend: `API_UPSTREAM` en [env] (no secret).
- Presupuesto objetivo: ~US$10/mes (2 machines 256MB + PG smallest).

## Tasks

- [x] T1: Rama `feat/flyio-production-deploy` desde origin/master
- [x] T2: `fly.backend.toml` + `fly.frontend.toml` (region mad, machines shared-cpu-1x 256MB, healthchecks, grace para migraciones)
- [x] T3: DEPLOY.md — reemplazar sección Railway por Fly.io como ruta principal (mantener Coolify/VPS alternativa + smoke local)
- [x] T4: Instalar flyctl + `fly auth login` (usuario completó browser auth)
- [x] T5: `fly postgres create` (region cdg) + attach a backend → DATABASE_URL (secrets staged)
- [x] T6: `fly apps create` x2 + `fly secrets set JWT_SECRET` + deploy x2
- [x] T7: Smoke test: SPA en el hostname público + `GET /api/health` via proxy + login
- [x] T8: Push + PR + comentario en issue #69 — PR #70, comentario https://github.com/leandroFernandez94/fidelity-card/issues/69#issuecomment-6097365506. Verificación pre-PR: tsc -b 0 errores, 36/36 tests backend, lint 0.

## Verification

- `fly config validate -c fly.backend.toml` / `fly.frontend.toml` (post-installo CLI)
- `bun run lint` sin errores nuevos
- Post-deploy: `curl https://<frontend-app>.fly.dev` (200 SPA) y `curl .../api/health` ({"ok":true})
- Login con credencial de prueba (rotada post-smoke)

## Progress

- T1 done: rama creada desde origin/master (74e44c0).
- T2+T3 done: commit d207d07 (writer delegado; verificación: TOML OK via tomllib, lint 0 errores antes/después, read-back completo; review assess = medium por .atl auto-generado ajeno al cambio; RDD off).
- Región: `mad` no existe en Fly → `cdg` (commits 92adcb0, 8dec3ec).
- T4-T6 done: flyctl v0.4.115, auth OK, PG `fidelity-card-db` (cdg, 1 nodo, volume 10GB, user propio del attach), apps creadas, secrets DATABASE_URL+JWT_SECRET, deploys exitosos.
- T7 done (2026-10-10): SPA 200 (Calixta Lab), /api/health {"ok":true} via proxy, signin OK (cookie session), GET /api/servicios authed 200 [].
- Deploy URLs: registradas en el dashboard de Fly; no se documentan en artifacts públicos.
- Nota: Fly creó 2 machines por app (zero-downtime default). Escalable a 1 por app con `fly scale count 1` si se quiere reducir costo.
- Nota seguridad (2026-10-10): la credencial del seed quedó expuesta en artifacts públicos (comentario issue + este doc) → ROTADA en producción vía update del hash bcrypt (verificado: vieja 401, nueva 200). Follow-up: parametrizar seed-admin con env vars (el repo es público).

## Route evidence

- T2+T3: delegated writer (3 archivos no triviales, trigger writer).
- T4-T7: inline bash (per-action, estado remoto autorizado por el usuario via issue + respuestas).

- Historia reescrita con filter-branch (aprobado por el usuario) para eliminar del PR la credencial muerta, el email y las URLs: 2 pasadas (la segunda cubrió formas sin https://). Refs locales refs/original limpiadas.

## Fase Cloudflare + anti-DDoS (2026-10-11)

- Dominio propio conectado via CF proxy (naranja): cert LE emitido via TXT _fly-ownership; DNS A/AAAA proxied; Full (strict).
- nginx: host-guard (solo ALLOWED_HOST sirve el sitio; fly.dev limitado a /api/health; resto 421). ALLOWED_HOST via fly secret (repo publico).
- HTML con no-cache; assets immutable 1y; verificado cf-cache MISS→HIT.
- Descubrimiento: el healthcheck de Fly NO usa el hostname de la app como Host (cae en default_server) → /api/health responde en cualquier Host; todo lo demas 421.
- Realidad verificada: scanners encontraron el dominio en <1h via logs publicos de certificados (crt.sh); CF absorbio todo.
- Commits: c888476 (guard) + fix default-server healthcheck.
