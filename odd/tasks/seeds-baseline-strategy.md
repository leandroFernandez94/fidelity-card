# Feature: seeds-baseline-strategy

Issue: #79 (Estrategia seeds/migraciones: baseline automático + fixtures solo para E2E).

## Objective

Separar datos en dos canales: **baseline** (migración premios + bootstrap admin, automático en todos los ambientes) vs **fixtures de test** (seeds explícitos solo para E2E/dev). Eliminar seeds con credenciales hardcodeadas y exit codes falsos.

## Problem / Why

- No hay mecanismo para crear el admin en producción (seed-admin tiene credenciales expuestas en repo público — incidente rotado a mano, ver `odd/tasks/flyio-production-deploy.md`).
- Seeds nunca corren en ambientes deployados; las migraciones son el único canal automático (precedente: 0005 servicios).
- `seed:all` "funciona" aunque todo falle (console.error + exit 0). `seed-clientas` pisa `puntos` de clientas existentes. `db:reset` sin guard anti-prod.
- E2E asume seeds manuales; sin ellos el login falla sin error claro.

## Scope (from issue #79)

1. Migración `0006`: catálogo real de 5 premios (criterio 0005).
2. `backend/scripts/bootstrap-admin.mjs`: idempotente, `ADMIN_EMAIL`/`ADMIN_PASSWORD` de env, rota hash si cambió, bcrypt cost 10; sin env vars → log y continuar. En CMD del Dockerfile tras `db:migrate`.
3. `backend/scripts/seed-test.mjs`: 3 clientas + citas con `cita_servicios` enlazando servicios existentes. Exit codes reales (fallo = 1).
4. Retirar `seed-admin`, `seed-premios`, `seed-servicios`, `seed-clientas`. Nuevos: `bootstrap:admin`, `seed:dev`, `seed:test`. `db:reset` con guard de URLs no locales.
5. E2E: `globalSetup` de Playwright (guard localhost) que resetea, migra, bootstrapea admin de dev y seed-a fixtures. Specs leen credenciales admin de env con fallback.
6. Staging: `DROP SCHEMA public CASCADE` + redeploy (operacional, requiere autorización explícita del usuario — remoto).
7. Docs: AGENTS.md (seeds/tests + corregir ruta `apps/api/drizzle/` → `backend/drizzle/`) y `.env.example` con placeholders nuevos.

## Constraints

- Migraciones SQL no leen env vars → admin via bootstrap post-migrate, NO via migración con hash embebido.
- `premios.nombre` NO tiene unique constraint → migración usa DELETE+INSERT por nombre (criterio 0005).
- `citas.servicio_ids` (uuid[]) sigue NOT NULL → fixtures deben escribir ambas vías (array legacy + `cita_servicios` con `puntos_otorgados_snapshot` NOT NULL tomado del servicio).
- UUIDs `gen_random_uuid()` → lookups por claves naturales (nombre/codigo/email), no IDs fijos.
- Scripts backend corren con bun desde `backend/` cwd; env via dotenv (backend/.env en la práctica).
- E2E dev creds fallback: `admin@test.com` / `admin123` (solo dev/test).

## Tasks

- [x] T1: Rama `feat/seeds-baseline-strategy` desde master
- [x] T2: Migración `0006` baseline premios (SQL + entrada en `_journal.json`)
- [x] T3: `bootstrap-admin.mjs` + CMD Dockerfile + `.env.example`
- [x] T4: `seed-test.mjs` (clientas + citas + cita_servicios, exit codes reales)
- [x] T5: Limpieza scripts obsoletos + scripts npm nuevos (root + backend) + guard localhost en `reset-db.mjs`
- [x] T6: `globalSetup` Playwright + specs con credenciales de env
- [x] T7: Docs: AGENTS.md (seeds/tests, ruta migraciones)
- [x] T8: Verificación local: db:reset → db:migrate → bootstrap:admin → seed:test → vitest backend → e2e → lint
- [x] T9: Push + PR + comentario en issue #79 — PR #80 (labels `type:feature` + `size:exception`, mantenedor aprobó PR único), checks CI en verde, comentario https://github.com/leandroFernandez94/fidelity-card/issues/79#issuecomment-6111488007
- [ ] T10: (Operacional, requiere autorización) reset staging + `fly secrets set ADMIN_EMAIL/ADMIN_PASSWORD` + redeploy

## Verification

- Secuencia local completa de T8 sin errores, con exit codes verificables.
- `bun run lint` sin errores nuevos.
- E2E verde corriendo solo `bun run e2e` (sin seeds manuales previos).

**Resultado observado (T8):**
- `bun run db:reset` → OK (guard permite localhost; dropea schemas public + drizzle para que migrate re-aplique baselines de datos).
- `bun run db:migrate` → OK (0000-0006 aplicadas tras reset).
- Bootstrap: created → ensured (exit 0) → rotated (cambio de password) → sin env vars: skip informativo exit 0.
- `bun run seed:test` → OK; datos verificados vía psql: premios=5, servicios=8, profiles=4 (1 admin + 3 clientas), citas=3, cita_servicios=5; re-run idempotente.
- Guard reset: URL no local (`db.prod.example.com`) → RECHAZA exit 1; normalización cubre `[::1]` y `LoCaLhOsT`.
- Vitest backend: 36/36 verdes.
- `bun run e2e`: **4 pasados / 2 fallados — fallas preexistentes de `puntos.spec`** (espera botón+modal "Nueva Cita"; la UI de master ya es Link a `/admin/citas/nueva`). Nuestro diff no toca frontend; verificado en 3 corridas por el writer + 1 por orquestador. Follow-up: issue aparte (rewrite del spec contra la página dedicada).
- `bun run lint`: 0 errores.

## Delivery

- Estrategia: `ask-on-risk`. **Count real: ~830 authored lines (additions+deletions, docs incl.) > 400** → se consultó al usuario: split en PRs encadenados vs single PR con `size:exception` (pendiente respuesta al momento de este commit).

## Progress

- T1 done: rama desde master (b141870).
- T2-T7 done via writer delegado (sesión ses_ed4645174ffe); verificación independiente (ses_ed44d3055): **0 defectos bloqueantes**, 8 observaciones menores; 3 aplicadas (guard normalizado `[::1]`/case, comentario 0006 en español, `dotenv` como dep explícita de backend — el boot de producción dependía del hoisting del root).
- Gotchas estructurales resueltos por el writer: (1) `db:reset` TRUNCATE-only dejaba vivo el schema `drizzle` → migrate salteaba 0005/0006 tras reset; ahora dropea ambos schemas. (2) `bun run e2e` estaba roto desde antes (playwright sin `-c` escaneaba los vitest del backend); fijado con `-c e2e/playwright.config.ts`.
- Commits (work units):
  - `811ec08` feat(db): add premios catalog baseline migration 0006
  - `501bd18` feat(backend): env-driven admin bootstrap and test fixtures replace legacy seeds
  - `3c98e06` feat(deploy): run admin bootstrap at container boot
  - `b123ba9` test(e2e): self-contained globalSetup with env-based admin credentials
  - (este commit) docs: update AGENTS.md for seed strategy and record feature notes
- T9/T10: pendientes de decisión del usuario (push/PR + reset de staging). Nota T10: el staging corre LOCAL en este server (`fidelity-staging-db`, 127.0.0.1:5433); prod es Fly.io (`fly secrets set ADMIN_EMAIL/ADMIN_PASSWORD` + redeploy; el CMD nuevo bootstrapea solo).
- Descubrimiento post-verificación: `admin.spec.ts` tiene bug latente (locator `div.bg-white` matchea ancestros → `.first()` borra el servicio alfabéticamente primero); los fixtures evitan referenciar "Manicura francesa" para no chocar. Incluido en el follow-up de specs.

## Route evidence

- Exploración: delegada a explore (mapping trigger: >4 archivos).
- Implementación T2-T7: delegada a un writer (writer trigger: 2+ archivos no triviales).
- Commits work-unit + verificación: orquestador.
