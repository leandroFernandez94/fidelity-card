import { asc, eq } from 'drizzle-orm';

import { db as defaultDb } from '../db';
import { premios } from '../db/schema';
import type { StatusHelper } from '../domain/types/http';

import { requireAdmin } from './auth-context';
import type { AuthJwtPayload } from './auth-context';

export type PremioCreateBody = {
  nombre: string;
  descripcion: string;
  puntos_requeridos: number;
  activo?: boolean;
};

export type PremioPatchBody = Partial<PremioCreateBody>;

type PremioIdParams = {
  id: string;
};

export type PremiosDeps = {
  db: typeof defaultDb;
};

export type PremioCreateCtx = {
  auth?: unknown;
  status: StatusHelper;
  body: PremioCreateBody;
  set: { status?: number | string };
};

export type PremioPatchCtx = {
  auth?: unknown;
  status: StatusHelper;
  params: PremioIdParams;
  body: PremioPatchBody;
  set: { status?: number | string };
};

export type PremioDeleteCtx = {
  auth?: unknown;
  status: StatusHelper;
  params: PremioIdParams;
  set: { status?: number | string };
};

/** Handlers HTTP para CRUD de premios. */
export function createPremiosHttpHandlers(deps: PremiosDeps) {
  return {
    listPremios: async () => {
      // Listamos todos por ahora (el FE puede filtrar por activo si desea)
      return await deps.db.select().from(premios).orderBy(asc(premios.nombre));
    },

    createPremio: async (ctx: unknown) => {
      const { auth, status, body, set } = ctx as PremioCreateCtx;
      const denied = requireAdmin({ auth: ((auth as unknown) ?? null) as AuthJwtPayload | null, status });
      if (denied) return denied;

      const inserted = await deps.db
        .insert(premios)
        .values({
          nombre: body.nombre.trim(),
          descripcion: body.descripcion.trim(),
          puntos_requeridos: body.puntos_requeridos,
          activo: body.activo ?? true,
        })
        .returning();

      const row = inserted[0];
      if (!row) {
        set.status = 500;
        return { error: 'internal_server_error' };
      }

      set.status = 201;
      return row;
    },

    patchPremio: async (ctx: unknown) => {
      const { auth, status, params, body, set } = ctx as PremioPatchCtx;
      const denied = requireAdmin({ auth: ((auth as unknown) ?? null) as AuthJwtPayload | null, status });
      if (denied) return denied;

      const updates: Partial<typeof premios.$inferSelect> = {};

      if (typeof body.nombre === 'string') updates.nombre = body.nombre.trim();
      if (typeof body.descripcion === 'string') updates.descripcion = body.descripcion.trim();
      if (typeof body.puntos_requeridos === 'number') updates.puntos_requeridos = body.puntos_requeridos;
      if (typeof body.activo === 'boolean') updates.activo = body.activo;

      if (Object.keys(updates).length === 0) {
        set.status = 400;
        return { error: 'no_updates' };
      }

      const updated = await deps.db.update(premios).set(updates).where(eq(premios.id, params.id)).returning();
      const row = updated[0];
      if (!row) {
        set.status = 404;
        return { error: 'not_found' };
      }

      return row;
    },

    deletePremio: async (ctx: unknown) => {
      const { auth, status, params, set } = ctx as PremioDeleteCtx;
      const denied = requireAdmin({ auth: ((auth as unknown) ?? null) as AuthJwtPayload | null, status });
      if (denied) return denied;

      const deleted = await deps.db.delete(premios).where(eq(premios.id, params.id)).returning({ id: premios.id });
      const row = deleted[0];
      if (!row) {
        set.status = 404;
        return { error: 'not_found' };
      }

      return { ok: true };
    },
  };
}

export type PremiosHttpHandlers = ReturnType<typeof createPremiosHttpHandlers>;
