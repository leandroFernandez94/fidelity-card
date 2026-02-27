import { supabase } from './supabase';
import type { Referido } from '../types';

export const referidosService = {
  async getAll(): Promise<Referido[]> {
    const { data, error } = await supabase
      .from('referidos')
      .select('*')
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Referido | null> {
    const { data, error } = await supabase
      .from('referidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByReferente(referenteId: string): Promise<Referido[]> {
    const { data, error } = await supabase
      .from('referidos')
      .select('*')
      .eq('referente_id', referenteId)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(referido: Omit<Referido, 'id' | 'fecha'>): Promise<Referido> {
    const { data, error } = await supabase
      .from('referidos')
      .insert(referido)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
