-- Datos: catálogo definitivo de premios.
-- Reemplaza por completo el catálogo de 0006_premios_baseline (y cualquier premio
-- creado manualmente): tras esta migración la tabla contiene únicamente estos 9 premios.
DELETE FROM "premios";--> statement-breakpoint
INSERT INTO "premios" ("nombre", "descripcion", "puntos_requeridos", "activo") VALUES
  ('Nail art básico', '', 25, true),
  ('Aceite de cutículas o mini kit', '', 40, true),
  ('Ritual de hidratación', '', 50, true),
  ('Exfoliación de manos', '', 50, true),
  ('Masaje de manos', '', 60, true),
  ('10 € de descuento', '', 100, true),
  ('20 € de descuento', '', 200, true),
  ('30 € de descuento', '', 300, true),
  ('40 € de descuento', '', 400, true);
