import type { PublicPremio } from '../types/premios';

export function toPublicPremio(row: {
  id: string;
  nombre: string;
  descripcion: string | null;
  puntos_requeridos: number;
  activo: boolean;
}): PublicPremio {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion || '',
    puntos_requeridos: row.puntos_requeridos,
    activo: row.activo,
  };
}
