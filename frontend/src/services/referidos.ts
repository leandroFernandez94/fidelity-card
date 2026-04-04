import { get, post } from './api';
import type { Referido } from '@fidelity-card/shared';

export const referidosService = {
  async getAll(): Promise<Referido[]> {
    return get<Referido[]>('/api/referidos');
  },

  async getById(id: string): Promise<Referido> {
    return get<Referido>(`/api/referidos/${id}`);
  },

  async getByReferente(referenteId: string): Promise<Referido[]> {
    return get<Referido[]>(`/api/referidos?referente_id=${referenteId}`);
  },

  async create(referido: Omit<Referido, 'id' | 'fecha'>): Promise<Referido> {
    return post<Referido>('/api/referidos', referido);
  }
};
