import { t } from 'elysia';
import type { AnyElysia } from 'elysia';

import { db as defaultDb } from '../db';

import { createServiciosHttpHandlers } from './servicios.handlers';

/** Registra rutas HTTP para `servicios`. */
export function registerServiciosRoutes(app: AnyElysia) {
  const handlers = createServiciosHttpHandlers({ db: defaultDb });

  return app
    .get('/api/servicios', handlers.listServicios)
    .post(
      '/api/servicios',
      handlers.createServicio,
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
      handlers.patchServicio,
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
      handlers.deleteServicio,
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
        }),
      }
    );
}
