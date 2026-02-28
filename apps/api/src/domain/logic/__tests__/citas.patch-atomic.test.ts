import { describe, expect, it } from 'vitest';

import { patchCitaAtomic, type CitaPatchRow, type CitasPatchAtomicTx } from '../citas.patch-atomic';

describe('patchCitaAtomic', () => {
  it('awards points when transitioning to completada', async () => {
    const state = {
      cita: {
        id: 'cita-1',
        clienta_id: 'clienta-1',
        puntos_ganados: 20,
        estado: 'pendiente',
        notas: null,
      } satisfies CitaPatchRow,
      puntos: 10,
    };

    const tx: CitasPatchAtomicTx = {
      async updateCita() {
        throw new Error('unexpected');
      },
      async updateCitaIfEstadoIn(id, allowed, updates) {
        if (id !== state.cita.id) return null;
        if (!allowed.includes(state.cita.estado)) return null;
        state.cita = { ...state.cita, ...updates };
        return state.cita;
      },
      async incrementProfilePoints(_profileId, delta) {
        state.puntos += delta;
      },
    };

    const updated = await patchCitaAtomic({
      tx,
      citaId: 'cita-1',
      nextEstado: 'completada',
      awardPoints: true,
    });

    expect(updated?.estado).toBe('completada');
    expect(state.puntos).toBe(30);
  });

  it('does not award points if guarded update does not apply', async () => {
    const state = {
      cita: {
        id: 'cita-1',
        clienta_id: 'clienta-1',
        puntos_ganados: 20,
        estado: 'cancelada',
        notas: null,
      } satisfies CitaPatchRow,
      puntos: 10,
    };

    const tx: CitasPatchAtomicTx = {
      async updateCita() {
        throw new Error('unexpected');
      },
      async updateCitaIfEstadoIn(id, allowed) {
        if (id !== state.cita.id) return null;
        if (!allowed.includes(state.cita.estado)) return null;
        throw new Error('unexpected');
      },
      async incrementProfilePoints() {
        state.puntos += 999;
      },
    };

    const updated = await patchCitaAtomic({
      tx,
      citaId: 'cita-1',
      nextEstado: 'completada',
      awardPoints: true,
    });

    expect(updated).toBeNull();
    expect(state.puntos).toBe(10);
  });
});
