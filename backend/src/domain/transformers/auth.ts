import type { PublicUser } from '../types/auth';
import { asIsoString } from './iso';

export function toPublicUser(row: { id: string; email: string; created_at: unknown }): PublicUser {
  return {
    id: row.id,
    email: row.email,
    created_at: asIsoString(row.created_at),
  };
}
