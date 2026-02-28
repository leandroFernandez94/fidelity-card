import { t } from 'elysia';
import { asc, eq } from 'drizzle-orm';

import { db as defaultDb } from '../db';
import { servicios } from '../db/schema';
import { toPublicServicio } from '../domain/transformers/servicios';
import type { StatusHelper } from '../domain/types/http';

import { requireAdmin } from './auth-context';
import type { AuthJwtPayload } from './auth-context';

type ServicioCreateBody = {
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_min: number;
  puntos_otorgados: number;
};

type ServicioPatchBody = Partial<ServicioCreateBody>;

type ServicioIdParams = {
  id: string;
};

export type ServiciosDeps = {
  db: typeof defaultDb;
};

export type ServiciosListCtx = {};

export type ServicioCreateCtx = {
  auth: unknown;
  status: StatusHelper;
  body: ServicioCreateBody;
  set: { status: number };
};

export type ServicioPatchCtx = {
  auth: unknown;
  status: StatusHelper;
  params: ServicioIdParams;
  body: ServicioPatchBody;
  set: { status: number };
};

export type ServicioDeleteCtx = {
  auth: unknown;
  status: StatusHelper;
  params: ServicioIdParams;
  set: { status: number };
};

export function createServiciosHandlers(deps: ServiciosDeps) {
  return {
    list: async (_ctx: ServiciosListCtx) => {
      const rows = await deps.db.select().from(servicios).orderBy(asc(servicios.nombre));
      return rows.map(toPublicServicio);
    },
    create: async ({ auth, status, body, set }: ServicioCreateCtx) => {
      const denied = requireAdmin({ auth: ((auth as unknown) ?? null) as AuthJwtPayload | null, status });
      if (denied) return denied;

      const inserted = await deps.db
        .insert(servicios)
        .values({
          nombre: body.nombre.trim(),
          descripcion: body.descripcion.trim(),
          precio: body.precio,
          duracion_min: body.duracion_min,
          puntos_otorgados: body.puntos_otorgados,
        })
        .returning();

      const row = inserted[0];
      if (!row) {
        set.status = 500;
        return { error: 'internal_server_error' };
      }

      set.status = 201;
      return toPublicServicio(row);
    },
    patch: async ({ auth, status, params, body, set }: ServicioPatchCtx) => {
      const denied = requireAdmin({ auth: ((auth as unknown) ?? null) as AuthJwtPayload | null, status });
      if (denied) return denied;

      const updates: ServicioPatchBody = {};

      if (typeof body.nombre === 'string') updates.nombre = body.nombre.trim();
      if (typeof body.descripcion === 'string') updates.descripcion = body.descripcion.trim();
      if (typeof body.precio === 'number') updates.precio = body.precio;
      if (typeof body.duracion_min === 'number') updates.duracion_min = body.duracion_min;
      if (typeof body.puntos_otorgados === 'number') updates.puntos_otorgados = body.puntos_otorgados;

      if (Object.keys(updates).length === 0) {
        set.status = 400;
        return { error: 'no_updates' };
      }

      const updated = await deps.db.update(servicios).set(updates).where(eq(servicios.id, params.id)).returning();
      const row = updated[0];
      if (!row) {
        set.status = 404;
        return { error: 'not_found' };
      }

      return toPublicServicio(row);
    },
    remove: async ({ auth, status, params, set }: ServicioDeleteCtx) => {
      const denied = requireAdmin({ auth: ((auth as unknown) ?? null) as AuthJwtPayload | null, status });
      if (denied) return denied;

      const deleted = await deps.db.delete(servicios).where(eq(servicios.id, params.id)).returning({ id: servicios.id });
      const row = deleted[0];
      if (!row) {
        set.status = 404;
        return { error: 'not_found' };
      }

      return { ok: true };
    },
  };
}

export function registerServiciosRoutes<App extends { get: unknown }>(app: App): App {
  const handlers = createServiciosHandlers({ db: defaultDb });

  return (app as any)
    .get('/api/servicios', handlers.list)
    .post(
      '/api/servicios',
      handlers.create,
      {
        body: t.Object({
          nombre: t.String({ minLength: 1 }),
          descripcion: t.String(),
          precio: t.Integer({ minimum: 0 }),
          duracion_min: t.Integer({ minimum: 1 }),
          puntos_otorgados: t.Integer({ minimum: 0 }),
        }),
      }
    )
    .patch(
      '/api/servicios/:id',
      handlers.patch,
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
        }),
        body: t.Object(
          {
            nombre: t.Optional(t.String({ minLength: 1 })),
            descripcion: t.Optional(t.String()),
            precio: t.Optional(t.Integer({ minimum: 0 })),
            duracion_min: t.Optional(t.Integer({ minimum: 1 })),
            puntos_otorgados: t.Optional(t.Integer({ minimum: 0 })),
          },
          { minProperties: 1 }
        ),
      }
    )
    .delete(
      '/api/servicios/:id',
      handlers.remove,
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
        }),
      }
    );
}
