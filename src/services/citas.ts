import { supabase } from './supabase';
import type { Cita, Servicio } from '../types';

export const citasService = {
  async getAll(): Promise<Cita[]> {
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .order('fecha_hora', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Cita | null> {
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByClienta(clientaId: string): Promise<Cita[]> {
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .eq('clienta_id', clientaId)
      .order('fecha_hora', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(cita: Omit<Cita, 'id' | 'created_at'>): Promise<Cita> {
    const { data, error } = await supabase
      .from('citas')
      .insert(cita)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Cita>): Promise<Cita> {
    const { data, error } = await supabase
      .from('citas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('citas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getProximas(fecha: Date = new Date()): Promise<Cita[]> {
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .gte('fecha_hora', fecha.toISOString())
      .order('fecha_hora', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getPendientes(): Promise<Cita[]> {
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .in('estado', ['pendiente', 'confirmada'])
      .order('fecha_hora', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};
