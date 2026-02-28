import { del, get, patch, post } from './api';
import type { Cita } from '../types';

type CitaCreateInput = {
  clienta_id?: string;
  servicio_ids: string[];
  fecha_hora: string;
  puntos_ganados: number;
  notas?: string;
};

export const citasService = {
  async getAll(): Promise<Cita[]> {
    return get<Cita[]>('/api/citas');
  },

  async getById(id: string): Promise<Cita | null> {
    const citas = await get<Cita[]>('/api/citas');
    return citas.find((cita) => cita.id === id) ?? null;
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
