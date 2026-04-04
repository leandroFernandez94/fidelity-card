import { del, get, patch, post } from './api';
import type { Premio } from '@fidelity-card/shared';

export const premiosService = {
  async getAll(): Promise<Premio[]> {
    return get<Premio[]>('/api/premios');
  },

  async getById(id: string): Promise<Premio> {
    return get<Premio>(`/api/premios/${id}`);
  },

  async create(premio: Omit<Premio, 'id'>): Promise<Premio> {
    return post<Premio>('/api/premios', premio);
  },

  async update(id: string, updates: Partial<Premio>): Promise<Premio> {
    return patch<Premio>(`/api/premios/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    await del(`/api/premios/${id}`);
  }
};
