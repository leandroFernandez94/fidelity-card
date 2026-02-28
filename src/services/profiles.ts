import { get, patch } from './api';
import type { Profile } from '../types';

export const profilesService = {
  async getAll(): Promise<Profile[]> {
    return get<Profile[]>('/api/profiles');
  },

  async getById(id: string): Promise<Profile | null> {
    return get<Profile>(`/api/profiles/${id}`);
  },

  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    return patch<Profile>(`/api/profiles/${id}`, updates);
  },

  async getByRol(rol: 'admin' | 'clienta'): Promise<Profile[]> {
    return get<Profile[]>(`/api/profiles?rol=${rol}`);
  }
};
