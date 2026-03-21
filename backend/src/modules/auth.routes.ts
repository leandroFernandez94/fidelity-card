import { t } from 'elysia';
import type { AnyElysia } from 'elysia';
import bcrypt from 'bcryptjs';

import { db } from '../db';

import type { AuthContextOptions } from './auth-context';
import { createAuthHttpHandlers } from './auth.handlers';

type AuthRoutesOptions = AuthContextOptions;

/** Registra rutas HTTP de autenticacion (signup/signin/signout/me). */
export function registerAuthRoutes(app: AnyElysia, options: AuthRoutesOptions) {
  const handlers = createAuthHttpHandlers(
    {
      db,
      bcrypt: {
        hash: bcrypt.hash,
        compare: bcrypt.compare,
      },
    },
    options
  );

  return app
    .post(
      '/api/auth/signup',
      handlers.signup,
      {
        body: t.Object({
          email: t.String({ format: 'email', default: '' }),
          password: t.String({ minLength: 6 }),
          nombre: t.String({ minLength: 1 }),
          apellido: t.String({ minLength: 1 }),
          telefono: t.String({ minLength: 1 }),
        }),
      }
    )
    .post(
      '/api/auth/signin',
      handlers.signin,
      {
        body: t.Object({
          email: t.String({ format: 'email', default: '' }),
          password: t.String({ minLength: 1 }),
        }),
      }
    )
    .post('/api/auth/signout', handlers.signout)
    .get('/api/auth/me', handlers.me);
}
