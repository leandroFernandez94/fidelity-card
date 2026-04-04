import type { Cita, CitaItem, CitaEstado } from '@fidelity-card/shared';

export type { CitaItem, CitaEstado };

export type PublicCita = Omit<Cita, 'servicios'>;
