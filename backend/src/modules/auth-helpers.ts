import { requireAuth, requireAdmin } from './auth-context';
import type { AuthJwtPayload } from './auth-context';
import type { StatusHelper } from '../domain/types/http';

/**
 * Discriminated result for combined guard + extraction helpers.
 * - `ok: true` → `jwt` is a validated `AuthJwtPayload`.
 * - `ok: false` → `response` is the denied response from `requireAuth`/`requireAdmin`.
 */
export type GuardResult =
  | { ok: true; jwt: AuthJwtPayload }
  | { ok: false; response: unknown };

/**
 * Extracts and normalizes the JWT payload from Elysia's decorated `auth`.
 *
 * Centralises the double-cast that was previously repeated in every handler,
 * so each handler can call `extractJwt(auth)` instead of the 3-line boilerplate.
 */
export function extractJwt(auth: unknown): AuthJwtPayload | null {
  return ((auth as unknown) ?? null) as AuthJwtPayload | null;
}

/**
 * Combined admin guard: extracts JWT from `auth` and checks admin role.
 *
 * Usage:
 * ```ts
 * const result = guardAdmin({ auth, status });
 * if (!result.ok) return result.response;
 * // result.jwt is AuthJwtPayload
 * ```
 */
export function guardAdmin(ctx: { auth: unknown; status: StatusHelper }): GuardResult {
  const jwt = extractJwt(ctx.auth);
  const denied = requireAdmin({ auth: jwt, status: ctx.status });
  if (denied) return { ok: false, response: denied };
  return { ok: true, jwt: jwt! };
}

/**
 * Combined auth guard: extracts JWT from `auth` and checks it is present.
 *
 * Usage:
 * ```ts
 * const result = guardAuth({ auth, status });
 * if (!result.ok) return result.response;
 * // result.jwt is AuthJwtPayload
 * ```
 */
export function guardAuth(ctx: { auth: unknown; status: StatusHelper }): GuardResult {
  const jwt = extractJwt(ctx.auth);
  const denied = requireAuth({ auth: jwt, status: ctx.status });
  if (denied) return { ok: false, response: denied };
  return { ok: true, jwt: jwt! };
}
