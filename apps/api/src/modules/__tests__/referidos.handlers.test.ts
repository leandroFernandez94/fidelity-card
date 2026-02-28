import { describe, expect, it } from 'vitest';

import { profiles, referidos } from '../../db/schema';
import { createReferidosHandlers } from '../referidos.handlers';
import type { AuthJwtPayload } from '../auth-context';
import type { PublicReferido } from '../../domain/types/referidos';

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

type ReferidoRow = {
  id: string;
  referente_id: string;
  referida_id: string;
  puntos_ganados: number;
  fecha: Date;
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

function resolvePuntosUpdate(current: number, value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const raw = JSON.stringify(value);
    const allNumbers = raw.match(/\b\d+\b/g) ?? [];
    const delta = Number(allNumbers[0] ?? 0);
    if (Number.isFinite(delta)) return current + delta;
  }
  return current;
}

type PredicateValue = { type: 'rol' | 'id' | 'referente'; value: unknown };

function getPredicateValue(predicate?: { right?: unknown; value?: unknown }): PredicateValue | undefined {
  if (!predicate) return undefined;
  if ('right' in predicate) {
    const rightValue = predicate.right;
    if (rightValue === 'admin' || rightValue === 'clienta') {
      return { type: 'rol', value: rightValue };
    }
    return { type: 'referente', value: rightValue };
  }
  if ('value' in predicate) {
    return { type: 'id', value: predicate.value };
  }
  return undefined;
}

function makeRowsWrapper<T>(rows: T[]) {
  return {
    map: (...args: Parameters<T[]['map']>) => rows.map(...args),
    get length() {
      return rows.length;
    },
    limit: (limit: number) => rows.slice(0, limit),
    [Symbol.iterator]: () => rows[Symbol.iterator](),
  };
}

type DbLike = {
  select: (...args: unknown[]) => unknown;
  update: (...args: unknown[]) => unknown;
  insert: (...args: unknown[]) => unknown;
  transaction: <T>(fn: (tx: DbLike) => Promise<T>) => Promise<T>;
  _data: { profilesData: ProfileRow[]; referidosData: ReferidoRow[] };
};

function makeDb(seed: { profiles: ProfileRow[]; referidos: ReferidoRow[] }): DbLike {
  const profilesData = seed.profiles.map((row) => ({ ...row }));
  const referidosData = seed.referidos.map((row) => ({ ...row }));

  const select = () => ({
    from: (table: unknown) => {
      const getRows = (): ProfileRow[] | ReferidoRow[] => {
        if (table === profiles) return profilesData;
        if (table === referidos) return referidosData;
        return [] as ProfileRow[];
      };

      const filterByPredicates = (predicates: Array<{ right?: unknown; value?: unknown }>) => {
        let rows = getRows();

        for (const predicate of predicates) {
          const predicateValue = getPredicateValue(predicate);
          if (!predicateValue) continue;

          if (table === referidos) {
            if (predicateValue.type === 'referente' || predicateValue.type === 'id') {
              rows = (rows as ReferidoRow[]).filter((row) => row.referente_id === predicateValue.value);
            }
            continue;
          }

          if (table === profiles) {
            if (predicateValue.type === 'rol') {
              rows = (rows as ProfileRow[]).filter((row) => row.rol === predicateValue.value);
              continue;
            }

            if (predicateValue.type === 'id') {
              rows = (rows as ProfileRow[]).filter((row) => row.id === predicateValue.value);
            }
            continue;
          }
        }

        return rows;
      };

      const whereChain = (predicates: Array<{ right?: unknown; value?: unknown }>) => ({
        where: (predicate?: { right?: unknown; value?: unknown }) =>
          whereChain(predicate ? [...predicates, predicate] : predicates),
        orderBy: () => makeRowsWrapper(filterByPredicates(predicates) as unknown[]),
        limit: () => filterByPredicates(predicates),
      });

      return {
        where: (predicate?: { right?: unknown; value?: unknown }) => whereChain(predicate ? [predicate] : []),
        orderBy: () => makeRowsWrapper(getRows() as unknown[]),
      };
    },
  });

  const update = (table: unknown) => ({
    set: (updates: Record<string, unknown>) => ({
      where: (predicate?: { right?: unknown; value?: unknown }) => ({
        returning: () => {
          if (table === profiles) {
            const id = getPredicateValue(predicate)?.value;
            const idx = profilesData.findIndex((row) => row.id === id);
            if (idx === -1) return [];
            const current = profilesData[idx];
            const nextPuntos = resolvePuntosUpdate(current.puntos, updates.puntos);
            const next = { ...current, ...updates, puntos: nextPuntos };
            profilesData[idx] = next;
            return [next];
          }
          return [];
        },
      }),
    }),
  });

  const insert = (table: unknown) => ({
    values: (payload: Record<string, unknown>) => ({
      returning: () => {
        if (table === referidos) {
          const row: ReferidoRow = {
            id: `ref-${referidosData.length + 1}`,
            referente_id: String(payload.referente_id),
            referida_id: String(payload.referida_id),
            puntos_ganados: Number(payload.puntos_ganados ?? 0),
            fecha: new Date(),
          };
          referidosData.push(row);
          return [row];
        }
        return [];
      },
    }),
  });

  const transaction: DbLike['transaction'] = async <T>(fn: (tx: DbLike) => Promise<T>) => {
    return fn({ select, update, insert, transaction, _data: { profilesData, referidosData } });
  };

  return {
    select,
    update,
    insert,
    transaction,
    _data: { profilesData, referidosData },
  };
}

describe('createReferidosHandlers', () => {
  it('denies list without referente_id for non-admin', async () => {
    const db = makeDb({
      profiles: [],
      referidos: [],
    });
    const { status } = makeStatus();
    const handlers = createReferidosHandlers({ db: db as unknown as never });
    const auth = { sub: 'clienta-1', rol: 'clienta' } satisfies AuthJwtPayload;

    const result = await handlers.list({ auth, status, query: {} });
    expect(result).toEqual({ code: 403, body: { error: 'forbidden' } });
  });

  it('allows owner to list by referente_id', async () => {
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
      referidos: [
        {
          id: 'ref-1',
          referente_id: 'clienta-1',
          referida_id: 'clienta-2',
          puntos_ganados: 20,
          fecha: new Date(),
        },
      ],
    });
    const { status } = makeStatus();
    const handlers = createReferidosHandlers({ db: db as unknown as never });
    const auth = { sub: 'clienta-1', rol: 'clienta' } satisfies AuthJwtPayload;

    const result = await handlers.list({ auth, status, query: { referente_id: 'clienta-1' } });
    expect(result).toHaveLength(1);
  });

  it('creates referido and sums points for referente', async () => {
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
        {
          id: 'clienta-2',
          nombre: 'Luz',
          apellido: 'Diaz',
          telefono: '222',
          email: 'luz@mail.com',
          rol: 'clienta',
          puntos: 5,
          created_at: new Date(),
        },
      ],
      referidos: [],
    });
    const { status } = makeStatus();
    const handlers = createReferidosHandlers({ db: db as unknown as never });
    const auth = { sub: 'admin-1', rol: 'admin' } satisfies AuthJwtPayload;
    const set = { status: 0 };

    const result = await handlers.create({
      auth,
      status,
      body: {
        referente_id: 'clienta-1',
        referida_id: 'clienta-2',
        puntos_ganados: 20,
      },
      set,
    });

    expect(set.status).toBe(201);
    expect((result as PublicReferido).puntos_ganados).toBe(20);
    expect(db._data.referidosData).toHaveLength(1);
    const updated = db._data.profilesData.find((row) => row.id === 'clienta-1');
    expect(updated?.puntos).toBeGreaterThanOrEqual(10);
  });

  it('returns top clientas by points for authenticated user', async () => {
    const db = makeDb({
      profiles: [
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
        {
          id: 'clienta-2',
          nombre: 'Luz',
          apellido: 'Diaz',
          telefono: '222',
          email: 'luz@mail.com',
          rol: 'clienta',
          puntos: 40,
          created_at: new Date(),
        },
        {
          id: 'admin-1',
          nombre: 'Admin',
          apellido: 'User',
          telefono: '999',
          email: 'admin@mail.com',
          rol: 'admin',
          puntos: 999,
          created_at: new Date(),
        },
      ],
      referidos: [],
    });
    const { status } = makeStatus();
    const handlers = createReferidosHandlers({ db: db as unknown as never });
    const auth = { sub: 'clienta-1', rol: 'clienta' } satisfies AuthJwtPayload;

    const result = await handlers.puntosTop({ auth, status, query: { limit: 2 } });
    expect(result).toHaveLength(2);
  });
});
