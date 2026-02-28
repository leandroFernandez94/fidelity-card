CREATE TYPE "public"."cita_estado" AS ENUM('pendiente', 'confirmada', 'completada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."rol" AS ENUM('admin', 'clienta');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"apellido" text NOT NULL,
	"telefono" text NOT NULL,
	"email" text NOT NULL,
	"rol" "rol" DEFAULT 'clienta' NOT NULL,
	"puntos" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"precio" integer NOT NULL,
	"duracion_min" integer NOT NULL,
	"puntos_otorgados" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clienta_id" uuid NOT NULL,
	"servicio_ids" uuid[] NOT NULL,
	"fecha_hora" timestamp with time zone NOT NULL,
	"puntos_ganados" integer DEFAULT 0 NOT NULL,
	"estado" "cita_estado" DEFAULT 'pendiente' NOT NULL,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referidos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"referente_id" uuid NOT NULL,
	"referida_id" uuid NOT NULL,
	"puntos_ganados" integer NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"puntos_requeridos" integer NOT NULL,
	"activo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recordatorios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clienta_id" uuid NOT NULL,
	"cita_id" uuid NOT NULL,
	"enviado" boolean DEFAULT false NOT NULL,
	"fecha_envio" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_clienta_id_profiles_id_fk" FOREIGN KEY ("clienta_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referidos" ADD CONSTRAINT "referidos_referente_id_profiles_id_fk" FOREIGN KEY ("referente_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referidos" ADD CONSTRAINT "referidos_referida_id_profiles_id_fk" FOREIGN KEY ("referida_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_clienta_id_profiles_id_fk" FOREIGN KEY ("clienta_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_cita_id_citas_id_fk" FOREIGN KEY ("cita_id") REFERENCES "public"."citas"("id") ON DELETE cascade ON UPDATE no action;