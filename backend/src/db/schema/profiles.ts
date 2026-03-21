import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { rolEnum } from './enums';
import { users } from './users';

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  apellido: text('apellido').notNull(),
  telefono: text('telefono').notNull(),
  email: text('email').notNull(),
  rol: rolEnum('rol').notNull().default('clienta'),
  puntos: integer('puntos').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
