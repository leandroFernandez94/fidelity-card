import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { profiles } from './profiles';

export const referidos = pgTable('referidos', {
  id: uuid('id').primaryKey().defaultRandom(),
  referente_id: uuid('referente_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  referida_id: uuid('referida_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  puntos_ganados: integer('puntos_ganados').notNull(),
  fecha: timestamp('fecha', { withTimezone: true }).notNull().defaultNow(),
});
