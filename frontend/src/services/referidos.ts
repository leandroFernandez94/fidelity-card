import { get, post } from './api';
import type { Referido } from '../types';

export const referidosService = {
  async getAll(): Promise<Referido[]> {
    return get<Referido[]>('/api/referidos');
  },

  async getById(id: string): Promise<Referido | null> {
    const referidos = await get<Referido[]>('/api/referidos');
    return referidos.find((referido) => referido.id === id) ?? null;
  },

  async getByReferente(referenteId: string): Promise<Referido[]> {
    return get<Referido[]>(`/api/referidos?referente_id=${referenteId}`);
  },

  async create(referido: Omit<Referido, 'id' | 'fecha'>): Promise<Referido> {
    return post<Referido>('/api/referidos', referido);
  }
};
