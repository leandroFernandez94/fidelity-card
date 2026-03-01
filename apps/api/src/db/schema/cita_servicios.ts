import { integer, pgTable, timestamp, uuid, unique } from 'drizzle-orm/pg-core';
import { citas } from './citas';
import { servicios } from './servicios';
import { citaServicioTipoEnum } from './enums';

export const citaServicios = pgTable(
  'cita_servicios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cita_id: uuid('cita_id')
      .notNull()
      .references(() => citas.id, { onDelete: 'cascade' }),
    servicio_id: uuid('servicio_id')
      .notNull()
      .references(() => servicios.id),
    tipo: citaServicioTipoEnum('tipo').notNull().default('comprado'),
    puntos_requeridos_snapshot: integer('puntos_requeridos_snapshot'),
    puntos_otorgados_snapshot: integer('puntos_otorgados_snapshot').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    unq: unique().on(t.cita_id, t.servicio_id),
  })
);
