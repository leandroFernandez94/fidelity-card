import { asc, eq } from 'drizzle-orm';

import { db as defaultDb } from '../db';
import { servicios } from '../db/schema';
import { toPublicServicio } from '../domain/transformers/servicios';
import type { StatusHelper } from '../domain/types/http';

import { requireAdmin } from './auth-context';
import type { AuthJwtPayload } from './auth-context';

export type ServicioCreateBody = {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  duracion_min: number;
  puntos_otorgados: number;
  puntos_requeridos?: number | null;
};

export type ServicioPatchBody = Partial<ServicioCreateBody>;

type ServicioIdParams = {
  id: string;
};

export type ServiciosDeps = {
  db: typeof defaultDb;
};

export type ServiciosListCtx = Record<string, never>;

export type ServicioCreateCtx = {
  auth?: unknown;
  status: StatusHelper;
  body: ServicioCreateBody;
  set: { status?: number | string };
};

export type ServicioPatchCtx = {
  auth?: unknown;
  status: StatusHelper;
  params: ServicioIdParams;
  body: ServicioPatchBody;
  set: { status?: number | string };
};

export type ServicioDeleteCtx = {
  auth?: unknown;
  status: StatusHelper;
  params: ServicioIdParams;
  set: { status?: number | string };
};

/** Handlers HTTP para CRUD de servicios. */
export function createServiciosHttpHandlers(deps: ServiciosDeps) {
  return {
    listServicios: async () => {
      const rows = await deps.db.select().from(servicios).orderBy(asc(servicios.nombre));
      return rows.map(toPublicServicio);
    },

    createServicio: async (ctx: unknown) => {
      const { auth, status, body, set } = ctx as ServicioCreateCtx;
      const denied = requireAdmin({ auth: ((auth as unknown) ?? null) as AuthJwtPayload | null, status });
      if (denied) return denied;

      const inserted = await deps.db
        .insert(servicios)
        .values({
          nombre: body.nombre.trim(),
          descripcion: (body.descripcion || '').trim(),
          precio: body.precio,
          duracion_min: body.duracion_min,
          puntos_otorgados: body.puntos_otorgados,
          puntos_requeridos: body.puntos_requeridos,
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

    patchServicio: async (ctx: unknown) => {
      const { auth, status, params, body, set } = ctx as ServicioPatchCtx;
      const denied = requireAdmin({ auth: ((auth as unknown) ?? null) as AuthJwtPayload | null, status });
      if (denied) return denied;

      const updates: ServicioPatchBody = {};

      if (typeof body.nombre === 'string') updates.nombre = body.nombre.trim();
      if (typeof body.descripcion === 'string') updates.descripcion = body.descripcion.trim();
      if (typeof body.precio === 'number') updates.precio = body.precio;
      if (typeof body.duracion_min === 'number') updates.duracion_min = body.duracion_min;
      if (typeof body.puntos_otorgados === 'number') updates.puntos_otorgados = body.puntos_otorgados;
      if (typeof body.puntos_requeridos === 'number' || body.puntos_requeridos === null) updates.puntos_requeridos = body.puntos_requeridos;

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

    deleteServicio: async (ctx: unknown) => {
      const { auth, status, params, set } = ctx as ServicioDeleteCtx;
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

export type ServiciosHttpHandlers = ReturnType<typeof createServiciosHttpHandlers>;

// Back-compat alias.
export const createServiciosHandlers = createServiciosHttpHandlers;
