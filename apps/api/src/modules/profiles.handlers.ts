import { desc, eq } from 'drizzle-orm';

import { db as defaultDb } from '../db';
import { profiles } from '../db/schema';
import { toPublicProfile } from '../domain/transformers/profiles';
import type { StatusHelper } from '../domain/types/http';
import type { Rol } from '../domain/types/auth';

import { requireAuth, requireAdmin } from './auth-context';
import type { AuthJwtPayload } from './auth-context';

type ProfileQuery = {
  rol?: Rol;
};

type ProfileIdParams = {
  id: string;
};

type ProfilePatchBody = {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  puntos?: number;
};

export type ProfilesDeps = {
  db: typeof defaultDb;
};

export type ProfilesListCtx = {
  auth?: unknown;
  status: StatusHelper;
  query: ProfileQuery;
};

export type ProfileGetCtx = {
  auth?: unknown;
  status: StatusHelper;
  params: ProfileIdParams;
  set: { status?: number | string };
};

export type ProfilePatchCtx = {
  auth?: unknown;
  status: StatusHelper;
  params: ProfileIdParams;
  body: ProfilePatchBody;
  set: { status?: number | string };
};

/** Handlers HTTP para CRUD de profiles. */
export function createProfilesHttpHandlers(deps: ProfilesDeps) {
  return {
    listProfiles: async (ctx: unknown) => {
      const { auth, status, query } = ctx as ProfilesListCtx;
      const jwt = ((auth as unknown) ?? null) as AuthJwtPayload | null;
      const denied = requireAdmin({ auth: jwt, status });
      if (denied) return denied;

      if (query.rol) {
        const rows = await deps.db
          .select()
          .from(profiles)
          .where(eq(profiles.rol, query.rol))
          .orderBy(desc(profiles.created_at));
        return rows.map(toPublicProfile);
      }

      const rows = await deps.db.select().from(profiles).orderBy(desc(profiles.created_at));
      return rows.map(toPublicProfile);
    },

    getProfileById: async (ctx: unknown) => {
      const { auth, status, params, set } = ctx as ProfileGetCtx;
      const jwt = ((auth as unknown) ?? null) as AuthJwtPayload | null;
      const denied = requireAuth({ auth: jwt, status });
      if (denied) return denied;

      if (jwt?.rol !== 'admin' && jwt?.sub !== params.id) {
        set.status = 403;
        return { error: 'forbidden' };
      }

      const rows = await deps.db.select().from(profiles).where(eq(profiles.id, params.id)).limit(1);
      const row = rows[0];
      if (!row) {
        set.status = 404;
        return { error: 'not_found' };
      }

      return toPublicProfile(row);
    },

    patchProfile: async (ctx: unknown) => {
      const { auth, status, params, body, set } = ctx as ProfilePatchCtx;
      const jwt = ((auth as unknown) ?? null) as AuthJwtPayload | null;
      const denied = requireAuth({ auth: jwt, status });
      if (denied) return denied;

      if (jwt?.rol !== 'admin' && jwt?.sub !== params.id) {
        set.status = 403;
        return { error: 'forbidden' };
      }

      const updates: ProfilePatchBody = {};

      if (typeof body.nombre === 'string') updates.nombre = body.nombre.trim();
      if (typeof body.apellido === 'string') updates.apellido = body.apellido.trim();
      if (typeof body.telefono === 'string') updates.telefono = body.telefono.trim();
      if (typeof body.email === 'string') updates.email = body.email.trim().toLowerCase();
      if (typeof body.puntos === 'number') updates.puntos = body.puntos;

      if (Object.keys(updates).length === 0) {
        set.status = 400;
        return { error: 'no_updates' };
      }

      const updated = await deps.db.update(profiles).set(updates).where(eq(profiles.id, params.id)).returning();
      const row = updated[0];
      if (!row) {
        set.status = 404;
        return { error: 'not_found' };
      }

      return toPublicProfile(row);
    },
  };
}

export type ProfilesHttpHandlers = ReturnType<typeof createProfilesHttpHandlers>;

// Back-compat alias.
export const createProfilesHandlers = createProfilesHttpHandlers;
