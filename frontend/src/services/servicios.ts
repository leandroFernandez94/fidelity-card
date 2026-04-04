import { del, get, patch, post } from './api';
import type { Servicio } from '@fidelity-card/shared';

export const serviciosService = {
  async getAll(): Promise<Servicio[]> {
    return get<Servicio[]>('/api/servicios');
  },

  async getById(id: string): Promise<Servicio> {
    return get<Servicio>(`/api/servicios/${id}`);
  },

  async create(servicio: Omit<Servicio, 'id' | 'created_at'>): Promise<Servicio> {
    return post<Servicio>('/api/servicios', servicio);
  },

  async update(id: string, updates: Partial<Servicio>): Promise<Servicio> {
    return patch<Servicio>(`/api/servicios/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    await del(`/api/servicios/${id}`);
  }
};
