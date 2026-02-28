import { t } from 'elysia';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { db } from '../db';
import { profiles, users } from '../db/schema';
import { toPublicUser } from '../domain/transformers/auth';
import { toPublicProfile } from '../domain/transformers/profiles';
import type { Rol, SigninBody, SignupBody } from '../domain/types/auth';

import type { StatusHelper } from '../domain/types/http';

import type { AuthContextOptions, AuthJwtPayload } from './auth-context';

type AuthRoutesOptions = AuthContextOptions;

export type AuthDeps = {
  db: typeof db;
  bcrypt: {
    hash: (value: string, saltOrRounds: number) => Promise<string>;
    compare: (value: string, hash: string) => Promise<boolean>;
  };
};

export type SignupCtx = {
  body: SignupBody;
  jwt: { sign: (payload: { sub: string; rol: Rol }) => Promise<string> };
  cookie: unknown;
  set: { status: number };
};

export type SigninCtx = {
  body: SigninBody;
  jwt: { sign: (payload: { sub: string; rol: Rol }) => Promise<string> };
  cookie: unknown;
  set: { status: number };
};

export type SignoutCtx = {
  cookie: unknown;
};

export type MeCtx = {
  auth: AuthJwtPayload | null;
  set: { status: number };
};

function normalizeEmail(emailRaw: string): string {
  return emailRaw.trim().toLowerCase();
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === '23505';
}

const defaultCookieName = 'auth';
const defaultCookieMaxAgeSeconds = 7 * 86400;

export function createAuthHandlers(deps: AuthDeps, options: AuthRoutesOptions) {
  const cookieName = options.cookieName ?? defaultCookieName;
  const cookieMaxAgeSeconds = options.cookieMaxAgeSeconds ?? defaultCookieMaxAgeSeconds;

  return {
    signup: async ({ body, jwt, cookie, set }: SignupCtx) => {
      const email = normalizeEmail(body.email);
      const password = body.password;
      const nombre = body.nombre.trim();
      const apellido = body.apellido.trim();
      const telefono = body.telefono.trim();

      const passwordHash = await deps.bcrypt.hash(password, 10);

      try {
        const created = await deps.db.transaction(async (tx) => {
          const insertedUsers = await tx
            .insert(users)
            .values({
              email,
              password_hash: passwordHash,
            })
            .returning();

          const userRow = insertedUsers[0];
          if (!userRow) {
            throw new Error('Failed to create user');
          }

          const insertedProfiles = await tx
            .insert(profiles)
            .values({
              id: userRow.id,
              nombre,
              apellido,
              telefono,
              email,
              rol: 'clienta',
              puntos: 0,
            })
            .returning();

          const profileRow = insertedProfiles[0];
          if (!profileRow) {
            throw new Error('Failed to create profile');
          }

          return { userRow, profileRow };
        });

        const token = await jwt.sign({ sub: created.userRow.id, rol: created.profileRow.rol });
        const cookieRecord = cookie as Record<string, { set: (opts: Record<string, unknown>) => void }>;

        cookieRecord[cookieName].set({
          value: token,
          httpOnly: true,
          sameSite: 'lax',
          secure: options.nodeEnv === 'production',
          path: '/',
          maxAge: cookieMaxAgeSeconds,
        });

        set.status = 201;
        return {
          user: toPublicUser(created.userRow),
          profile: toPublicProfile(created.profileRow),
        };
      } catch (error) {
        if (isUniqueViolation(error)) {
          set.status = 409;
          return { error: 'email_already_exists' };
        }

        throw error;
      }
    },
    signin: async ({ body, jwt, cookie, set }: SigninCtx) => {
      const email = normalizeEmail(body.email);

      const foundUsers = await deps.db.select().from(users).where(eq(users.email, email)).limit(1);
      const userRow = foundUsers[0];
      if (!userRow) {
        set.status = 401;
        return { error: 'invalid_credentials' };
      }

      const ok = await deps.bcrypt.compare(body.password, userRow.password_hash);
      if (!ok) {
        set.status = 401;
        return { error: 'invalid_credentials' };
      }

      const foundProfiles = await deps.db.select().from(profiles).where(eq(profiles.id, userRow.id)).limit(1);
      const profileRow = foundProfiles[0];
      if (!profileRow) {
        set.status = 401;
        return { error: 'profile_not_found' };
      }

      const token = await jwt.sign({ sub: userRow.id, rol: profileRow.rol });
      const cookieRecord = cookie as Record<string, { set: (opts: Record<string, unknown>) => void }>;

      cookieRecord[cookieName].set({
        value: token,
        httpOnly: true,
        sameSite: 'lax',
        secure: options.nodeEnv === 'production',
        path: '/',
        maxAge: cookieMaxAgeSeconds,
      });

      return {
        user: toPublicUser(userRow),
        profile: toPublicProfile(profileRow),
      };
    },
    signout: ({ cookie }: SignoutCtx) => {
      const cookieRecord = cookie as Record<string, { remove: () => void; set: (opts: Record<string, unknown>) => void }>;

      if (cookieRecord[cookieName]) {
        cookieRecord[cookieName].remove();
        cookieRecord[cookieName].set({
          value: '',
          httpOnly: true,
          sameSite: 'lax',
          secure: options.nodeEnv === 'production',
          path: '/',
          maxAge: 0,
        });
      }

      return { ok: true };
    },
    me: async ({ auth, set }: MeCtx) => {
      if (!auth) {
        set.status = 401;
        return { error: 'unauthorized' };
      }

      const foundUsers = await deps.db.select().from(users).where(eq(users.id, auth.sub)).limit(1);
      const userRow = foundUsers[0];
      if (!userRow) {
        set.status = 401;
        return { error: 'unauthorized' };
      }

      const foundProfiles = await deps.db.select().from(profiles).where(eq(profiles.id, auth.sub)).limit(1);
      const profileRow = foundProfiles[0];
      if (!profileRow) {
        set.status = 401;
        return { error: 'unauthorized' };
      }

      return {
        user: toPublicUser(userRow),
        profile: toPublicProfile(profileRow),
      };
    },
  };
}

export function registerAuthRoutes<App extends { post: unknown }>(app: App, options: AuthRoutesOptions): App {
  const handlers = createAuthHandlers(
    {
      db,
      bcrypt: {
        hash: bcrypt.hash,
        compare: bcrypt.compare,
      },
    },
    options
  );

  return (app as any)
    .post(
      '/api/auth/signup',
      handlers.signup,
      {
        body: t.Object({
          email: t.String({ format: 'email' }),
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
          email: t.String({ format: 'email' }),
          password: t.String({ minLength: 1 }),
        }),
      }
    )
    .post('/api/auth/signout', handlers.signout)
    .get('/api/auth/me', handlers.me);
}
