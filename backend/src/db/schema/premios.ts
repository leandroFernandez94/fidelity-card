import { boolean, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const premios = pgTable('premios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion').notNull().default(''),
  puntos_requeridos: integer('puntos_requeridos').notNull(),
  activo: boolean('activo').notNull().default(true),
});
