# Guía de deployment

Este repositorio se deploya como **dos servicios Docker más una base de datos PostgreSQL**, con un patrón **single-origin**: el frontend (nginx) sirve el build de Vite y proxéa `/api/` al backend. No hay CORS ni URLs absolutas: el navegador solo conoce un dominio.

La plataforma de producción es **Fly.io**: dos apps (`fidelity-card-backend` y `fidelity-card-frontend`) más un **Postgres managed** (`fidelity-card-db`), todo en la región `cdg`. El patrón single-origin se conserva: solo el frontend recibe tráfico público y el backend queda en la red interna.

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
| `ALLOWED_HOST` | Sí (sin default) | Host único para el que nginx sirve la SPA; cualquier otro Host recibe `421`. En Fly va como **secret** (ver §3), en staging/local se define explícito (`localhost`) |
| `PORT` | No (default 80) | Puerto donde escucha nginx. Útil en plataformas que inyectan su propio `PORT` |

El template `frontend/nginx.default.conf.template` se procesa con `envsubst` al arrancar la imagen oficial de nginx.

## Fly.io (ruta principal)

### Requisitos previos

- flyctl instalado y sesión iniciada:

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### 1. Postgres managed

Crear la base gestionada (región `cdg`, un solo nodo para mantener el costo):

```bash
fly postgres create --name fidelity-card-db --region cdg --initial-cluster-size 1 --vm-size shared-cpu-1x
```

### 2. Crear las apps

```bash
fly apps create fidelity-card-backend
fly apps create fidelity-card-frontend
```

Ambas apps deben pertenecer a la **misma org**: el DNS interno `.internal` de Fly solo resuelve dentro de ella.

### 3. Conectar la base y los secrets

```bash
fly postgres attach fidelity-card-db --app fidelity-card-backend
fly secrets set -a fidelity-card-backend JWT_SECRET="$(openssl rand -base64 32)"
fly secrets set -a fidelity-card-frontend ALLOWED_HOST=<tu-dominio>
```

- `fly postgres attach` configura `DATABASE_URL` como secret del backend.
- `ALLOWED_HOST` del frontend va como **secret** porque el repo es público: el dominio real nunca debe aterrizar en un archivo versionado. El nginx solo sirve ese Host y responde `421` a cualquier otro (ver §6).
- `API_UPSTREAM` del frontend **no es secret**: vive en `fly.frontend.toml` (`[env]`).

### 4. Deploy (desde la raíz del repo, siempre)

```bash
fly deploy -c fly.backend.toml
fly deploy -c fly.frontend.toml
```

- Las migraciones de Drizzle corren al boot del contenedor backend; el healthcheck (`/api/health`) tiene 60 s de gracia para cubrirlas.
- **Advertencia**: los Dockerfiles requieren el contexto de build en la raíz del repo; los comandos con `-c` deben ejecutarse desde la raíz.

### 5. Smoke test

```bash
fly status -a fidelity-card-frontend   # machine healthy = check de /api/health en verde
fly logs -a fidelity-card-frontend     # sin errores de nginx ni de envsubst
```

El hostname de la app en Fly solo responde en `/api/health`; todo lo demás da `421` por diseño (ver §6). El smoke test completo de la SPA (login, rutas) se hace sobre el dominio propio una vez configurado, o en local (ver "Local (build y smoke test)").

### 6. Dominio propio (Cloudflare)

El frontend corre detrás del proxy de Cloudflare (nube naranja). El nginx solo sirve el Host de `ALLOWED_HOST`; el hostname de Fly queda limitado al healthcheck (`/api/health`) y todo lo demás responde `421`, así nadie bypasea Cloudflare pegando directo a Fly.

1. Agregar el certificado:

```bash
fly certs add <tu-dominio> -a fidelity-card-frontend
```

2. Verificar la propiedad del dominio:

```bash
fly certs setup <tu-dominio>
```

   Muestra un registro TXT `_fly-ownership`; crearlo en Cloudflare tal cual lo imprime. Es requerido para emitir el certificado a través del proxy de Cloudflare.

3. Apuntar el tráfico: crear los registros **A y AAAA** de la app en Cloudflare (los muestra `fly certs add`) con el **proxy naranja activado**.

4. SSL/TLS en modo **Full (strict)**. Flexible genera redirect loops (Fly ya termina TLS con su cert y el nginx espera un solo origen público).

5. Activar **Always Use HTTPS**.

6. Verificar la emisión:

```bash
fly certs check <tu-dominio>
```

7. Reglas de cache en Cloudflare:
   - `/api/*` → **Bypass cache** (respuestas dinámicas).
   - `/assets/*` → **Eligible for cache** (respeta los headers del origen; el nginx ya manda `immutable, max-age=31536000`).
   - El HTML no se cachea por defecto.

   Nota clave: **no hace falta purgar cache en deploys**. Vite hashea los nombres de los assets y el HTML viaja con `Cache-Control: no-cache`; la invalidación es el cambio de nombre — el nuevo HTML referencia assets nuevos y los viejos expiran solos.

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
  -e ALLOWED_HOST=localhost \
  fidelity-frontend:dev

curl -fsS http://localhost:8080/              # HTML del index
curl -fsS http://localhost:8080/admin         # mismo HTML (SPA fallback)
curl -fsS http://localhost:8080/api/health    # {"ok":true} (proxy al backend)
docker rm -f fidelity-fe-smoke
```

Nota: el smoke test del backend usa `--network host` para alcanzar la base de datos local de `docker-compose.yml` (credenciales `fidelity`/`fidelity`, base `fidelity_card`).
