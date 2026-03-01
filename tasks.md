# Tareas del Proyecto

## [1] Infra DB: Postgres en Docker (dev)
**Estado:** done
**Descripción:** (Refactor Supabase -> BE propio) Crear `docker-compose.yml` para Postgres 16 con volumen persistente y configuracion por variables de entorno. Incluir puertos para dev (idealmente bind a `127.0.0.1`) y dejar un ejemplo de `DATABASE_URL` para el BE en Bun.
**Criterios de aceptacion:** Postgres levanta con `docker compose up -d`, persistencia via volumen, healthcheck OK, `DATABASE_URL` documentada.
**Comentarios:** Completado: agregue `docker-compose.yml` con Postgres 16 + volumen y healthcheck. Actualice `.env.example` con variables de Postgres y `DATABASE_URL`. Smoke test OK con `psql` dentro del contenedor. Archivos: `docker-compose.yml`, `.env.example`, `.gitignore`.

---

## [15] Admin UI: header reutilizable + logout
**Estado:** cancelled
**Descripción:** En la vista de admin, reutilizar la misma barra/header que se usa en la vista de clientas (mismo look & feel) e incluir el boton de logout para cerrar sesion desde admin.
**Criterios de aceptacion:**
- Admin muestra el mismo header que clientas (o un componente compartido) sin duplicar markup.
- El header incluye un boton/link de logout visible en admin.
- Al hacer logout, se limpia sesion y se redirige al login.
**Comentarios:**
Cancelado: no hace falta implementar header compartido en admin por ahora.

---

## [16] Admin UI: ocultar puntos disponibles
**Estado:** done
**Descripción:** En la vista de admin no deben mostrarse puntos disponibles. Los puntos son un feature exclusivo para clientas.
**Criterios de aceptacion:**
- Ninguna pantalla/admin lista o muestra "puntos disponibles" ni widgets de puntos.
- La vista de clienta sigue mostrando puntos normalmente.
**Comentarios:**

Branch: maintenance-16-ocultar-puntos-admin

Completado: se removio del dashboard admin la estadistica de puntos otorgados (y se mantuvo el resto).

Validacion: `bun run build` OK.

---

## [17] Clienta: persistencia de sesion al recargar
**Estado:** done
**Descripción:** En la vista de clienta la sesion no persiste: al recargar la pagina vuelve al login. Ajustar el frontend para que al cargar la app se rehidrate la sesion (usando `GET /api/auth/me` con cookie) y mantenga al usuario autenticado si corresponde.
**Criterios de aceptacion:**
- Si el usuario tiene cookie valida, al recargar permanece logueado y navega a la vista correcta.
- Si la cookie expiro/no existe, se redirige a login de forma consistente.
- No hay flashes largos/loops de redirect (manejo correcto de loading inicial).
**Comentarios:** Branch: bugfix-17-persistencia-sesion-clienta. Completado: protegi rutas clienta/admin con guards que esperan la rehidratacion de `AuthContext` (evita volver a login al recargar si hay cookie valida) y redirige a `/login` cuando no hay sesion. Login/Register ahora vuelven a la ruta original via `location.state.from`. Archivos: `src/components/RequireAuth.tsx`, `src/components/RequireAdmin.tsx`, `src/App.tsx`, `src/pages/Home.tsx`, `src/pages/Login.tsx`, `src/pages/Register.tsx`. Validacion: `bun run build` OK.

---

## [18] Bug: /citas queda cargando
**Estado:** done
**Descripción:** La ruta `/citas` queda cargando y no hace nada. Identificar la causa (request colgada, error no renderizado, loader infinito o route guard) y corregirlo.
**Criterios de aceptacion:**
- `/citas` carga en un estado estable: muestra contenido o un empty state.
- Los errores de red/API se muestran al usuario (o al menos se loguean) y no quedan spinners infinitos.
**Comentarios:** Branch: bugfix-18-citas-queda-cargando. Completado: `MisCitas` ya no queda en loading infinito cuando no hay sesion/perfil o falla la API; redirige a `/login`, muestra error con boton Reintentar, y el cliente HTTP corta requests colgadas con timeout (15s) y error 408. Archivos: `src/pages/MisCitas.tsx`, `src/services/api.ts`. Validacion: smoke manual en dev (ver spinner -> datos/empty state; con API caida muestra error en vez de spinner infinito).

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
**Estado:** done
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
**Comentarios:** Branch: feature-4-auth-api-cookie-jwt. Completado: auth stateless con JWT en cookie httpOnly (signup/signin/signout/me) + helpers `requireAuth`/`requireAdmin`. Agregue `JWT_SECRET` a `.env.example`. Smoke tests manuales con curl: signup->me OK, signin OK, signout limpia cookie (me => 401). Archivos: `apps/api/src/modules/auth.ts`, `apps/api/src/index.ts`, `apps/api/package.json`, `apps/api/bun.lock`, `.env.example`.

---

## [5] API de negocio: servicios
**Estado:** done
**Descripción:** (Refactor FE -> API) Reemplazar el acceso directo a Supabase para `servicios` por endpoints del BE: `GET /api/servicios` (publico) y `POST/PATCH/DELETE /api/servicios/:id` (admin) conectados a Drizzle.
**Contexto:** Hoy `src/services/servicios.ts` hace CRUD en Supabase y las pantallas admin dependen de ese shape.
**Entregables:** handlers Elysia + queries Drizzle + validacion input.
**Criterios de aceptacion:**
- `GET /api/servicios` devuelve lista ordenada por `nombre`.
- Admin puede crear/editar/borrar; no-admin recibe `403`.
- Payloads compat con `Servicio` (`src/types/index.ts`).
**Comentarios:** Branch: feature-5-api-servicios. Completado: agregue endpoints `GET /api/servicios` (publico) y `POST/PATCH/DELETE /api/servicios/:id` (admin) usando Drizzle. `GET` ordena por `nombre`, validacion de body con `t.Object`, 403 para no-admin. Refactor: extraigo callbacks de endpoints a handlers aislados (factory `create*Handlers`) para testearlos sin levantar el server. Archivos: `apps/api/src/modules/servicios.ts`, `apps/api/src/modules/auth-context.ts`, `apps/api/src/modules/auth.ts`, `apps/api/src/utils/iso.ts`, `apps/api/src/index.ts`. Validacion: `npm run typecheck` en `apps/api/` OK. Nota entorno: Bun no esta instalado aqui, por eso use `npm` para typecheck; se genero `apps/api/package-lock.json`.

---

## [6] API de negocio: citas
**Estado:** done
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
**Comentarios:** Completado: cree `apps/api/src/modules/citas.ts` con handlers CRUD + permisos (admin vs clienta). Agregue endpoints `GET /api/citas`, `GET /api/citas/proximas`, `GET /api/citas/pendientes`, `POST /api/citas`, `PATCH /api/citas/:id`, `DELETE /api/citas/:id`. Valide enum `estado` y `notas`. Registre rutas en `apps/api/src/index.ts`. Typecheck pasa (`npm run typecheck` en `apps/api/`). Archivos: `apps/api/src/modules/citas.ts`, `apps/api/src/domain/transformers/citas.ts`, `apps/api/src/domain/types/citas.ts`, `apps/api/src/index.ts`.

---

## [7] API de negocio: profiles
**Estado:** done
**Descripción:** (Refactor Supabase profiles -> API) Implementar `GET /api/profiles?rol=clienta` (admin) y `GET/PATCH /api/profiles/:id` (propio o admin). Mantener forma de datos compatible con `src/types/index.ts`.
**Contexto:** Hoy `src/services/profiles.ts` lista y actualiza perfiles; el admin ve clientas por rol.
**Entregables:** endpoints + permisos + validacion.
**Criterios de aceptacion:**
- Admin puede listar por rol.
- Usuario puede leer/editar su perfil (no puede auto-elevase a admin).
- Shape compat con `Profile`.
**Comentarios:** Branch: feature-7-api-negocio-profiles. Completado: endpoints `/api/profiles` (admin con filtro por rol) y `/api/profiles/:id` (get/patch) con permisos por rol/propietario y validacion. Agregue transformer `toPublicProfile`. Archivos: `apps/api/src/modules/profiles.ts`, `apps/api/src/domain/transformers/profiles.ts`, `apps/api/src/domain/transformers/auth.ts`, `apps/api/src/modules/auth.ts`, `apps/api/src/index.ts`. Tests: ⚠️ sin framework configurado en este repo, no se agregaron tests automatizados.

---

## [8] API de negocio: referidos + puntos
**Estado:** done
**Descripción:** (Refactor FE -> API) Implementar `GET /api/referidos?referente_id=...`, `POST /api/referidos` y endpoints de puntos necesarios (`/api/puntos/top`, `/api/puntos/sumar`, `/api/puntos/restar`) o equivalente integrado para reemplazar los services que hoy usan Supabase.
**Contexto:** Hoy `src/services/referidos.ts` y `src/services/puntos.ts` actualizan `profiles.puntos` directo y guardan `referidos`.
**Alcance MVP:** sin transacciones complejas al inicio, pero evitar inconsistencias obvias (ideal: transaccion al crear referido + sumar puntos).
**Entregables:** endpoints + logica de puntos.
**Criterios de aceptacion:**
- `GET /api/puntos/top` devuelve top clientas (rol=clienta) por puntos.
- `POST /api/referidos` crea referido y suma puntos al referente.
**Comentarios:** Branch: feature-8-api-referidos-puntos. Completado: endpoints `/api/referidos` (listar por referente y crear con suma de puntos transaccional), `/api/puntos/top`, `/api/puntos/sumar`, `/api/puntos/restar` con permisos (admin vs user). Agregue tipos/transformer de referidos y registro de rutas. Tests con Vitest: `npm test` en `apps/api/` OK (smoke + handlers referidos).

---

## [9] Frontend: Vite proxy /api -> API
**Estado:** done
**Descripción:** (Refactor con cookie httpOnly) Configurar `vite.config.ts` para proxyear `/api` a `http://localhost:3001` en dev. Objetivo: evitar CORS y permitir auth por cookie `httpOnly` via mismo origin.
**Entregables:** config proxy en `vite.config.ts`.
**Criterios de aceptacion:** llamadas a `/api/*` desde el FE funcionan en dev sin CORS y con cookies (`credentials: include`).
**Comentarios:** Branch: feature-9-vite-proxy-api. Completado: configure proxy `/api` -> `http://localhost:3001` en Vite dev. Archivos: `vite.config.ts`. Tests: ⚠️ `npm test` no configurado (script inexistente).

---

## [10] Frontend: HTTP client base (fetch)
**Estado:** done
**Descripción:** (Refactor FE -> API) Crear `src/services/api.ts` como wrapper de `fetch` para el nuevo BE, mandando `credentials: 'include'` (cookie httpOnly), manejando JSON y normalizando errores (especialmente 401).
**Entregables:** `api.ts` con helpers `get/post/patch/delete`.
**Criterios de aceptacion:**
- Todas las requests incluyen `credentials: 'include'`.
- Error handling consistente (throw con mensaje util; detectar `401` para flujo de logout).
**Comentarios:** Branch: feature-10-frontend-http-client-base. Completado: agregue wrapper `api.ts` con helpers `get/post/patch/delete`, manejo consistente de JSON, errores tipados (`ApiError`) y helper `isUnauthorized` (401). Archivos: `src/services/api.ts`. Tests: ⚠️ `npm test` no configurado (script inexistente).

---

## [11] Frontend: AuthContext sin Supabase
**Estado:** done
**Descripción:** (Refactor Supabase Auth -> Auth propio) Refactor de `src/contexts/AuthContext.tsx` para usar `/api/auth/*` y `GET /api/auth/me` con cookies `httpOnly`. Eliminar dependencias de `supabase.auth`.
**Entregables:** nuevo AuthContext usando `fetch` + `api.ts`, y tipos alineados con `Profile`.
**Criterios de aceptacion:**
- `signIn/signUp/signOut` llaman a endpoints del BE.
- `refreshProfile` se basa en `/api/auth/me` o `/api/profiles/:id`.
- Ningun import de `@supabase/supabase-js` queda en el contexto.
**Comentarios:** Branch: feature-11-frontend-authcontext-sin-supabase. Completado: AuthContext ahora consume `/api/auth/*` con cookies httpOnly via `src/services/api.ts`, elimina dependencias de Supabase y maneja errores/401. Actualice tipos para user y payload auth. Archivos: `src/contexts/AuthContext.tsx`. Tests: ⚠️ `npm test` no configurado (script inexistente).

---

## [12] Frontend: migrar services (profiles/servicios/citas/referidos/puntos)
**Estado:** done
**Descripción:** (Refactor FE -> API) Reemplazar `src/services/*.ts` para llamar a la nueva API (usando `api.ts`) en lugar de Supabase. Ajustar paginas si cambia algun payload/respuesta.
**Contexto:** Files actuales a migrar: `src/services/profiles.ts`, `src/services/servicios.ts`, `src/services/citas.ts`, `src/services/referidos.ts`, `src/services/puntos.ts`.
**Entregables:** servicios reescritos apuntando al BE; actualizar paginas que dependan de querys especificas (pendientes/proximas/top).
**Criterios de aceptacion:** app funciona en dev sin `VITE_SUPABASE_*` y sin llamadas a Supabase.
**Comentarios:** Branch: feature-12-frontend-migrar-services. Completado: servicios FE ahora usan `api.ts` y endpoints `/api/*` (servicios, citas, profiles, referidos, puntos). Se removieron accesos directos a Supabase en servicios. Tests: ⚠️ `npm test` no configurado (script inexistente).

---

## [13] Limpieza: remover Supabase del frontend
**Estado:** done
**Descripción:** (Refactor final) Eliminar integracion Supabase del frontend: borrar `src/services/supabase.ts` y `src/pages/TestSupabase.tsx` (o reemplazar por test API). Quitar `@supabase/supabase-js` del `package.json` cuando no haya imports.
**Entregables:** remover archivos + remover dependency + limpiar env vars Supabase.
**Criterios de aceptacion:** `bun run build` y `bun run lint` pasan sin Supabase.
**Comentarios:** Branch: maintenance-13-limpieza-supabase-frontend. Completado: eliminados `src/services/supabase.ts` y `src/pages/TestSupabase.tsx`, removida ruta `/test` y dependencia `@supabase/supabase-js`, y limpiadas vars Supabase de `.env.example`. Tests: ⚠️ `npm test` no configurado (script inexistente).

---

## [19] Bug: Editar clienta no funciona
**Estado:** done
**Descripción:** Al presionar el botón de editar en la lista de clientas (Admin), la aplicación no realiza ninguna acción. Identificar si es un problema de eventos, rutas o del modal.
**Criterios de aceptacion:**
- Al hacer clic en editar, se abre el formulario/modal con los datos de la clienta.
- Se pueden guardar cambios y estos se reflejan en la base de datos y la UI.
**Comentarios:** Branch: bugfix-19-editar-clienta-no-funciona. Completado: implementado modo edición en el modal de detalle de clienta en Admin. Se agregaron estados para manejo de formulario, lógica de guardado llamando a `profilesService.update` y actualización de la lista local. Archivo: `src/pages/admin/Clientas.tsx`.

---

## [20] Feature: Canjes Parte 1 (Premios ABM)
**Estado:** done
**Descripción:** Implementar un sistema de premios que los clientes puedan canjear por puntos.
- Admin: CRUD completo de premios (nombre, descripción, costo en puntos).
- Cliente: Visualización de premios disponibles y su costo.
**Criterios de aceptacion:**
- Nueva tabla `premios` en la base de datos.
- Endpoints `/api/premios` (CRUD para admin, GET para clientes).
- Vista de administración de premios y sección de premios para el cliente.
**Comentarios:** Branch: feature-20-canjes-premios-abm
Completado: se implemento el CRUD de premios en el backend y frontend, incluyendo seeds y tests unitarios.
- Backend: endpoints `/api/premios` con Drizzle y validacion. Tests unitarios en `premios.handlers.test.ts`.
- Frontend: service `premiosService`, pagina de administracion `AdminPremios` y vista de clientas `Premios` (Canjes).
- Seeds: script `scripts/seed-premios.mjs` y actualizacion de `seed:all`.
- Navegacion: agregados links a Premios/Canjes en la Navbar para ambos roles.
- Validacion: `bun run build` OK, `npm test` (en api) OK.

---

## [21] Feature: Canjes Parte 2 (Descuentos en Servicios)
**Estado:** pending
**Descripción:** Permitir el uso de puntos para pagar o descontar el precio de los servicios al crear una cita.
- Cada servicio puede tener un precio en puntos.
- Al agendar, el cliente puede elegir aplicar puntos para reducir el costo monetario.
**Criterios de aceptacion:**
- Los puntos se descuentan del perfil del usuario al confirmar la cita.
- El precio de la cita se ajusta según la estrategia de puntos definida.

---

## [22] Feature: Precios en Euros (€)
**Estado:** pending
**Descripción:** Cambiar la moneda de toda la aplicación de pesos/dólares a Euros.
**Criterios de aceptacion:**
- Todos los precios en el frontend y el panel de admin muestran el símbolo `€`.
- Formateo de moneda consistente con estándares europeos.

---

## [23] Refactor: Internacionalización Técnica (Inglés)
**Estado:** pending
**Descripción:** Refactorizar el código, la documentación y el esquema de la base de datos al inglés. El contenido visible para el usuario (UI) permanecerá en español.
- Base de datos: `citas` -> `appointments`, `servicios` -> `services`, etc.
- Código: Variables, funciones y comentarios en inglés.
- Documentación: Todos los archivos `.md` (excepto contenido de sitio) en inglés.
**Criterios de aceptacion:**
- La aplicación funciona correctamente tras el renombrado masivo.
- El código sigue una convención de nomenclatura 100% en inglés.
