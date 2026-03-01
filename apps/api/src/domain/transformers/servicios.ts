import type { PublicServicio } from '../types/servicios';
import { asIsoString } from './iso';


export function toPublicServicio(row: {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_min: number;
  puntos_otorgados: number;
  puntos_requeridos?: number | null;
  created_at: unknown;
}): PublicServicio {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion || '',
    precio: row.precio,
    duracion_min: row.duracion_min,
    puntos_otorgados: row.puntos_otorgados,
    puntos_requeridos: row.puntos_requeridos,
    created_at: asIsoString(row.created_at),
  };
}
