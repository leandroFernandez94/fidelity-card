import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCitasHttpHandlers, type CitasDeps } from '../modules/citas.handlers';
import type { AuthJwtPayload } from '../modules/auth-context';

// ---------------------------------------------------------------------------
// Drizzle-style mock DB factory
// ---------------------------------------------------------------------------

function createMockDb() {
  const results: unknown[] = [];
  let selectIdx = 0;

  function next(): unknown {
    return results[selectIdx++] ?? [];
  }

  // select().from(table).where(cond)           → thenable (also has .limit, .orderBy)
  // select().from(table).where(cond).limit(n)  → Promise<Row[]>
  // select().from(table).where(cond).orderBy() → Promise<Row[]>
  // select().from(table).orderBy()             → Promise<Row[]>
  function selectChain() {
    const result = next();
    // .where() returns a Promise that also has .limit() and .orderBy()
    const whereResult = Object.assign(Promise.resolve(result), {
      limit: () => Promise.resolve(result),
      orderBy: () => Promise.resolve(result),
    });
    return {
      from: () => ({
        where: () => whereResult,
        orderBy: () => Promise.resolve(result),
      }),
    };
  }

  // insert(table).values(data)            → Promise + .returning() → Promise<Row[]>
  // Lazy: only consumes a result slot when .returning() is actually called.
  function insertChain() {
    return {
      values: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const thenable: any = Promise.resolve(undefined);
        thenable.returning = () => Promise.resolve(next());
        return thenable;
      },
    };
  }

  // update(table).set(data).where(cond).returning() → Promise<Row[]>
  // Lazy: only consumes a result slot when .returning() is actually called.
  function updateChain() {
    return {
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve(next()),
        }),
      }),
    };
  }

  // delete(table).where(cond) → Promise
  function deleteChain() {
    return { where: () => Promise.resolve(undefined) };
  }

  const db = {
    select: vi.fn(selectChain),
    insert: vi.fn(insertChain),
    update: vi.fn(updateChain),
    delete: vi.fn(deleteChain),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => {
      const tx = {
        select: vi.fn(selectChain),
        insert: vi.fn(insertChain),
        update: vi.fn(updateChain),
        delete: vi.fn(deleteChain),
      };
      return fn(tx);
    }),
    __push(...items: unknown[]) {
      results.push(...items);
      return db;
    },
    __reset() {
      results.length = 0;
      selectIdx = 0;
    },
  };

  return db;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ADMIN_JWT: AuthJwtPayload = { sub: 'admin-001', rol: 'admin' };
const CLIENTA_JWT: AuthJwtPayload = { sub: 'clienta-001', rol: 'clienta' };

const CITA_ROW = {
  id: 'cita-001',
  clienta_id: 'clienta-001',
  servicio_ids: ['serv-001'],
  fecha_hora: new Date('2026-05-01T10:00:00Z'),
  puntos_ganados: 10,
  puntos_utilizados: 0,
  estado: 'pendiente',
  notas: null,
  created_at: new Date('2026-04-01T00:00:00Z'),
};

const CITA_ROW_COMPLETED = { ...CITA_ROW, id: 'cita-002', estado: 'completada' };
const CITA_ROW_CANCELLED = { ...CITA_ROW, id: 'cita-003', estado: 'cancelada' };

const ITEMS_ROWS = [
  { cita_id: 'cita-001', servicio_id: 'serv-001', tipo: 'comprado', puntos_requeridos_snapshot: 0, puntos_otorgados_snapshot: 10 },
];

const SERVICIO_MASTER = {
  id: 'serv-001',
  puntos_requeridos: null,
  puntos_otorgados: 10,
};

const SERVICIO_CANJE_MASTER = {
  id: 'serv-002',
  puntos_requeridos: 50,
  puntos_otorgados: 0,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getCita handler', () => {
  let db: ReturnType<typeof createMockDb>;
  let handlers: ReturnType<typeof createCitasHttpHandlers>;

  beforeEach(() => {
    db = createMockDb();
    handlers = createCitasHttpHandlers({ db: db as unknown as CitasDeps['db'] });
  });

  it('returns 401 when not authenticated', async () => {
    const set: Record<string, unknown> = {};
    const result = await handlers.getCita({
      auth: null,
      params: { id: 'cita-001' },
      set,
    });

    expect(set.status).toBe(401);
    expect(result).toEqual({ error: 'unauthorized' });
  });

  it('returns 404 for non-existent cita', async () => {
    db.__push([]); // select from citas → empty

    const set: Record<string, unknown> = {};
    const result = await handlers.getCita({
      auth: ADMIN_JWT,
      params: { id: 'non-existent' },
      set,
    });

    expect(set.status).toBe(404);
    expect(result).toEqual({ error: 'not_found' });
  });

  it('allows admin to get any cita', async () => {
    db.__push([CITA_ROW]);    // select from citas
    db.__push(ITEMS_ROWS);    // select from citaServicios

    const set: Record<string, unknown> = {};
    const result = await handlers.getCita({
      auth: ADMIN_JWT,
      params: { id: 'cita-001' },
      set,
    }) as Record<string, unknown>;

    expect(set.status).toBeUndefined();
    expect(result.id).toBe('cita-001');
    expect(result.clienta_id).toBe('clienta-001');
    expect(result.estado).toBe('pendiente');
  });

  it('returns items from citaServicios', async () => {
    db.__push([CITA_ROW]);    // select from citas
    db.__push(ITEMS_ROWS);    // select from citaServicios

    const result = await handlers.getCita({
      auth: ADMIN_JWT,
      params: { id: 'cita-001' },
      set: {},
    }) as Record<string, unknown>;

    expect(result.items).toEqual([
      { servicio_id: 'serv-001', tipo: 'comprado' },
    ]);
  });

  it('returns 403 when clienta tries to access another clienta cita', async () => {
    db.__push([{ ...CITA_ROW, clienta_id: 'other-clienta' }]); // select from citas
    // No need to push items — we return before that

    const set: Record<string, unknown> = {};
    const result = await handlers.getCita({
      auth: CLIENTA_JWT,
      params: { id: 'cita-001' },
      set,
    });

    expect(set.status).toBe(403);
    expect(result).toEqual({ error: 'forbidden' });
  });

  it('allows clienta to get her own cita', async () => {
    db.__push([CITA_ROW]);    // select from citas
    db.__push(ITEMS_ROWS);    // select from citaServicios

    const result = await handlers.getCita({
      auth: CLIENTA_JWT,
      params: { id: 'cita-001' },
      set: {},
    }) as Record<string, unknown>;

    expect(result.id).toBe('cita-001');
    expect(result.items).toEqual([
      { servicio_id: 'serv-001', tipo: 'comprado' },
    ]);
  });
});

describe('putCita handler', () => {
  let db: ReturnType<typeof createMockDb>;
  let handlers: ReturnType<typeof createCitasHttpHandlers>;

  beforeEach(() => {
    db = createMockDb();
    handlers = createCitasHttpHandlers({ db: db as unknown as CitasDeps['db'] });
  });

  it('returns 403 for non-admin', async () => {
    const set: Record<string, unknown> = {};
    const result = await handlers.putCita({
      auth: CLIENTA_JWT,
      status: { code: vi.fn() },
      params: { id: 'cita-001' },
      body: {
        items: [{ servicio_id: 'serv-001', tipo: 'comprado' as const }],
        fecha_hora: '2026-05-01T10:00:00Z',
      },
      set,
    });

    expect(set.status).toBe(403);
    expect(result).toEqual({ error: 'forbidden' });
  });

  it('returns 404 for non-existent cita', async () => {
    db.__push([]); // select from citas → empty

    const set: Record<string, unknown> = {};
    const result = await handlers.putCita({
      auth: ADMIN_JWT,
      status: { code: vi.fn() },
      params: { id: 'non-existent' },
      body: {
        items: [{ servicio_id: 'serv-001', tipo: 'comprado' as const }],
        fecha_hora: '2026-05-01T10:00:00Z',
      },
      set,
    });

    expect(set.status).toBe(404);
    expect(result).toEqual({ error: 'not_found' });
  });

  it('rejects update on completed cita', async () => {
    db.__push([CITA_ROW_COMPLETED]); // select from citas → completed

    const set: Record<string, unknown> = {};
    const result = await handlers.putCita({
      auth: ADMIN_JWT,
      status: { code: vi.fn() },
      params: { id: 'cita-002' },
      body: {
        items: [{ servicio_id: 'serv-001', tipo: 'comprado' as const }],
        fecha_hora: '2026-05-01T10:00:00Z',
      },
      set,
    });

    expect(set.status).toBe(403);
    expect(result).toEqual({ error: 'final_state' });
  });

  it('rejects update on cancelled cita', async () => {
    db.__push([CITA_ROW_CANCELLED]); // select from citas → cancelled

    const set: Record<string, unknown> = {};
    const result = await handlers.putCita({
      auth: ADMIN_JWT,
      status: { code: vi.fn() },
      params: { id: 'cita-003' },
      body: {
        items: [{ servicio_id: 'serv-001', tipo: 'comprado' as const }],
        fecha_hora: '2026-05-01T10:00:00Z',
      },
      set,
    });

    expect(set.status).toBe(403);
    expect(result).toEqual({ error: 'final_state' });
  });

  it('returns 400 when items is empty', async () => {
    db.__push([CITA_ROW]); // select from citas → exists

    const set: Record<string, unknown> = {};
    const result = await handlers.putCita({
      auth: ADMIN_JWT,
      status: { code: vi.fn() },
      params: { id: 'cita-001' },
      body: {
        items: [],
        fecha_hora: '2026-05-01T10:00:00Z',
      },
      set,
    });

    expect(set.status).toBe(400);
    expect(result).toEqual({ error: 'items_required' });
  });

  it('admin can update items and recalculates points', async () => {
    // 1. select from citas → existing pendiente
    db.__push([CITA_ROW]);
    // 2. select from servicios → masters (one comprado + one canjeado)
    db.__push([SERVICIO_MASTER, SERVICIO_CANJE_MASTER]);
    // 3. transaction → tx.update returning updated row
    const updatedRow = {
      ...CITA_ROW,
      servicio_ids: ['serv-001', 'serv-002'],
      puntos_ganados: 10,   // serv-001 comprado → 10 pts
      puntos_utilizados: 50, // serv-002 canjeado → 50 pts
    };
    db.__push([updatedRow]); // tx.update returning

    const set: Record<string, unknown> = {};
    const result = await handlers.putCita({
      auth: ADMIN_JWT,
      status: { code: vi.fn() },
      params: { id: 'cita-001' },
      body: {
        items: [
          { servicio_id: 'serv-001', tipo: 'comprado' as const },
          { servicio_id: 'serv-002', tipo: 'canjeado' as const },
        ],
        fecha_hora: '2026-05-02T14:00:00Z',
        notas: 'Actualizada',
      },
      set,
    }) as Record<string, unknown>;

    expect(set.status).toBeUndefined(); // no error status set
    expect(result.id).toBe('cita-001');
    expect(result.puntos_ganados).toBe(10);
    expect(result.puntos_utilizados).toBe(50);
    expect(result.items).toEqual([
      { servicio_id: 'serv-001', tipo: 'comprado' },
      { servicio_id: 'serv-002', tipo: 'canjeado' },
    ]);
    // Transaction was called (delete old items + insert new + update cita)
    expect(db.transaction).toHaveBeenCalled();
  });

  it('recalculates points with only comprado items', async () => {
    // 1. select from citas
    db.__push([CITA_ROW]);
    // 2. select from servicios
    db.__push([SERVICIO_MASTER]);
    // 3. tx.update returning
    const updatedRow = {
      ...CITA_ROW,
      puntos_ganados: 10,
      puntos_utilizados: 0,
    };
    db.__push([updatedRow]);

    const result = await handlers.putCita({
      auth: ADMIN_JWT,
      status: { code: vi.fn() },
      params: { id: 'cita-001' },
      body: {
        items: [{ servicio_id: 'serv-001', tipo: 'comprado' as const }],
        fecha_hora: '2026-05-01T10:00:00Z',
      },
      set: {},
    }) as Record<string, unknown>;

    expect(result.puntos_ganados).toBe(10);
    expect(result.puntos_utilizados).toBe(0);
  });

  it('recalculates points with only canjeado items', async () => {
    // 1. select from citas
    db.__push([CITA_ROW]);
    // 2. select from servicios → canjeado master
    db.__push([SERVICIO_CANJE_MASTER]);
    // 3. tx.update returning
    const updatedRow = {
      ...CITA_ROW,
      servicio_ids: ['serv-002'],
      puntos_ganados: 0,
      puntos_utilizados: 50,
    };
    db.__push([updatedRow]);

    const result = await handlers.putCita({
      auth: ADMIN_JWT,
      status: { code: vi.fn() },
      params: { id: 'cita-001' },
      body: {
        items: [{ servicio_id: 'serv-002', tipo: 'canjeado' as const }],
        fecha_hora: '2026-05-01T10:00:00Z',
      },
      set: {},
    }) as Record<string, unknown>;

    expect(result.puntos_ganados).toBe(0);
    expect(result.puntos_utilizados).toBe(50);
  });
});
