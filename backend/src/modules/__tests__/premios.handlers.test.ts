import { describe, expect, it } from 'vitest';
import { createPremiosHttpHandlers, type PremiosDeps } from '../premios.handlers';
import type { AuthJwtPayload } from '../auth-context';

type PremioRow = {
  id: string;
  nombre: string;
  descripcion: string;
  puntos_requeridos: number;
  activo: boolean;
};

type PremioInsertPayload = Omit<PremioRow, 'id'>;

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

function makeDb(seed: PremioRow[]) {
  const data = seed.map(row => ({ ...row }));

  const select = () => ({
    from: () => ({
      orderBy: () => data.sort((a, b) => a.nombre.localeCompare(b.nombre))
    })
  });

  const insert = () => ({
    values: (payload: PremioInsertPayload) => ({
      returning: () => {
        const row: PremioRow = {
          id: 'new-id',
          ...payload,
          activo: payload.activo ?? true
        };
        data.push(row);
        return [row];
      }
    })
  });

  const update = (_table: unknown) => ({
    set: (updates: Partial<PremioRow>) => ({
      where: (_predicate: unknown) => ({
        returning: () => {
          const idx = data.findIndex(r => r.id === 'p1');
          if (idx === -1) return [];
          const next: PremioRow = { ...data[idx], ...updates };
          data[idx] = next;
          return [next];
        }
      })
    })
  });

  const del = (_table: unknown) => ({
    where: (_predicate: unknown) => ({
      returning: (_options?: unknown) => {
        const idx = data.findIndex(r => r.id === 'p1');
        if (idx === -1) return [];
        const deleted = data.splice(idx, 1);
        return [{ id: deleted[0].id }];
      }
    })
  });

  return {
    select,
    insert,
    update,
    delete: del,
    _data: data
  };
}

/** Adaptador de prueba: el mock implementa solo la fraccion de la API de Drizzle que usan los handlers. */
function asDb(mock: ReturnType<typeof makeDb>): PremiosDeps['db'] {
  return mock as unknown as PremiosDeps['db'];
}

describe('createPremiosHttpHandlers', () => {
  it('lists all awards', async () => {
    const db = makeDb([
      { id: '1', nombre: 'B', descripcion: '', puntos_requeridos: 10, activo: true },
      { id: '2', nombre: 'A', descripcion: '', puntos_requeridos: 20, activo: true }
    ]);
    const handlers = createPremiosHttpHandlers({ db: asDb(db) });
    const result = await handlers.listPremios();
    expect(result).toHaveLength(2);
    expect(result[0].nombre).toBe('A');
  });

  it('denies creation for non-admin', async () => {
    const db = makeDb([]);
    const { status } = makeStatus();
    const handlers = createPremiosHttpHandlers({ db: asDb(db) });
    const auth = { sub: 'u1', rol: 'clienta' } as AuthJwtPayload;
    const set = { status: 0 };

    const result = await handlers.createPremio({
      auth,
      status,
      body: { nombre: 'P1', descripcion: '', puntos_requeridos: 10 },
      set
    });

    expect(result).toEqual({ code: 403, body: { error: 'forbidden' } });
  });

  it('allows admin to create award', async () => {
    const db = makeDb([]);
    const { status } = makeStatus();
    const handlers = createPremiosHttpHandlers({ db: asDb(db) });
    const auth = { sub: 'a1', rol: 'admin' } as AuthJwtPayload;
    const set = { status: 0 };

    const result = await handlers.createPremio({
      auth,
      status,
      body: { nombre: 'Premio Nuevo', descripcion: 'Desc', puntos_requeridos: 50 },
      set
    });

    expect(set.status).toBe(201);
    expect(result).toMatchObject({ nombre: 'Premio Nuevo' });
    expect(db._data).toHaveLength(1);
  });

  it('allows admin to patch award', async () => {
    const db = makeDb([{ id: 'p1', nombre: 'Old', descripcion: '', puntos_requeridos: 10, activo: true }]);
    const { status } = makeStatus();
    const handlers = createPremiosHttpHandlers({ db: asDb(db) });
    const auth = { sub: 'a1', rol: 'admin' } as AuthJwtPayload;
    const set = { status: 0 };

    const result = await handlers.patchPremio({
      auth,
      status,
      params: { id: 'p1' },
      body: { nombre: 'Updated', activo: false },
      set
    });

    expect(result).toMatchObject({ nombre: 'Updated', activo: false });
    expect(db._data[0].nombre).toBe('Updated');
  });

  it('allows admin to delete award', async () => {
    const db = makeDb([{ id: 'p1', nombre: 'To delete', descripcion: '', puntos_requeridos: 10, activo: true }]);
    const { status } = makeStatus();
    const handlers = createPremiosHttpHandlers({ db: asDb(db) });
    const auth = { sub: 'a1', rol: 'admin' } as AuthJwtPayload;
    const set = { status: 0 };

    const result = await handlers.deletePremio({
      auth,
      status,
      params: { id: 'p1' },
      set
    });

    expect(result).toMatchObject({ ok: true });
    expect(db._data).toHaveLength(0);
  });
});
