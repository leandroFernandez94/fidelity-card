import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const servicios = pgTable('servicios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion').notNull().default(''),
  precio: integer('precio').notNull(),
  duracion_min: integer('duracion_min').notNull(),
  puntos_otorgados: integer('puntos_otorgados').notNull().default(10),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
