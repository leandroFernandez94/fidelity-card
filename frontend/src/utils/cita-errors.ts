import { ApiError } from '../services/api';

export function resolveCitaUpdateError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'No se pudo actualizar la cita. Intenta nuevamente.';
  }

  const details = error.details;
  const code = typeof details === 'object' && details !== null
    ? (details as Record<string, unknown>).error
    : null;

  if (code === 'final_state') return 'La cita ya esta finalizada y no se puede modificar.';
  if (code === 'no_state_change') return 'La cita ya esta en ese estado.';
  if (code === 'forbidden_transition') return 'No se puede cambiar el estado desde la situacion actual.';
  if (code === 'conflict') return 'La cita se actualizo recientemente. Recarga e intenta de nuevo.';
  if (code === 'forbidden_notas') return 'No tienes permisos para editar notas.';
  if (code === 'unauthorized') return 'Necesitas iniciar sesion para continuar.';

  return error.message || 'No se pudo actualizar la cita. Intenta nuevamente.';
}
