import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { citaEstadoEnum } from './enums';
import { profiles } from './profiles';

export const citas = pgTable('citas', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienta_id: uuid('clienta_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  servicio_ids: uuid('servicio_ids').array().notNull(),
  fecha_hora: timestamp('fecha_hora', { withTimezone: true }).notNull(),
  puntos_ganados: integer('puntos_ganados').notNull().default(0),
  estado: citaEstadoEnum('estado').notNull().default('pendiente'),
  notas: text('notas'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
