export type PublicServicio = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_min: number;
  puntos_otorgados: number;
  puntos_requeridos?: number | null;
  created_at: string;
};
