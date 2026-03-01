import { t } from 'elysia';
import type { AnyElysia } from 'elysia';

import { db as defaultDb } from '../db';

import { createCitasHttpHandlers } from './citas.handlers';

/** Registra rutas HTTP para `citas` en la app Elysia. */
export function registerCitasRoutes(app: AnyElysia) {
  const handlers = createCitasHttpHandlers({ db: defaultDb });

  return app
    .get(
      '/api/citas',
      handlers.listCitas,
      {
        query: t.Object({
          // Soportamos `me` para que el cliente pueda pedir sus propias citas
          // sin conocer el UUID (p.ej. `/api/citas?clienta_id=me`).
          clienta_id: t.Optional(t.Union([t.Literal('me'), t.String({ format: 'uuid' })])),
        }),
      }
    )
    .get('/api/citas/proximas', handlers.listProximasCitas)
    .get('/api/citas/pendientes', handlers.listCitasPendientes)
    .post(
      '/api/citas',
      handlers.createCita,
      {
        body: t.Object({
          clienta_id: t.Optional(t.String({ format: 'uuid' })),
          servicio_ids: t.Array(t.String({ format: 'uuid' })),
          fecha_hora: t.String({ format: 'date-time' }),
          puntos_ganados: t.Integer({ minimum: 0 }),
          puntos_utilizados: t.Integer({ minimum: 0 }),
          notas: t.Optional(t.String()),
        }),
      }
    )
    .patch(
      '/api/citas/:id',
      handlers.patchCita,
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
        }),
        body: t.Object(
          {
            estado: t.Optional(
              t.Union([
                t.Literal('pendiente'),
                t.Literal('confirmada'),
                t.Literal('completada'),
                t.Literal('cancelada'),
              ])
            ),
            notas: t.Optional(t.String()),
          },
          { minProperties: 1 }
        ),
      }
    )
    .delete(
      '/api/citas/:id',
      handlers.deleteCita,
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
        }),
      }
    );
}
