export type CitaEstado = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';

export type CitaItem = {
  servicio_id: string;
  tipo: 'comprado' | 'canjeado';
};

export type PublicCita = {
  id: string;
  clienta_id: string;
  servicio_ids: string[];
  items?: CitaItem[];
  fecha_hora: string;
  puntos_ganados: number;
  puntos_utilizados: number;
  estado: CitaEstado;
  notas?: string;
  created_at: string;
};
