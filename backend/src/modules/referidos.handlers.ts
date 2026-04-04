import { asc, desc, eq, sql } from 'drizzle-orm';

import { profiles, referidos } from '../db/schema';
import { toPublicProfile } from '../domain/transformers/profiles';
import { toPublicReferido } from '../domain/transformers/referidos';
import type { StatusHelper } from '../domain/types/http';

import { guardAuth, guardAdmin } from './auth-helpers';

type ReferidosQuery = {
  referente_id?: string;
};

type ReferidoIdParams = {
  id: string;
};

type ReferidoGetCtx = {
  auth?: unknown;
  status: StatusHelper;
  params: ReferidoIdParams;
  set: { status?: number | string };
};

type ReferidosCreateBody = {
  referente_id: string;
  referida_id: string;
  puntos_ganados: number;
};

export type ReferidosDeps = {
  db: typeof import('../db').db;
};

export type ReferidosListCtx = {
  auth?: unknown;
  status: StatusHelper;
  query: ReferidosQuery;
};

export type ReferidosCreateCtx = {
  auth?: unknown;
  status: StatusHelper;
  body: ReferidosCreateBody;
  set: { status?: number | string };
};

export type PuntosTopQuery = {
  limit?: number;
};

export type PuntosTopCtx = {
  auth?: unknown;
  status: StatusHelper;
  query: PuntosTopQuery;
};

export type PuntosAdjustBody = {
  profile_id: string;
  cantidad: number;
};

export type PuntosAdjustCtx = {
  auth?: unknown;
  status: StatusHelper;
  body: PuntosAdjustBody;
  set: { status?: number | string };
};

export function createReferidosHandlers(deps: ReferidosDeps) {
  return {
    list: async (ctx: unknown) => {
      const { auth, status, query } = ctx as ReferidosListCtx;
      const result = guardAuth({ auth, status });
      if (!result.ok) return result.response;

      const referenteId = query.referente_id;
      if (!referenteId) {
        if (result.jwt.rol !== 'admin') {
          return status(403, { error: 'forbidden' });
        }
        const rows = await deps.db.select().from(referidos).orderBy(desc(referidos.fecha));
        return rows.map(toPublicReferido);
      }

      if (result.jwt.rol !== 'admin' && result.jwt.sub !== referenteId) {
        return status(403, { error: 'forbidden' });
      }

      const rows = await deps.db
        .select()
        .from(referidos)
        .where(eq(referidos.referente_id, referenteId))
        .orderBy(desc(referidos.fecha));
      return rows.map(toPublicReferido);
    },
    getReferido: async (ctx: unknown) => {
      const { auth, status, params, set } = ctx as ReferidoGetCtx;
      const result = guardAuth({ auth, status });
      if (!result.ok) return result.response;

      const rows = await deps.db.select().from(referidos).where(eq(referidos.id, params.id)).limit(1);
      const row = rows[0];
      if (!row) {
        set.status = 404;
        return { error: 'not_found' };
      }

      if (result.jwt.rol !== 'admin' && result.jwt.sub !== row.referente_id) {
        set.status = 403;
        return { error: 'forbidden' };
      }

      return toPublicReferido(row);
    },
    create: async (ctx: unknown) => {
      const { auth, status, body, set } = ctx as ReferidosCreateCtx;
      const result = guardAdmin({ auth, status });
      if (!result.ok) return result.response;

      const puntos = Math.max(0, body.puntos_ganados);

      const created = await deps.db.transaction(async (tx) => {
        const profilesRows = await tx
          .select({ id: profiles.id, puntos: profiles.puntos })
          .from(profiles)
          .where(eq(profiles.id, body.referente_id))
          .limit(1);

        const referente = profilesRows[0];
        if (!referente) {
          set.status = 404;
          return { error: 'referente_not_found' } as const;
        }

        const referidasRows = await tx
          .select({ id: profiles.id })
          .from(profiles)
          .where(eq(profiles.id, body.referida_id))
          .limit(1);

        const referida = referidasRows[0];
        if (!referida) {
          set.status = 404;
          return { error: 'referida_not_found' } as const;
        }

        const updatedProfiles = await tx
          .update(profiles)
          .set({ puntos: sql<number>`${profiles.puntos} + ${puntos}` })
          .where(eq(profiles.id, body.referente_id))
          .returning();

        const inserted = await tx
          .insert(referidos)
          .values({
            referente_id: body.referente_id,
            referida_id: body.referida_id,
            puntos_ganados: puntos,
          })
          .returning();

        return { referente: updatedProfiles[0], referido: inserted[0] } as const;
      });

      if ('error' in created) {
        return created;
      }

      const referidoRow = created.referido;
      if (!referidoRow) {
        set.status = 500;
        return { error: 'internal_server_error' };
      }

      set.status = 201;
      return toPublicReferido(referidoRow);
    },
    puntosTop: async (ctx: unknown) => {
      const { auth, status, query } = ctx as PuntosTopCtx;
      const result = guardAuth({ auth, status });
      if (!result.ok) return result.response;

      const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);

      const rows = await deps.db
        .select()
        .from(profiles)
        .where(eq(profiles.rol, 'clienta'))
        .orderBy(desc(profiles.puntos), asc(profiles.created_at))
        .limit(limit);

      return rows.map(toPublicProfile);
    },
    sumarPuntos: async (ctx: unknown) => {
      const { auth, status, body, set } = ctx as PuntosAdjustCtx;
      const result = guardAdmin({ auth, status });
      if (!result.ok) return result.response;

      const cantidad = Math.max(0, body.cantidad);
      const updated = await deps.db
        .update(profiles)
        .set({
          puntos: sql<number>`${profiles.puntos} + ${cantidad}`,
        })
        .where(eq(profiles.id, body.profile_id))
        .returning();

      const row = updated[0];
      if (!row) {
        set.status = 404;
        return { error: 'not_found' };
      }

      return toPublicProfile(row);
    },
    restarPuntos: async (ctx: unknown) => {
      const { auth, status, body, set } = ctx as PuntosAdjustCtx;
      const result2 = guardAdmin({ auth, status });
      if (!result2.ok) return result2.response;

      const found = await deps.db.select().from(profiles).where(eq(profiles.id, body.profile_id)).limit(1);
      const profile = found[0];
      if (!profile) {
        set.status = 404;
        return { error: 'not_found' };
      }

      const cantidad = Math.max(0, body.cantidad);
      const nuevosPuntos = Math.max(0, profile.puntos - cantidad);
      const updated = await deps.db
        .update(profiles)
        .set({ puntos: nuevosPuntos })
        .where(eq(profiles.id, body.profile_id))
        .returning();

      const row = updated[0];
      if (!row) {
        set.status = 404;
        return { error: 'not_found' };
      }

      return toPublicProfile(row);
    },
  };
}
