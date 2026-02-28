import type { PublicReferido } from '../types/referidos';
import { asIsoString } from './iso';

export function toPublicReferido(row: {
  id: string;
  referente_id: string;
  referida_id: string;
  puntos_ganados: number;
  fecha: unknown;
}): PublicReferido {
  return {
    id: row.id,
    referente_id: row.referente_id,
    referida_id: row.referida_id,
    puntos_ganados: row.puntos_ganados,
    fecha: asIsoString(row.fecha),
  };
}
