import { del, get, patch, post, put } from './api';
import type { Cita, CitaItemInput, CitaCreateInput } from '@fidelity-card/shared';

export const citasService = {
  async getAll(): Promise<Cita[]> {
    return get<Cita[]>('/api/citas');
  },

  async getById(id: string): Promise<Cita> {
    return get<Cita>(`/api/citas/${id}`);
  },

  async getByClienta(clientaId: string): Promise<Cita[]> {
    return get<Cita[]>(`/api/citas?clienta_id=${clientaId}`);
  },

  async create(cita: CitaCreateInput): Promise<Cita> {
    return post<Cita>('/api/citas', cita);
  },

  async update(id: string, updates: Partial<Cita>): Promise<Cita> {
    return patch<Cita>(`/api/citas/${id}`, updates);
  },

  async updateFull(id: string, data: {
    items: CitaItemInput[];
    fecha_hora: string;
    notas?: string;
  }): Promise<Cita> {
    return put<Cita>(`/api/citas/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await del(`/api/citas/${id}`);
  },

  async getProximas(fecha: Date = new Date()): Promise<Cita[]> {
    const citas = await get<Cita[]>('/api/citas/proximas');
    const limite = fecha.toISOString();
    return citas.filter((cita) => cita.fecha_hora >= limite);
  },

  async getPendientes(): Promise<Cita[]> {
    return get<Cita[]>('/api/citas/pendientes');
  }
};
