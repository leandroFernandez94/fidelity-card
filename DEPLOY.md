# Guía de deployment

Este repositorio se deploya como **dos servicios Docker más una base de datos PostgreSQL**, con un patrón **single-origin**: el frontend (nginx) sirve el build de Vite y proxéa `/api/` al backend. No hay CORS ni URLs absolutas: el navegador solo conoce un dominio.

| Servicio | Imagen | Responsabilidad |
|---|---|---|
| `frontend` | `frontend/Dockerfile` (multi-stage: Bun build + nginx 1.27) | Sirve la SPA (`/usr/share/nginx/html`), redirige rutas desconocidas a `index.html` (SPA fallback) y proxéa `/api/` al `API_UPSTREAM` |
| `backend` | `backend/Dockerfile` (Bun + Elysia) | Ejecuta las migraciones de Drizzle al arrancar y luego levanta la API en el puerto `PORT` (default 3001) |
| `db` | PostgreSQL administrado o contenedor | Fuente de `DATABASE_URL` |

Ambas imágenes se construyen con el contexto en la **raíz del monorepo** (los Dockerfiles copian manifests + `bun.lock` primero para aprovechar la caché de capas).

## Variables de entorno

### Backend

Requeridas (ver `backend/src/config/env.ts` y `backend/drizzle.config.ts`):

| Variable | Obligatoria | Notas |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL. La usan las migraciones (`drizzle-kit migrate`) y el cliente `pg` del backend |
| `JWT_SECRET` | Sí | Secreto para firmar cookies de autenticación. Generá uno aleatorio y guardalo en el gestor de secretos de la plataforma |
| `NODE_ENV` | Recomendada | El Dockerfile ya fija `NODE_ENV=production` como default; solo hace falta si la plataforma la sobrescribe |
| `PORT` | No | Default 3001. Fijala solo si la plataforma lo exige |

El contenedor backend **falla al arrancar si la migración falla** (comando: `bun run db:migrate && exec bun src/index.ts`).

### Frontend (nginx)

| Variable | Obligatoria | Notas |
|---|---|---|
| `API_UPSTREAM` | Sí (tiene default `http://backend:3001`) | URL del backend **sin barra final**. nginx proxéa `/api/health` → `${API_UPSTREAM}/api/health` sin reescribir el path |
| `PORT` | No (default 80) | Puerto donde escucha nginx. Útil en plataformas que inyectan su propio `PORT` |

El template `frontend/nginx.default.conf.template` se procesa con `envsubst` al arrancar la imagen oficial de nginx.

## Railway (ruta principal)

1. Crear un proyecto nuevo en Railway.
2. **Servicio `backend`**: "Deploy from GitHub repo" → Root Directory: `/` (raíz del repo) → Dockerfile path: `backend/Dockerfile`.
3. **Servicio `frontend`**: mismo repo → Root Directory: `/` → Dockerfile path: `frontend/Dockerfile`.
4. **PostgreSQL**: "Add service" → PostgreSQL. Railway expone `DATABASE_URL` en las variables de referencia del servicio.
5. Variables del servicio `backend`:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (referencia al servicio Postgres de Railway)
   - `JWT_SECRET` = secreto aleatorio largo (ej. `openssl rand -base64 32`)
   - `NODE_ENV` = `production` (ya es default del Dockerfile, declararla es opcional)
6. Variables del servicio `frontend`:
   - `API_UPSTREAM` = `http://backend.railway.internal:3001` (red privada de Railway; el nombre es el del servicio backend)
7. **Dominio público**: generarlo SOLO en el servicio `frontend` (Settings → Networking → Generate Domain). El backend queda accesible únicamente por la red privada; todo el tráfico público entra por nginx.

Auto-deploy: por default Railway reconstruye y redeploya ambos servicios en cada push a la branch configurada (Settings → Source → Branch). Para staging y producción usá **dos proyectos Railway separados** apuntando a branches distintas del mismo repo (ej. `main` → producción, `staging` → staging), cada uno con su propio PostgreSQL y su propio `JWT_SECRET`.

## Coolify / VPS (alternativa)

Los mismos builds funcionan en Coolify (o cualquier Docker host):

1. Crear dos aplicaciones Docker desde el repo, ambas con build context en la raíz:
   - backend: Dockerfile `backend/Dockerfile`
   - frontend: Dockerfile `frontend/Dockerfile`
2. Crear el PostgreSQL (interno de Coolify o contenedor propio) en la misma red privada que el backend.
3. Variables:
   - backend: `DATABASE_URL` (según el Postgres elegido), `JWT_SECRET`, `NODE_ENV=production`.
   - frontend: `API_UPSTREAM=http://backend:3001`, usando el DNS interno de Docker/Coolify (el nombre del servicio backend debe resolverse por DNS dentro de la red compartida).
4. Exponer públicamente solo el puerto del frontend; backend y base de datos quedan en la red interna.

## Local (build y smoke test)

Desde la raíz del repo:

```bash
docker compose up -d db

docker build -f backend/Dockerfile -t fidelity-backend:dev .
docker build -f frontend/Dockerfile -t fidelity-frontend:dev .

docker run --rm -d --name fidelity-smoke --network host \
  -e DATABASE_URL="postgres://fidelity:fidelity@127.0.0.1:5432/fidelity_card" \
  -e JWT_SECRET=smoke-test-secret \
  -e NODE_ENV=production \
  fidelity-backend:dev

curl -fsS http://localhost:3001/api/health   # {"ok":true}
docker logs fidelity-smoke                    # migraciones aplicadas sin error
docker rm -f fidelity-smoke

docker run --rm -d --name fidelity-fe-smoke -p 8080:80 \
  --add-host=host.docker.internal:host-gateway \
  -e API_UPSTREAM=http://host.docker.internal:3001 \
  fidelity-frontend:dev

curl -fsS http://localhost:8080/              # HTML del index
curl -fsS http://localhost:8080/admin         # mismo HTML (SPA fallback)
curl -fsS http://localhost:8080/api/health    # {"ok":true} (proxy al backend)
docker rm -f fidelity-fe-smoke
```

Nota: el smoke test del backend usa `--network host` para alcanzar la base de datos local de `docker-compose.yml` (credenciales `fidelity`/`fidelity`, base `fidelity_card`).
