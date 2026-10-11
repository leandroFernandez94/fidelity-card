import 'dotenv/config';
import { db, closeDb } from '../src/db/index.ts';
import { sql } from 'drizzle-orm';

// Guard de seguridad: el reset destruye datos, solo se permite contra bases locales.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
let dbHost = '';
try {
  // Normalizamos: WHATWG URL conserva los corchetes en IPv6 ([::1]) y no loweriza.
  dbHost = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).hostname.replace(/^\[|\]$/g, '').toLowerCase()
    : '';
} catch {
  dbHost = '';
}
if (!LOCAL_HOSTS.has(dbHost)) {
  console.error(
    `❌ Refusing to reset non-local database (host: ${dbHost || 'unknown'}). ` +
      'DATABASE_URL must point to localhost, 127.0.0.1 or ::1.'
  );
  process.exit(1);
}

async function resetDb() {
  console.log('🧹 Iniciando reset de la base de datos...');
  try {
    // Dropeamos el schema public (datos + estructura) y el schema drizzle (journal de
    // migraciones). Un TRUNCATE de public solo no alcanza: __drizzle_migrations
    // sobreviviria y db:migrate saltearia las migraciones de datos (baseline de
    // servicios/premios) que ya figuran como aplicadas.
    await db.execute(sql`DROP SCHEMA public CASCADE`);
    await db.execute(sql`CREATE SCHEMA public`);
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);

    console.log('✅ Schema reseteado (public + drizzle). Ejecuta bun run db:migrate para reconstruir.');
  } catch (error) {
    console.error('❌ Error en reset de la base de datos:', error);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

resetDb();
