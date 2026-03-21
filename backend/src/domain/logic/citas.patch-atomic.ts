import type { CitaEstado } from '../types/citas';

export type CitaPatchRow = {
  id: string;
  clienta_id: string;
  servicio_ids: string[];
  fecha_hora: unknown;
  puntos_ganados: number;
  puntos_utilizados: number;
  estado: CitaEstado;
  notas: string | null;
  created_at: unknown;
};

export type CitaPatchUpdates = {
  estado?: CitaEstado;
  notas?: string;
};

export type CitasPatchAtomicTx = {
  updateCita: (id: string, updates: CitaPatchUpdates) => Promise<CitaPatchRow | null>;
  updateCitaIfEstadoIn: (
    id: string,
    allowedEstados: readonly CitaEstado[],
    updates: CitaPatchUpdates & { estado: CitaEstado }
  ) => Promise<CitaPatchRow | null>;
  incrementProfilePoints: (profileId: string, delta: number) => Promise<void>;
  decrementProfilePoints: (profileId: string, delta: number) => Promise<void>;
};

export async function patchCitaAtomic(params: {
  tx: CitasPatchAtomicTx;
  citaId: string;
  nextEstado?: CitaEstado;
  nextNotas?: string;
  awardPoints: boolean;
  saldo_actual?: number;
}): Promise<CitaPatchRow | null> {
  const { tx, citaId, nextEstado, nextNotas, awardPoints, saldo_actual } = params;

  const updates: CitaPatchUpdates = {};
  if (nextEstado) updates.estado = nextEstado;
  if (nextNotas !== undefined) updates.notas = nextNotas;

  if (awardPoints && nextEstado === 'completada') {
    const updated = await tx.updateCitaIfEstadoIn(citaId, ['pendiente', 'confirmada'], {
      ...updates,
      estado: 'completada',
    });

    if (!updated) return null;

    if (updated.puntos_utilizados > 0) {
      if (saldo_actual !== undefined && saldo_actual < updated.puntos_utilizados) {
        throw new Error('insufficient_points');
      }
      await tx.decrementProfilePoints(updated.clienta_id, updated.puntos_utilizados);
    }

    await tx.incrementProfilePoints(updated.clienta_id, updated.puntos_ganados);
    return updated;
  }

  return tx.updateCita(citaId, updates);
}
