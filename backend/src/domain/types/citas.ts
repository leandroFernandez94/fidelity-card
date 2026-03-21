export type CitaEstado = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';

export type PublicCita = {
  id: string;
  clienta_id: string;
  servicio_ids: string[];
  fecha_hora: string;
  puntos_ganados: number;
  puntos_utilizados: number;
  estado: CitaEstado;
  notas?: string;
  created_at: string;
};
