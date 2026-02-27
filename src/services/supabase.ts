import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nombre: string;
          apellido: string;
          telefono: string;
          email: string;
          rol: 'admin' | 'clienta';
          puntos: number;
          created_at: string;
        };
        Insert: {
          id: string;
          nombre: string;
          apellido: string;
          telefono: string;
          email: string;
          rol?: 'admin' | 'clienta';
          puntos?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          apellido?: string;
          telefono?: string;
          email?: string;
          rol?: 'admin' | 'clienta';
          puntos?: number;
          created_at?: string;
        };
      };
      servicios: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string;
          precio: number;
          duracion_min: number;
          puntos_otorgados: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion: string;
          precio: number;
          duracion_min: number;
          puntos_otorgados: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string;
          precio?: number;
          duracion_min?: number;
          puntos_otorgados?: number;
          created_at?: string;
        };
      };
      citas: {
        Row: {
          id: string;
          clienta_id: string;
          servicio_ids: string[];
          fecha_hora: string;
          puntos_ganados: number;
          estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
          notas?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clienta_id: string;
          servicio_ids: string[];
          fecha_hora: string;
          puntos_ganados?: number;
          estado?: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
          notas?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          clienta_id?: string;
          servicio_ids?: string[];
          fecha_hora?: string;
          puntos_ganados?: number;
          estado?: 'pending' | 'confirmada' | 'completada' | 'cancelada';
          notas?: string;
          created_at?: string;
        };
      };
      referidos: {
        Row: {
          id: string;
          referente_id: string;
          referida_id: string;
          puntos_ganados: number;
          fecha: string;
        };
        Insert: {
          id?: string;
          referente_id: string;
          referida_id: string;
          puntos_ganados: number;
          fecha?: string;
        };
        Update: {
          id?: string;
          referente_id?: string;
          referida_id?: string;
          puntos_ganados?: number;
          fecha?: string;
        };
      };
      recordatorios: {
        Row: {
          id: string;
          clienta_id: string;
          cita_id: string;
          enviado: boolean;
          fecha_envio: string;
        };
        Insert: {
          id?: string;
          clienta_id: string;
          cita_id: string;
          enviado?: boolean;
          fecha_envio?: string;
        };
        Update: {
          id?: string;
          clienta_id?: string;
          cita_id?: string;
          enviado?: boolean;
          fecha_envio?: string;
        };
      };
      premios: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string;
          puntos_requeridos: number;
          activo: boolean;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion: string;
          puntos_requeridos: number;
          activo?: boolean;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string;
          puntos_requeridos?: number;
          activo?: boolean;
        };
      };
    };
  };
};
