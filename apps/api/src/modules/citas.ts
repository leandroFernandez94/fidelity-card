import { t } from 'elysia';
import { asc, eq, and, gte, inArray } from 'drizzle-orm';

import { db as defaultDb } from '../db';
import { citas } from '../db/schema';
import { toPublicCita } from '../domain/transformers/citas';
import type { StatusHelper } from '../domain/types/http';
import type { CitaEstado } from '../domain/types/citas';

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
  auth: unknown;
  query: CitasListQuery;
};

export type CitaCreateCtx = {
  auth: unknown;
  status: StatusHelper;
  body: CitaCreateBody;
  set: { status: number };
};

export type CitaPatchCtx = {
  auth: unknown;
  status: StatusHelper;
  params: CitaIdParams;
  body: CitaPatchBody;
  set: { status: number };
};

export type CitaDeleteCtx = {
  auth: unknown;
  status: StatusHelper;
  params: CitaIdParams;
  set: { status: number };
};

const validEstados = ['pendiente', 'confirmada', 'completada', 'cancelada'] as const;

export function createCitasHandlers(deps: CitasDeps) {
  return {
    list: async ({ auth, query }: CitasListCtx) => {
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
    getProximas: async ({ auth }: { auth: unknown }) => {
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
    getPendientes: async ({ auth }: { auth: unknown }) => {
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
    create: async ({ auth, status, body, set }: CitaCreateCtx) => {
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
    patch: async ({ auth, status, params, body, set }: CitaPatchCtx) => {
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

      const updates: { estado?: typeof validEstados[number]; notas?: string } = {};

      if (body.estado !== undefined) {
        if (!validEstados.includes(body.estado)) {
          set.status = 400;
          return { error: 'invalid_estado' };
        }
        updates.estado = body.estado;
      }

      if (body.notas !== undefined) {
        updates.notas = body.notas;
      }

      if (Object.keys(updates).length === 0) {
        set.status = 400;
        return { error: 'no_updates' };
      }

      const updated = await deps.db.update(citas).set(updates).where(eq(citas.id, params.id)).returning();
      const row = updated[0];
      if (!row) {
        set.status = 404;
        return { error: 'not_found' };
      }

      return toPublicCita(row);
    },
    remove: async ({ auth, status, params, set }: CitaDeleteCtx) => {
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

export function registerCitasRoutes<App extends { get: unknown; post: unknown; patch: unknown; delete: unknown }>(app: App): App {
  const handlers = createCitasHandlers({ db: defaultDb });

  return (app as any)
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
