import { supabase } from './supabase';
import type { Profile, Cita, Servicio, Referido } from '../types';
import { serviciosService } from './servicios';

export const puntosService = {
  async sumarPuntos(profileId: string, cantidad: number): Promise<Profile> {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('puntos')
      .eq('id', profileId)
      .single();
    
    const nuevosPuntos = (perfil?.puntos || 0) + cantidad;
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ puntos: nuevosPuntos })
      .eq('id', profileId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async restarPuntos(profileId: string, cantidad: number): Promise<Profile> {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('puntos')
      .eq('id', profileId)
      .single();
    
    const nuevosPuntos = Math.max(0, (perfil?.puntos || 0) - cantidad);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ puntos: nuevosPuntos })
      .eq('id', profileId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async calcularPuntosCita(servicioIds: string[]): Promise<number> {
    let puntosTotal = 0;
    
    for (const servicioId of servicioIds) {
      const servicio = await serviciosService.getById(servicioId);
      if (servicio) {
        puntosTotal += servicio.puntos_otorgados;
      }
    }
    
    return puntosTotal;
  },

  async otorgarPuntosCita(cita: Cita): Promise<void> {
    if (cita.estado !== 'completada') return;
    
    const puntos = await this.calcularPuntosCita(cita.servicio_ids);
    await this.sumarPuntos(cita.clienta_id, puntos);
  },

  async otorgarPuntosReferido(referenteId: string, referidaId: string, puntos: number): Promise<Referido> {
    await this.sumarPuntos(referenteId, puntos);
    
    const { data, error } = await supabase
      .from('referidos')
      .insert({
        referente_id: referenteId,
        referida_id: referidaId,
        puntos_ganados: puntos,
        fecha: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getTopClientas(limite: number = 10): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('rol', 'clienta')
      .order('puntos', { ascending: false })
      .limit(limite);
    
    if (error) throw error;
    return data;
  }
};
