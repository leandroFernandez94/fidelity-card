import { t } from 'elysia';
import type { AnyElysia } from 'elysia';
import { and, asc, eq, gte, inArray, sql } from 'drizzle-orm';

import { db as defaultDb } from '../db';
import { citas, profiles } from '../db/schema';
import { toPublicCita } from '../domain/transformers/citas';
import type { StatusHelper } from '../domain/types/http';
import type { CitaEstado } from '../domain/types/citas';

import { requireAuth, requireAdmin } from './auth-context';
import type { AuthJwtPayload } from './auth-context';

import { decideCitaPatch } from '../domain/logic/citas';
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

export function createCitasHandlers(deps: CitasDeps) {
  return {
    list: async (ctx: unknown) => {
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
    getProximas: async (ctx: unknown) => {
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
    getPendientes: async (ctx: unknown) => {
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
    create: async (ctx: unknown) => {
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
    patch: async (ctx: unknown) => {
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
        if (decision.awardPoints && nextEstado === 'completada') {
          // Atomic award: only award once, only when transitioning to completada.
          const updatedCita = await tx
            .update(citas)
            .set({
              estado: nextEstado,
              ...(nextNotas !== undefined ? { notas: nextNotas } : {}),
            })
            .where(and(eq(citas.id, params.id), inArray(citas.estado, ['pendiente', 'confirmada'])))
            .returning();

          const row = updatedCita[0];
          if (!row) {
            return null;
          }

          await tx
            .update(profiles)
            .set({
              puntos: sql<number>`${profiles.puntos} + ${row.puntos_ganados}`,
            })
            .where(eq(profiles.id, row.clienta_id));

          return row;
        }

        const updates: { estado?: typeof validEstados[number]; notas?: string } = {};
        if (nextEstado) updates.estado = nextEstado;
        if (nextNotas !== undefined) updates.notas = nextNotas;

        const updated = await tx.update(citas).set(updates).where(eq(citas.id, params.id)).returning();
        return updated[0] ?? null;
      });

      if (!patched) {
        set.status = 409;
        return { error: 'conflict' };
      }

      return toPublicCita(patched);
    },
    remove: async (ctx: unknown) => {
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

export function registerCitasRoutes(app: AnyElysia) {
  const handlers = createCitasHandlers({ db: defaultDb });

  return app
    .get(
      '/api/citas',
      handlers.list,
      {
        query: t.Object({
          clienta_id: t.Optional(t.String({ format: 'uuid' })),
        }),
      }
    )
    .get('/api/citas/proximas', handlers.getProximas)
    .get('/api/citas/pendientes', handlers.getPendientes)
    .post(
      '/api/citas',
      handlers.create,
      {
        body: t.Object({
          clienta_id: t.Optional(t.String({ format: 'uuid' })),
          servicio_ids: t.Array(t.String({ format: 'uuid' })),
          fecha_hora: t.String({ format: 'date-time' }),
          puntos_ganados: t.Integer({ minimum: 0 }),
          notas: t.Optional(t.String()),
        }),
      }
    )
    .patch(
      '/api/citas/:id',
      handlers.patch,
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
        }),
        body: t.Object(
          {
            estado: t.Optional(t.Union(validEstados.map((e) => t.Literal(e)))),
            notas: t.Optional(t.String()),
          },
          { minProperties: 1 }
        ),
      }
    )
    .delete(
      '/api/citas/:id',
      handlers.remove,
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
        }),
      }
    );
}
