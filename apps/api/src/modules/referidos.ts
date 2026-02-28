import { t } from 'elysia';

import { db as defaultDb } from '../db';

import { createReferidosHandlers } from './referidos.handlers';

export function registerReferidosRoutes<App extends { get: unknown; post: unknown }>(app: App): App {
  const handlers = createReferidosHandlers({ db: defaultDb });

  return (app as any)
    .get(
      '/api/referidos',
      handlers.list,
      {
        query: t.Object({
          referente_id: t.Optional(t.String({ format: 'uuid' })),
        }),
      }
    )
    .post(
      '/api/referidos',
      handlers.create,
      {
        body: t.Object({
          referente_id: t.String({ format: 'uuid' }),
          referida_id: t.String({ format: 'uuid' }),
          puntos_ganados: t.Integer({ minimum: 0 }),
        }),
      }
    )
    .get(
      '/api/puntos/top',
      handlers.puntosTop,
      {
        query: t.Object({
          limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
        }),
      }
    )
    .post(
      '/api/puntos/sumar',
      handlers.sumarPuntos,
      {
        body: t.Object({
          profile_id: t.String({ format: 'uuid' }),
          cantidad: t.Integer({ minimum: 0 }),
        }),
      }
    )
    .post(
      '/api/puntos/restar',
      handlers.restarPuntos,
      {
        body: t.Object({
          profile_id: t.String({ format: 'uuid' }),
          cantidad: t.Integer({ minimum: 0 }),
        }),
      }
    );
}
