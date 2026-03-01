import { t } from 'elysia';
import type { AnyElysia } from 'elysia';

import { db as defaultDb } from '../db';

import { createPremiosHttpHandlers } from './premios.handlers';

/** Registra rutas HTTP para `premios`. */
export function registerPremiosRoutes(app: AnyElysia) {
  const handlers = createPremiosHttpHandlers({ db: defaultDb });

  return app
    .get('/api/premios', handlers.listPremios)
    .post(
      '/api/premios',
      handlers.createPremio,
      {
        body: t.Object({
          nombre: t.String({ minLength: 1 }),
          descripcion: t.String(),
          puntos_requeridos: t.Integer({ minimum: 1 }),
          activo: t.Optional(t.Boolean()),
        }),
      }
    )
    .patch(
      '/api/premios/:id',
      handlers.patchPremio,
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
        }),
        body: t.Object(
          {
            nombre: t.Optional(t.String({ minLength: 1 })),
            descripcion: t.Optional(t.String()),
            puntos_requeridos: t.Optional(t.Integer({ minimum: 1 })),
            activo: t.Optional(t.Boolean()),
          },
          { minProperties: 1 }
        ),
      }
    )
    .delete(
      '/api/premios/:id',
      handlers.deletePremio,
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
        }),
      }
    );
}
