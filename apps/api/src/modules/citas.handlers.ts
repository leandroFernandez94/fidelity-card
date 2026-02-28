import type { AnyElysia } from 'elysia';
import { and, asc, eq, gte, inArray, sql } from 'drizzle-orm';

import { db as defaultDb } from '../db';
import { citas, profiles } from '../db/schema';
import { decideCitaPatch } from '../domain/logic/citas';
import { patchCitaAtomic, type CitasPatchAtomicTx } from '../domain/logic/citas.patch-atomic';
import { toPublicCita } from '../domain/transformers/citas';
import type { CitaEstado } from '../domain/types/citas';
import type { StatusHelper } from '../domain/types/http';

import { requireAuth, requireAdmin } from './auth-context';
import type { AuthJwtPayload } from './auth-context';

export type CitaCreateBody = {
  clienta_id: string;
  servicio_ids: string[];
  fecha_hora: string;
  puntos_ganados: number;
  notas?: string;
};

export type CitaPatchBody = {
  estado?: CitaEstado;
  notas?: string;
};

export type CitaIdParams = {
  id: string;
};

export type CitasListQuery = {
  clienta_id?: string;
};

export type CitasDeps = {
  db: typeof defaultDb;
};

export type CitasListCtx = {
  auth?: unknown;
  query: CitasListQuery;
};

export type CitaCreateCtx = {
  auth?: unknown;
  status: StatusHelper;
  body: CitaCreateBody;
  set: { status?: number | string };
};

export type CitaPatchCtx = {
  auth?: unknown;
  status: StatusHelper;
  params: CitaIdParams;
  body: CitaPatchBody;
  set: { status?: number | string };
};

export type CitaDeleteCtx = {
  auth?: unknown;
  status: StatusHelper;
  params: CitaIdParams;
  set: { status?: number | string };
};

const validEstados = ['pendiente', 'confirmada', 'completada', 'cancelada'] as const;

/**
 * Crea handlers HTTP para el recurso `citas`.
 *
 * Nota: mantenemos el flujo de negocio (transiciones + puntos) en funciones puras
 * (`decideCitaPatch` y `patchCitaAtomic`) para que los tests no dependan de Drizzle.
 */
export function createCitasHttpHandlers(deps: CitasDeps) {
  return {
    /** Lista citas. Admin puede listar todas o por clienta; clienta solo sus citas. */
    listCitas: async (ctx: unknown) => {
      const { auth, query } = ctx as CitasListCtx;
      const jwt = ((auth as unknown) ?? null) as AuthJwtPayload | null;
      const denied = requireAuth({ auth: jwt, status: () => {} });
      if (denied) return [];

      if (jwt?.rol === 'admin') {
        if (query.clienta_id && query.clienta_id !== 'me') {
          const rows = await deps.db
            .select()
            .from(citas)
            .where(eq(citas.clienta_id, query.clienta_id))
            .orderBy(asc(citas.fecha_hora));
          return rows.map(toPublicCita);
        }
        const rows = await deps.db.select().from(citas).orderBy(asc(citas.fecha_hora));
        return rows.map(toPublicCita);
      }

      const clienta_id = jwt?.sub;
      if (!clienta_id) return [];

      if (query.clienta_id && query.clienta_id !== 'me' && query.clienta_id !== clienta_id) {
        return [];
      }

      const rows = await deps.db
        .select()
        .from(citas)
        .where(eq(citas.clienta_id, clienta_id))
        .orderBy(asc(citas.fecha_hora));
      return rows.map(toPublicCita);
    },

    /** Lista proximas citas (solo admin). */
    listProximasCitas: async (ctx: unknown) => {
      const { auth } = ctx as { auth?: unknown };
      const jwt = ((auth as unknown) ?? null) as AuthJwtPayload | null;
      const denied = requireAdmin({ auth: jwt, status: () => {} });
      if (denied) return [];

      const now = new Date();
      const rows = await deps.db
        .select()
        .from(citas)
        .where(gte(citas.fecha_hora, now))
        .orderBy(asc(citas.fecha_hora));
      return rows.map(toPublicCita);
    },

    /** Lista citas pendientes/confirmadas (solo admin). */
    listCitasPendientes: async (ctx: unknown) => {
      const { auth } = ctx as { auth?: unknown };
      const jwt = ((auth as unknown) ?? null) as AuthJwtPayload | null;
      const denied = requireAdmin({ auth: jwt, status: () => {} });
      if (denied) return [];

      const rows = await deps.db
        .select()
        .from(citas)
        .where(inArray(citas.estado, ['pendiente', 'confirmada']))
        .orderBy(asc(citas.fecha_hora));
      return rows.map(toPublicCita);
    },

    /** Crea una cita. Admin puede elegir clienta_id; clienta siempre crea para si misma. */
    createCita: async (ctx: unknown) => {
      const { auth, status, body, set } = ctx as CitaCreateCtx;
      const jwt = ((auth as unknown) ?? null) as AuthJwtPayload | null;
      const denied = requireAuth({ auth: jwt, status });
      if (denied) return denied;

      const clienta_id = jwt?.rol === 'admin' ? body.clienta_id : jwt?.sub;
      if (!clienta_id) {
        set.status = 401;
        return { error: 'unauthorized' };
      }

      const inserted = await deps.db
        .insert(citas)
        .values({
          clienta_id,
          servicio_ids: body.servicio_ids,
          fecha_hora: new Date(body.fecha_hora),
          puntos_ganados: body.puntos_ganados,
          notas: body.notas,
          estado: 'pendiente',
        })
        .returning();

      const row = inserted[0];
      if (!row) {
        set.status = 500;
        return { error: 'internal_server_error' };
      }

      set.status = 201;
      return toPublicCita(row);
    },

    /**
     * Actualiza una cita.
     *
     * Reglas:
     * - Clienta: solo puede confirmar/cancelar si esta `pendiente`.
     * - Admin: puede cancelar/completar desde `pendiente` o `confirmada`.
     * - Al completar, suma puntos en `profiles.puntos` una sola vez (atomico).
     */
    patchCita: async (ctx: unknown) => {
      const { auth, status, params, body, set } = ctx as CitaPatchCtx;
      const jwt = ((auth as unknown) ?? null) as AuthJwtPayload | null;
      const denied = requireAuth({ auth: jwt, status });
      if (denied) return denied;

      const existing = await deps.db.select().from(citas).where(eq(citas.id, params.id)).limit(1);
      const cita = existing[0];
      if (!cita) {
        set.status = 404;
        return { error: 'not_found' };
      }

      if (jwt?.rol !== 'admin' && cita.clienta_id !== jwt?.sub) {
        set.status = 403;
        return { error: 'forbidden' };
      }

      if (body.estado !== undefined && !validEstados.includes(body.estado)) {
        set.status = 400;
        return { error: 'invalid_estado' };
      }

      const decision = decideCitaPatch({
        actorRole: jwt?.rol === 'admin' ? 'admin' : 'clienta',
        currentEstado: cita.estado,
        intent: {
          estado: body.estado,
          notas: body.notas,
        },
      });

      if (!decision.ok) {
        set.status = 403;
        const code =
          decision.error === 'final_state'
            ? 'final_state'
            : decision.error === 'no_state_change'
              ? 'no_state_change'
              : decision.error === 'forbidden_notas'
                ? 'forbidden_notas'
                : 'forbidden_transition';
        return { error: code };
      }

      if (!decision.nextEstado && body.notas === undefined) {
        set.status = 400;
        return { error: 'no_updates' };
      }

      if (!decision.allowNotas && body.notas !== undefined) {
        set.status = 403;
        return { error: 'forbidden_notas' };
      }

      const nextNotas = decision.allowNotas ? body.notas : undefined;
      const nextEstado = decision.nextEstado;

      const patched = await deps.db.transaction(async (tx) => {
        const atomicTx: CitasPatchAtomicTx = {
          updateCita: async (id, updates) => {
            const updated = await tx.update(citas).set(updates).where(eq(citas.id, id)).returning();
            return updated[0] ?? null;
          },
          updateCitaIfEstadoIn: async (id, allowedEstados, updates) => {
            const updated = await tx
              .update(citas)
              .set(updates)
              .where(and(eq(citas.id, id), inArray(citas.estado, [...allowedEstados])))
              .returning();
            return updated[0] ?? null;
          },
          incrementProfilePoints: async (profileId, delta) => {
            await tx
              .update(profiles)
              .set({
                puntos: sql<number>`${profiles.puntos} + ${delta}`,
              })
              .where(eq(profiles.id, profileId));
          },
        };

        return patchCitaAtomic({
          tx: atomicTx,
          citaId: params.id,
          nextEstado,
          nextNotas,
          awardPoints: decision.awardPoints,
        });
      });

      if (!patched) {
        set.status = 409;
        return { error: 'conflict' };
      }

      return toPublicCita(patched);
    },

    /** Elimina una cita (admin o dueña). */
    deleteCita: async (ctx: unknown) => {
      const { auth, status, params, set } = ctx as CitaDeleteCtx;
      const jwt = ((auth as unknown) ?? null) as AuthJwtPayload | null;
      const denied = requireAuth({ auth: jwt, status });
      if (denied) return denied;

      const existing = await deps.db.select().from(citas).where(eq(citas.id, params.id)).limit(1);
      const cita = existing[0];
      if (!cita) {
        set.status = 404;
        return { error: 'not_found' };
      }

      if (jwt?.rol !== 'admin' && cita.clienta_id !== jwt?.sub) {
        set.status = 403;
        return { error: 'forbidden' };
      }

      const deleted = await deps.db.delete(citas).where(eq(citas.id, params.id)).returning({ id: citas.id });
      const row = deleted[0];
      if (!row) {
        set.status = 404;
        return { error: 'not_found' };
      }

      return { ok: true };
    },
  };
}

export type CitasHttpHandlers = ReturnType<typeof createCitasHttpHandlers>;

// Back-compat: export a non-verbose alias (used by existing imports).
export const createCitasHandlers = createCitasHttpHandlers;

// Keep AnyElysia imported for future-proofing JSDoc/type references.
export type _AnyElysia = AnyElysia;
