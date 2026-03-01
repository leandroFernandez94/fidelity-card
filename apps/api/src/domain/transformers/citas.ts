import type { PublicCita } from '../types/citas';
import { asIsoString } from './iso';

export function toPublicCita(row: {
  id: string;
  clienta_id: string;
  servicio_ids: string[];
  fecha_hora: unknown;
  puntos_ganados: number;
  puntos_utilizados: number;
  estado: unknown;
  notas: string | null;
  created_at: unknown;
}): PublicCita {
  return {
    id: row.id,
    clienta_id: row.clienta_id,
    servicio_ids: row.servicio_ids,
    fecha_hora: asIsoString(row.fecha_hora),
    puntos_ganados: row.puntos_ganados,
    puntos_utilizados: row.puntos_utilizados,
    estado: String(row.estado) as PublicCita['estado'],
    notas: row.notas ?? undefined,
    created_at: asIsoString(row.created_at),
  };
}
