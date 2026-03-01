import { pgEnum } from 'drizzle-orm/pg-core';

export const rolEnum = pgEnum('rol', ['admin', 'clienta']);

export const citaEstadoEnum = pgEnum('cita_estado', [
  'pendiente',
  'confirmada',
  'completada',
  'cancelada',
]);

export const citaServicioTipoEnum = pgEnum('cita_servicio_tipo', [
  'comprado',
  'canjeado',
]);
