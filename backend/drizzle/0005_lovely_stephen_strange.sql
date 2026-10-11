ALTER TABLE "servicios" ADD COLUMN "codigo" text;--> statement-breakpoint
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_codigo_unique" UNIQUE("codigo");--> statement-breakpoint

-- Datos: reemplazar servicios dummy del seed por el catalogo real
DELETE FROM "servicios" WHERE "nombre" IN ('Manicura Rusa', 'Esmaltado Semipermanente', 'Kapping Gel', 'Uñas Esculpidas (Acrílico)', 'Remoción Profesional') AND NOT EXISTS (SELECT 1 FROM "cita_servicios" cs WHERE cs."servicio_id" = "servicios"."id");--> statement-breakpoint
INSERT INTO "servicios" ("nombre", "codigo", "precio", "duracion_min", "puntos_otorgados") VALUES
  ('Manicura rusa + semipermanente sin nivelación', 'MANI_SIN_NIVELACION', 30, 60, 15),
  ('Manicura francesa', 'MANI_FRANCESA', 35, 90, 17),
  ('Nivelación + semipermanente', 'NIVELACION_SEMI', 40, 120, 20),
  ('Manicura rusa + refuerzo gel + semipermanente', 'REFUERZO_GEL_SEMI', 50, 120, 25),
  ('Retiro acrílico/gel + refuerzo + semipermanente', 'RETIRO_REFUERZO_SEMI', 55, 150, 27),
  ('Pedicura completa + semipermanente', 'PEDI_COMPLETA_SEMI', 45, 90, 22),
  ('Pedicura sin durezas + semipermanente', 'PEDI_SIN_DUREZAS_SEMI', 35, 60, 17),
  ('Pedicura completa sin esmaltar', 'PEDI_COMPLETA_SIN_ESMALTAR', 30, 45, 15);