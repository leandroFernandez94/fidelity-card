CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "servicios" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "citas" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "referidos" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "premios" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "recordatorios" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
