import { get, post } from './api';
import type { Profile } from '@fidelity-card/shared';

export const puntosService = {
  async sumarPuntos(profileId: string, cantidad: number): Promise<Profile> {
    return post<Profile>('/api/puntos/sumar', {
      profile_id: profileId,
      cantidad
    });
  },

  async restarPuntos(profileId: string, cantidad: number): Promise<Profile> {
    return post<Profile>('/api/puntos/restar', {
      profile_id: profileId,
      cantidad
    });
  },

  async getTopClientas(limite: number = 10): Promise<Profile[]> {
    return get<Profile[]>(`/api/puntos/top?limit=${limite}`);
  }
};
