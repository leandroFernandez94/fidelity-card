import type { CitaEstado } from '../types/citas';

export type CitaActorRole = 'admin' | 'clienta';

export type CitaPatchIntent = {
  estado?: CitaEstado;
  notas?: string;
};

export type CitaPatchDecision =
  | {
      ok: true;
      nextEstado?: CitaEstado;
      allowNotas: boolean;
      awardPoints: boolean;
    }
  | {
      ok: false;
      error:
        | 'forbidden_notas'
        | 'forbidden_transition'
        | 'final_state'
        | 'no_state_change';
    };

const finalEstados: ReadonlySet<CitaEstado> = new Set(['completada', 'cancelada']);

export function decideCitaPatch(params: {
  actorRole: CitaActorRole;
  currentEstado: CitaEstado;
  intent: CitaPatchIntent;
}): CitaPatchDecision {
  const { actorRole, currentEstado, intent } = params;

  const wantsEstado = intent.estado !== undefined;
  const wantsNotas = intent.notas !== undefined;

  if (actorRole === 'clienta' && wantsNotas) {
    return { ok: false, error: 'forbidden_notas' };
  }

  if (finalEstados.has(currentEstado)) {
    if (wantsEstado && intent.estado !== currentEstado) {
      return { ok: false, error: 'final_state' };
    }
  }

  if (!wantsEstado) {
    return {
      ok: true,
      allowNotas: actorRole === 'admin',
      awardPoints: false,
    };
  }

  const requested = intent.estado;
  if (!requested) {
    return {
      ok: true,
      allowNotas: actorRole === 'admin',
      awardPoints: false,
    };
  }

  if (requested === currentEstado) {
    return { ok: false, error: 'no_state_change' };
  }

  if (actorRole === 'clienta') {
    if (currentEstado !== 'pendiente') {
      return { ok: false, error: 'forbidden_transition' };
    }
    if (requested !== 'confirmada' && requested !== 'cancelada') {
      return { ok: false, error: 'forbidden_transition' };
    }
    return {
      ok: true,
      nextEstado: requested,
      allowNotas: false,
      awardPoints: false,
    };
  }

  // Admin rules:
  // - Can cancel or complete from pendiente/confirmada.
  // - Cannot set confirmada (client responsibility).
  // - Cannot change final states.
  if (currentEstado !== 'pendiente' && currentEstado !== 'confirmada') {
    return { ok: false, error: 'final_state' };
  }

  if (requested !== 'cancelada' && requested !== 'completada') {
    return { ok: false, error: 'forbidden_transition' };
  }

  return {
    ok: true,
    nextEstado: requested,
    allowNotas: true,
    awardPoints: requested === 'completada',
  };
}
