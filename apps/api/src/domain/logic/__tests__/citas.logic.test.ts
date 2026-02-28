import { describe, expect, it } from 'vitest';

import { decideCitaPatch } from '../citas';
import type { CitaEstado } from '../../types/citas';

describe('decideCitaPatch', () => {
  it('clienta can confirm pending', () => {
    const res = decideCitaPatch({
      actorRole: 'clienta',
      currentEstado: 'pendiente',
      intent: { estado: 'confirmada' },
    });
    expect(res).toEqual({ ok: true, nextEstado: 'confirmada', allowNotas: false, awardPoints: false });
  });

  it('clienta can cancel pending', () => {
    const res = decideCitaPatch({
      actorRole: 'clienta',
      currentEstado: 'pendiente',
      intent: { estado: 'cancelada' },
    });
    expect(res).toEqual({ ok: true, nextEstado: 'cancelada', allowNotas: false, awardPoints: false });
  });

  it('clienta cannot change non-pending', () => {
    const estados: CitaEstado[] = ['confirmada', 'completada', 'cancelada'];
    for (const currentEstado of estados) {
      const res = decideCitaPatch({
        actorRole: 'clienta',
        currentEstado,
        intent: { estado: 'cancelada' },
      });
      expect(res.ok).toBe(false);
    }
  });

  it('clienta cannot set completada', () => {
    const res = decideCitaPatch({
      actorRole: 'clienta',
      currentEstado: 'pendiente',
      intent: { estado: 'completada' },
    });
    expect(res).toEqual({ ok: false, error: 'forbidden_transition' });
  });

  it('clienta cannot patch notas', () => {
    const res = decideCitaPatch({
      actorRole: 'clienta',
      currentEstado: 'pendiente',
      intent: { notas: 'hola' },
    });
    expect(res).toEqual({ ok: false, error: 'forbidden_notas' });
  });

  it('admin can cancel pending/confirmada', () => {
    for (const currentEstado of ['pendiente', 'confirmada'] as const) {
      const res = decideCitaPatch({
        actorRole: 'admin',
        currentEstado,
        intent: { estado: 'cancelada' },
      });
      expect(res).toEqual({ ok: true, nextEstado: 'cancelada', allowNotas: true, awardPoints: false });
    }
  });

  it('admin can complete pending/confirmada and awards points', () => {
    for (const currentEstado of ['pendiente', 'confirmada'] as const) {
      const res = decideCitaPatch({
        actorRole: 'admin',
        currentEstado,
        intent: { estado: 'completada' },
      });
      expect(res).toEqual({ ok: true, nextEstado: 'completada', allowNotas: true, awardPoints: true });
    }
  });

  it('admin cannot set confirmada', () => {
    const res = decideCitaPatch({
      actorRole: 'admin',
      currentEstado: 'pendiente',
      intent: { estado: 'confirmada' },
    });
    expect(res).toEqual({ ok: false, error: 'forbidden_transition' });
  });

  it('cannot change final states', () => {
    const res = decideCitaPatch({
      actorRole: 'admin',
      currentEstado: 'completada',
      intent: { estado: 'cancelada' },
    });
    expect(res).toEqual({ ok: false, error: 'final_state' });
  });
});
