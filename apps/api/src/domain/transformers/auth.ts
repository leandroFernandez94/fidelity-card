import type { PublicProfile, PublicUser, Rol } from '../types/auth';
import { asIsoString } from './iso';

export function toPublicUser(row: { id: string; email: string; created_at: unknown }): PublicUser {
  return {
    id: row.id,
    email: row.email,
    created_at: asIsoString(row.created_at),
  };
}

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
