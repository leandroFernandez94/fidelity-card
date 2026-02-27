import { supabase } from './supabase';
import type { Servicio } from '../types';

export const serviciosService = {
  async getAll(): Promise<Servicio[]> {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Servicio | null> {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(servicio: Omit<Servicio, 'id' | 'created_at'>): Promise<Servicio> {
    const { data, error } = await supabase
      .from('servicios')
      .insert(servicio)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Servicio>): Promise<Servicio> {
    const { data, error } = await supabase
      .from('servicios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('servicios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
