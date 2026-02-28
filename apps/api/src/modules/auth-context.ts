import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';

export type Rol = 'admin' | 'clienta';

export type AuthJwtPayload = {
  sub: string;
  rol: Rol;
  iat?: number;
  exp?: number;
};

export type AuthContextOptions = {
  jwtSecret: string;
  nodeEnv: 'development' | 'test' | 'production';
  cookieName?: string;
  cookieMaxAgeSeconds?: number;
};

function isAuthPayload(value: unknown): value is AuthJwtPayload {
  if (!value || typeof value !== 'object') return false;

  const v = value as Record<string, unknown>;
  if (typeof v.sub !== 'string') return false;
  if (v.rol !== 'admin' && v.rol !== 'clienta') return false;

  return true;
}

const defaultCookieName = 'auth';
const defaultCookieMaxAgeSeconds = 7 * 86400;

export function requireAuth({ auth, status }: { auth: AuthJwtPayload | null; status: (code: number, body?: unknown) => unknown }) {
  if (!auth) return status(401, { error: 'unauthorized' });
}

export function requireAdmin({ auth, status }: { auth: AuthJwtPayload | null; status: (code: number, body?: unknown) => unknown }) {
  if (!auth) return status(401, { error: 'unauthorized' });
  if (auth.rol !== 'admin') return status(403, { error: 'forbidden' });
}

export function authContextModule(options: AuthContextOptions) {
  const cookieName = options.cookieName ?? defaultCookieName;
  const cookieMaxAgeSeconds = options.cookieMaxAgeSeconds ?? defaultCookieMaxAgeSeconds;

  return new Elysia({ name: 'auth-context' })
    .decorate('auth', null as AuthJwtPayload | null)
    .use(
      jwt({
        name: 'jwt',
        secret: options.jwtSecret,
        exp: `${cookieMaxAgeSeconds}s`,
      })
    )
    .resolve(async ({ jwt, cookie }) => {
      const token = (cookie as Record<string, { value?: string | null }>)[cookieName]?.value;
      const verified = token ? await jwt.verify(token) : null;

      return {
        auth: isAuthPayload(verified) ? verified : null,
      };
    });
}
