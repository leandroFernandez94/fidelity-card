export type Rol = 'admin' | 'clienta';

export interface Profile {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  rol: Rol;
  puntos: number;
  created_at: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_min: number;
  puntos_otorgados: number;
  created_at: string;
}

export interface Cita {
  id: string;
  clienta_id: string;
  servicio_ids: string[];
  servicios?: Servicio[];
  fecha_hora: string;
  puntos_ganados: number;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  notas?: string;
  created_at: string;
}

export interface Referido {
  id: string;
  referente_id: string;
  referida_id: string;
  puntos_ganados: number;
  fecha: string;
}

export interface Recordatorio {
  id: string;
  clienta_id: string;
  cita_id: string;
  enviado: boolean;
  fecha_envio: string;
}

export interface Premio {
  id: string;
  nombre: string;
  descripcion: string;
  puntos_requeridos: number;
  activo: boolean;
}
