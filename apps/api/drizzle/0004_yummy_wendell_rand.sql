CREATE TYPE "public"."cita_servicio_tipo" AS ENUM('comprado', 'canjeado');--> statement-breakpoint
CREATE TABLE "cita_servicios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cita_id" uuid NOT NULL,
	"servicio_id" uuid NOT NULL,
	"tipo" "cita_servicio_tipo" DEFAULT 'comprado' NOT NULL,
	"puntos_requeridos_snapshot" integer,
	"puntos_otorgados_snapshot" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cita_servicios_cita_id_servicio_id_unique" UNIQUE("cita_id","servicio_id")
);
--> statement-breakpoint
ALTER TABLE "servicios" ADD COLUMN "puntos_requeridos" integer;--> statement-breakpoint

-- Backfill: Insertar registros en cita_servicios basados en citas existentes
INSERT INTO "cita_servicios" ("cita_id", "servicio_id", "tipo", "puntos_otorgados_snapshot", "puntos_requeridos_snapshot")
SELECT 
    c.id as cita_id, 
    s_id as servicio_id, 
    'comprado'::cita_servicio_tipo as tipo,
    COALESCE(s.puntos_otorgados, 0) as puntos_otorgados_snapshot,
    s.puntos_requeridos as puntos_requeridos_snapshot
FROM 
    citas c,
    UNNEST(c.servicio_ids) s_id
LEFT JOIN 
    servicios s ON s.id = s_id;
--> statement-breakpoint

ALTER TABLE "cita_servicios" ADD CONSTRAINT "cita_servicios_cita_id_citas_id_fk" FOREIGN KEY ("cita_id") REFERENCES "public"."citas"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cita_servicios" ADD CONSTRAINT "cita_servicios_servicio_id_servicios_id_fk" FOREIGN KEY ("servicio_id") REFERENCES "public"."servicios"("id") ON DELETE no action ON UPDATE no action;