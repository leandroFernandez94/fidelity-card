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

function normalizeAuthPayload(value: Record<string, unknown>): AuthJwtPayload | null {
  const sub = value.sub;
  const subject = value.subject;
  const rol = value.rol;

  const resolvedSub = typeof sub === 'string' ? sub : typeof subject === 'string' ? subject : null;
  if (!resolvedSub) return null;
  if (rol !== 'admin' && rol !== 'clienta') return null;

  const iat = typeof value.iat === 'number' ? value.iat : undefined;
  const exp = typeof value.exp === 'number' ? value.exp : undefined;

  return { sub: resolvedSub, rol: rol as Rol, iat, exp };
}

const defaultCookieName = 'auth';
const defaultCookieMaxAgeSeconds = 7 * 86400;

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    if (key !== name) continue;

    const rawValue = trimmed.slice(eqIndex + 1);
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

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
    .resolve(async ({ jwt, request, cookie }) => {
      const token =
        (cookie as Record<string, { value?: string | null }>)[cookieName]?.value ??
        getCookieValue(request.headers.get('cookie'), cookieName);
      const verified = token ? await jwt.verify(token) : null;
      const record = verified && typeof verified === 'object' ? (verified as Record<string, unknown>) : null;

      return {
        auth: record ? normalizeAuthPayload(record) : null,
      };
    })
    .as('scoped');
}
