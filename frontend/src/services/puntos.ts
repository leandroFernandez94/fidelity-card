import { get, post } from './api';
import type { Profile, Cita, Referido } from '../types';
import { serviciosService } from './servicios';

export const puntosService = {
  async sumarPuntos(profileId: string, cantidad: number): Promise<Profile> {
    return post<Profile>('/api/puntos/sumar', {
      profile_id: profileId,
      cantidad
    });
  },

  async restarPuntos(profileId: string, cantidad: number): Promise<Profile> {
    return post<Profile>('/api/puntos/restar', {
      profile_id: profileId,
      cantidad
    });
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
    return post<Referido>('/api/referidos', {
      referente_id: referenteId,
      referida_id: referidaId,
      puntos_ganados: puntos
    });
  },

  async getTopClientas(limite: number = 10): Promise<Profile[]> {
    return get<Profile[]>(`/api/puntos/top?limit=${limite}`);
  }
};
