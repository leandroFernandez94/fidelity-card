import { boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { citas } from './citas';
import { profiles } from './profiles';

export const recordatorios = pgTable('recordatorios', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienta_id: uuid('clienta_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  cita_id: uuid('cita_id')
    .notNull()
    .references(() => citas.id, { onDelete: 'cascade' }),
  enviado: boolean('enviado').notNull().default(false),
  fecha_envio: timestamp('fecha_envio', { withTimezone: true }),
});
