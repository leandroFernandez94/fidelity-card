import type { Servicio } from '@fidelity-card/shared';

/**
 * PublicServicio derives from the shared Servicio but with sanitized fields:
 * - descripcion: always string (nulls converted to '' by the transformer)
 * - puntos_requeridos: optional (backend omits it when null in DB)
 */
export type PublicServicio = Omit<Servicio, 'descripcion' | 'puntos_requeridos'> & {
  descripcion: string;
  puntos_requeridos?: number | null;
};
