import { describe, expect, it } from 'vitest';

import { citas, profiles } from '../../db/schema';
import { createCitasHandlers } from '../citas';
import type { AuthJwtPayload } from '../auth-context';

type CitaRow = {
  id: string;
  clienta_id: string;
  servicio_ids: string[];
  fecha_hora: Date;
  puntos_ganados: number;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  notas?: string | null;
  created_at: Date;
};

type ProfileRow = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  rol: 'admin' | 'clienta';
  puntos: number;
  created_at: Date;
};

type StatusCall = { code: number; body?: unknown };

function makeStatus() {
  const calls: StatusCall[] = [];
  const status = (code: number, body?: unknown) => {
    const payload = { code, body };
    calls.push(payload);
    return payload;
  };
  return { status, calls };
}

type DbLike = {
  select: (...args: unknown[]) => unknown;
  update: (...args: unknown[]) => unknown;
  transaction: <T>(fn: (tx: DbLike) => Promise<T>) => Promise<T>;
  _data: { citasData: CitaRow[]; profilesData: ProfileRow[] };
};

function predicateIncludesState(predicate: unknown, state: string): boolean {
  if (!predicate || typeof predicate !== 'object') return false;
  if (!('queryChunks' in predicate)) return false;

  const sql = predicate as { queryChunks: unknown[] };
  const visited = new Set<unknown>();

  const walk = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false;
    if (visited.has(node)) return false;
    visited.add(node);

    if ('queryChunks' in (node as Record<string, unknown>)) {
      const chunks = (node as { queryChunks: unknown[] }).queryChunks;
      for (const ch of chunks) {
        if (walk(ch)) return true;
      }
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        if (walk(item)) return true;
      }
      return false;
    }

    if ((node as { constructor?: { name?: string } }).constructor?.name === 'Param' && 'value' in (node as Record<string, unknown>)) {
      const v = (node as { value?: unknown }).value;
      return v === state;
    }

    if ('value' in (node as Record<string, unknown>)) {
      const v = (node as { value?: unknown }).value;
      if (Array.isArray(v)) {
        return v.includes(state);
      }
      return v === state;
    }

    return false;
  };

  return walk(sql);
}

function predicateMatchesId(predicate: unknown, id: string): boolean {
  if (!predicate || typeof predicate !== 'object') return false;
  if (!('queryChunks' in predicate)) return false;

  const sql = predicate as { queryChunks: unknown[] };
  const visited = new Set<unknown>();

  const walk = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false;
    if (visited.has(node)) return false;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        if (walk(item)) return true;
      }
      return false;
    }

    if ('queryChunks' in (node as Record<string, unknown>)) {
      const chunks = (node as { queryChunks: unknown[] }).queryChunks;
      for (const ch of chunks) {
        if (walk(ch)) return true;
      }
    }

    if ((node as { constructor?: { name?: string } }).constructor?.name === 'Param' && 'value' in (node as Record<string, unknown>)) {
      const v = (node as { value?: unknown }).value;
      return v === id;
    }

    return false;
  };

  return walk(sql);
}

function predicateMatchesProfileId(predicate: unknown, id: string): boolean {
  // Drizzle SQL predicates for profiles updates embed the profile id as a param.
  return predicateMatchesId(predicate, id);
}

function makeRowsWrapper<T>(rows: T[]) {
  return {
    map: (...args: Parameters<T[]['map']>) => rows.map(...args),
    limit: (limit: number) => rows.slice(0, limit),
    [Symbol.iterator]: () => rows[Symbol.iterator](),
  };
}

function makeDb(seed: { citas: CitaRow[]; profiles: ProfileRow[] }): DbLike {
  const citasData = seed.citas.map((row) => ({ ...row }));
  const profilesData = seed.profiles.map((row) => ({ ...row }));

  const select = () => ({
    from: (table: unknown) => {
      const getRows = (): unknown[] => {
        if (table === citas) return citasData;
        if (table === profiles) return profilesData;
        return [];
      };

      const whereChain = (predicate?: unknown) => ({
        where: (p?: unknown) => whereChain(p ?? predicate),
        limit: (n: number) => {
          if (!predicate) return getRows().slice(0, n);
          if (table === citas) {
            return (getRows() as CitaRow[]).filter((r) => predicateMatchesId(predicate, r.id)).slice(0, n);
          }
          return getRows().slice(0, n);
        },
        orderBy: () => makeRowsWrapper(getRows()),
      });

      return {
        where: (predicate?: unknown) => whereChain(predicate),
        orderBy: () => makeRowsWrapper(getRows()),
      };
    },
  });

  const update = (table: unknown) => ({
    set: (updates: Record<string, unknown>) => ({
      where: (predicate?: unknown) => {
        let ran = false;
        let cached: unknown[] = [];

        const exec = () => {
          if (ran) return cached;
          ran = true;

          if (table === citas) {
            const idx = citasData.findIndex((r) => (predicate ? predicateMatchesId(predicate, r.id) : false));
            if (idx === -1) {
              cached = [];
              return cached;
            }

            // Simulate the atomic guard used by the handler when completing.
            if (updates.estado === 'completada') {
              const okState =
                predicateIncludesState(predicate, 'pendiente') || predicateIncludesState(predicate, 'confirmada');
              if (!okState) {
                cached = [];
                return cached;
              }
            }

            const current = citasData[idx];
            const next = { ...current, ...updates } as CitaRow;
            citasData[idx] = next;
            cached = [next];
            return cached;
          }

          if (table === profiles) {
            const idx = profilesData.findIndex((r) => (predicate ? predicateMatchesProfileId(predicate, r.id) : false));
            if (idx === -1) {
              cached = [];
              return cached;
            }
            const current = profilesData[idx];

            // The handler uses sql`${profiles.puntos} + ${delta}`. In tests we just add.
            const raw = updates.puntos;
            let delta = 0;
            if (typeof raw === 'number') {
              delta = raw;
            } else if (raw && typeof raw === 'object') {
              const record = raw as Record<string, unknown>;
              const chunks = Array.isArray(record.queryChunks) ? (record.queryChunks as unknown[]) : [];
              for (const chunk of chunks) {
                if (typeof chunk === 'number') {
                  delta = chunk;
                  break;
                }
                if (chunk && typeof chunk === 'object' && 'value' in (chunk as Record<string, unknown>)) {
                  const v = (chunk as { value?: unknown }).value;
                  if (typeof v === 'number') {
                    delta = v;
                    break;
                  }
                }
              }
            }

            const next = { ...current, ...updates, puntos: current.puntos + delta } as ProfileRow;
            profilesData[idx] = next;
            cached = [next];
            return cached;
          }

          cached = [];
          return cached;
        };

        const thenable = {
          then: (resolve: (value: unknown) => unknown, reject: (reason?: unknown) => unknown) => {
            try {
              return Promise.resolve(resolve(exec()));
            } catch (error) {
              return Promise.resolve(reject(error));
            }
          },
        };

        return Object.assign(thenable, {
          returning: () => exec(),
        });
      },
    }),
  });

  const transaction: DbLike['transaction'] = async <T>(fn: (tx: DbLike) => Promise<T>) => {
    return fn({ select, update, transaction, _data: { citasData, profilesData } });
  };

  return { select, update, transaction, _data: { citasData, profilesData } };
}

describe('citas.patch business flow', () => {
  it('clienta can confirm pending and cannot change after', async () => {
    const db = makeDb({
      profiles: [
        {
          id: 'clienta-1',
          nombre: 'Ana',
          apellido: 'Lopez',
          telefono: '111',
          email: 'ana@mail.com',
          rol: 'clienta',
          puntos: 0,
          created_at: new Date(),
        },
      ],
      citas: [
        {
          id: 'cita-1',
          clienta_id: 'clienta-1',
          servicio_ids: ['srv-1'],
          fecha_hora: new Date(),
          puntos_ganados: 15,
          estado: 'pendiente',
          notas: null,
          created_at: new Date(),
        },
      ],
    });

    const handlers = createCitasHandlers({ db: db as unknown as never });
    const { status } = makeStatus();
    const auth = { sub: 'clienta-1', rol: 'clienta' } satisfies AuthJwtPayload;

    const confirmed = await handlers.patch({
      auth,
      status,
      params: { id: 'cita-1' },
      body: { estado: 'confirmada' },
      set: {},
    });
    expect((confirmed as { estado?: string }).estado).toBe('confirmada');

    const denied = await handlers.patch({
      auth,
      status,
      params: { id: 'cita-1' },
      body: { estado: 'cancelada' },
      set: {},
    });
    expect(denied).toEqual({ error: 'forbidden_transition' });
  });

  it('admin can complete pending and awards points exactly once', async () => {
    const db = makeDb({
      profiles: [
        {
          id: 'admin-1',
          nombre: 'Admin',
          apellido: 'User',
          telefono: '999',
          email: 'admin@mail.com',
          rol: 'admin',
          puntos: 0,
          created_at: new Date(),
        },
        {
          id: 'clienta-1',
          nombre: 'Ana',
          apellido: 'Lopez',
          telefono: '111',
          email: 'ana@mail.com',
          rol: 'clienta',
          puntos: 10,
          created_at: new Date(),
        },
      ],
      citas: [
        {
          id: 'cita-1',
          clienta_id: 'clienta-1',
          servicio_ids: ['srv-1'],
          fecha_hora: new Date(),
          puntos_ganados: 20,
          estado: 'pendiente',
          notas: null,
          created_at: new Date(),
        },
      ],
    });

    const handlers = createCitasHandlers({ db: db as unknown as never });
    const { status } = makeStatus();
    const auth = { sub: 'admin-1', rol: 'admin' } satisfies AuthJwtPayload;

    const completed = await handlers.patch({
      auth,
      status,
      params: { id: 'cita-1' },
      body: { estado: 'completada' },
      set: {},
    });
    expect((completed as { estado?: string }).estado).toBe('completada');
    expect(db._data.profilesData.find((p) => p.id === 'clienta-1')?.puntos).toBe(30);

    const conflict = await handlers.patch({
      auth,
      status,
      params: { id: 'cita-1' },
      body: { estado: 'completada' },
      set: {},
    });
    expect(conflict).toEqual({ error: 'no_state_change' });
    expect(db._data.profilesData.find((p) => p.id === 'clienta-1')?.puntos).toBe(30);
  });
});
