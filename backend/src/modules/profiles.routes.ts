import { t } from 'elysia';
import type { AnyElysia } from 'elysia';

import { db as defaultDb } from '../db';

import { createProfilesHttpHandlers } from './profiles.handlers';

/** Registra rutas HTTP para `profiles`. */
export function registerProfilesRoutes(app: AnyElysia) {
  const handlers = createProfilesHttpHandlers({ db: defaultDb });

  return app
    .get(
      '/api/profiles',
      handlers.listProfiles,
      {
        query: t.Object({
          rol: t.Optional(t.Union([t.Literal('admin'), t.Literal('clienta')])),
        }),
      }
    )
    .get(
      '/api/profiles/:id',
      handlers.getProfileById,
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
        }),
      }
    )
    .patch(
      '/api/profiles/:id',
      handlers.patchProfile,
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
        }),
        body: t.Object(
          {
            nombre: t.Optional(t.String({ minLength: 1 })),
            apellido: t.Optional(t.String({ minLength: 1 })),
            telefono: t.Optional(t.String({ minLength: 1 })),
            email: t.Optional(t.String({ format: 'email' })),
            puntos: t.Optional(t.Integer({ minimum: 0 })),
          },
          { minProperties: 1 }
        ),
      }
    );
}
