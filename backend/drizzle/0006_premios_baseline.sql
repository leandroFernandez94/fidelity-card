-- Datos: reemplazar los premios dummy del seed viejo (seed-premios) por el catalogo real.
-- Los premios custom creados via admin UI se preservan (el DELETE filtra por nombre).
DELETE FROM "premios" WHERE "nombre" IN ('Esmaltado Gratis', '50% Descuento en Kapping', 'Manicura Rusa Express', 'Decoración de 2 uñas', 'Kit de cuidado en casa');--> statement-breakpoint
INSERT INTO "premios" ("nombre", "descripcion", "puntos_requeridos", "activo") VALUES
  ('Esmaltado Gratis', 'Un esmaltado semipermanente totalmente gratis en tu próxima visita.', 100, true),
  ('50% Descuento en Kapping', 'Obtén un 50% de descuento en tu servicio de Kapping Gel.', 75, true),
  ('Manicura Rusa Express', 'Canjea tus puntos por una manicura rusa de mantenimiento.', 150, true),
  ('Decoración de 2 uñas', 'Nail art gratis en dos uñas de tu elección.', 30, true),
  ('Kit de cuidado en casa', 'Aceite de cutículas y lima profesional para el hogar.', 50, true);
