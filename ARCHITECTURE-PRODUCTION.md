# Arquitectura de Producción — fidelity-card

Producción corre en **Fly.io** (región `cdg`, París) detrás de **Cloudflare** (edge en Madrid). Este documento describe la topología completa, la estrategia de dominio/DNS, el caching por capas y las defensas del borde. Para los pasos operativos, ver `DEPLOY.md`; para la arquitectura de la aplicación, ver `ARCHITECTURE.md`.

> ⚠️ El repo es público: acá se documentan patrones con placeholders (`<tu-dominio>`). El dominio real, credenciales y URLs viven solo en secrets de Fly y en el dashboard de Cloudflare.

## Vista general

```
Usuaria (España)
   │  HTTPS
   ▼
Cloudflare edge — Madrid ──────────── anti-DDoS, cache de assets, TLS al borde
   │  proxy naranja · Full (strict) · Always Use HTTPS
   ▼
Fly.io edge (anycast global) ──────── termina TLS, enruta
   │  backbone privado (WireGuard)
   ▼
fidelity-card-frontend ── 2 machines shared-cpu-1x/256MB (cdg)
   │  nginx: sirve la SPA + proxéa /api/ (single-origin)
   │  DNS interno 6PN → http://fidelity-card-backend.internal:3001
   ▼
fidelity-card-backend ── 2 machines shared-cpu-1x/256MB (cdg)
   │  Elysia · migraciones Drizzle al boot
   │  flycast interno
   ▼
fidelity-card-db ── Postgres unmanaged: 1 nodo + volumen 10GB (cdg)
```

Por qué `cdg` y no otra: Fly.io no tiene región en España (`mad` no existe). `cdg` es la región europea más cercana a España; el Postgres vive en la misma región para que el tráfico app↔DB sea gratis y de sub-milisegundo. Cambiar de región implica mover la DB y facturar tráfico cross-region.

## Dominio y DNS

| Registro / setting | Valor | Nota |
| --- | --- | --- |
| `A` + `AAAA` | IPs públicas del app frontend | **Proxied** (naranja) — sin esto no hay CDN ni anti-DDoS |
| `TXT` `_fly-ownership` | token que muestra `fly certs setup` | Permite emitir el cert Let's Encrypt a través del proxy |
| SSL/TLS mode | **Full (strict)** | `Flexible` produce redirect loops |
| Always Use HTTPS | ON | |
| Cache rule `/api/*` | **Bypass cache** | Las sesiones viajan por cookies; nunca cacheables |

El certificado lo emite y renueva Fly (Let's Encrypt); Cloudflare termina TLS en el edge y habla con Fly encriptado.

## Topología en Fly.io

| Recurso | Config | Rol |
| --- | --- | --- |
| `fidelity-card-frontend` | 2× shared-cpu-1x 256MB | nginx: SPA + reverse proxy de `/api/`. 2 machines = zero-downtime en deploys |
| `fidelity-card-backend` | 2× shared-cpu-1x 256MB | Elysia API. Healthcheck `GET /api/health` con 60s de gracia (las migraciones corren antes de servir) |
| `fidelity-card-db` | 1 nodo + volumen 10GB | Postgres unmanaged (sin soporte de Fly; backups a cargo del operador) |

**Secrets** (jamás en el repo): `DATABASE_URL` (la crea `fly postgres attach`), `JWT_SECRET` (openssl), `ALLOWED_HOST` (dominio del frontend — el nginx solo sirve ese Host).

**Patrón single-origin**: solo el frontend recibe tráfico público; la SPA y la API comparten origen, lo que preserva las cookies same-origin (`credentials: 'include'`) sin configuración CORS. El backend es alcanzable por DNS interno (`.internal`) y su hostname público solo expone el healthcheck.

## Estrategia de caching y headers

Tres capas, cada una con su contrato:

| Ruta | Header que envía nginx | Cloudflare edge | Navegador | Cómo se invalida |
| --- | --- | --- | --- | --- |
| `/assets/*` | `Cache-Control: public, max-age=31536000, immutable` | Cachea (MISS→HIT) | 1 año | **No hace falta**: Vite hashea el nombre por build (`index-AbC123.js`) |
| `/` y rutas SPA | `Cache-Control: no-cache` (sobre index.html) | No cachea (DYNAMIC) | Revalida siempre | Inmediato |
| `/api/*` | — | **Bypass** (regla explícita) | No almacenar | n/a |

**La regla de oro**: la invalidación ES el cambio de nombre. Cada deploy genera archivos con hashes nuevos; el `index.html` (único archivo que cambia de contenido manteniendo el nombre) va con `no-cache`, así que la usuaria ve la versión nueva en el primer refresh — **sin purgar cache nunca**. El purge de Cloudflare queda solo como botón de emergencia.

Los assets viejos siguen cacheados sin molestar: son inmutables y huérfanos (nadie los referencia) hasta expirar.

## Defensas del borde

El nginx del frontend implementa un **host-guard** de tres bloques:

| Bloque | `server_name` | Comportamiento |
| --- | --- | --- |
| Principal | `ALLOWED_HOST` (secret) | Sirve la app completa |
| Plataforma | `fidelity-card-frontend.fly.dev` | Solo `GET /api/health`; todo lo demás `421` |
| Default | cualquier otro Host | Solo `GET /api/health`; todo lo demás `421` |

Por qué la excepción de `/api/health`: el healthcheck interno de Fly llega con un Host propio (no el hostname de la app); sin la excepción en el bloque default, las machines se marcan unhealthy y los deploys fallan. El endpoint es un JSON inofensivo de 15 bytes.

**Modelo de costos bajo ataque** (verificado contra el pricing de Fly):

- Compute: se factura por tiempo encendida, no por carga → un flood no mueve el costo de las machines
- Tráfico entrante: gratis
- **Único vector: egress saliente (~US$0.02/GB)** — y contra eso está Cloudflare absorbiendo floods + cacheando assets, y el 421 cortando el bypass directo al hostname de Fly
- Lector de realidad: los certificados se publican en logs públicos de CT al emitirse; los scanners encuentran el dominio en menos de una hora. Es tráfico normal, no un ataque dirigido

## Checklist de verificación

- [ ] `curl -I https://<tu-dominio>/` → `200` + `cache-control: no-cache` + `cf-cache-status: DYNAMIC`
- [ ] `curl -I https://<tu-dominio>/assets/<hash>.js` dos veces → `MISS` y luego `HIT`, con `immutable`
- [ ] `curl https://<tu-dominio>/api/health` → `{"ok":true}`
- [ ] `curl` directo al hostname público del app (`<app>.fly.dev`, bypaseando Cloudflare) → `421` (idem `/assets/*`)
- [ ] `fly status` en ambas apps → checks passing

## Siguiente paso

- Pasos operativos de deploy y smoke test: `DEPLOY.md`
- Arquitectura de la aplicación (capas, flujos, API): `ARCHITECTURE.md`
