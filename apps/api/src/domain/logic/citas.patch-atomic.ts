import type { CitaEstado } from '../types/citas';

export type CitaPatchRow = {
  id: string;
  clienta_id: string;
  puntos_ganados: number;
  estado: CitaEstado;
  notas: string | null;
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
};

export async function patchCitaAtomic(params: {
  tx: CitasPatchAtomicTx;
  citaId: string;
  nextEstado?: CitaEstado;
  nextNotas?: string;
  awardPoints: boolean;
}): Promise<CitaPatchRow | null> {
  const { tx, citaId, nextEstado, nextNotas, awardPoints } = params;

  const updates: CitaPatchUpdates = {};
  if (nextEstado) updates.estado = nextEstado;
  if (nextNotas !== undefined) updates.notas = nextNotas;

  if (awardPoints && nextEstado === 'completada') {
    const updated = await tx.updateCitaIfEstadoIn(citaId, ['pendiente', 'confirmada'], {
      ...updates,
      estado: 'completada',
    });

    if (!updated) return null;

    await tx.incrementProfilePoints(updated.clienta_id, updated.puntos_ganados);
    return updated;
  }

  return tx.updateCita(citaId, updates);
}
