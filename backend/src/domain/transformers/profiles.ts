import type { PublicProfile, Rol } from '../types/auth';
import { asIsoString } from './iso';

export function toPublicProfile(row: {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  rol: Rol;
  puntos: number;
  created_at: unknown;
}): PublicProfile {
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    telefono: row.telefono,
    email: row.email,
    rol: row.rol,
    puntos: row.puntos,
    created_at: asIsoString(row.created_at),
  };
}
